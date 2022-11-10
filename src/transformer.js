const ts = require("typescript");
const babelCore = require("@babel/core");
const crypto = require("crypto");
const path = require("path");

const patches = {}; // Record<string, string[]>

function process(src, filename) {
  const isTest = filename.includes(".test.ts");
  const program = ts.createSourceFile(filename, src, ts.ScriptTarget.Latest);
  let modifiedProgram;
  if (isTest) {
    testFilePatchRecorder(program);
    modifiedProgram = program; // we dont modify it
  } else {
    modifiedProgram = filePatcher(program, filename);
  }

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

  try {
    const modifiedSource = printer.printNode(
      ts.EmitHint.Unspecified,
      modifiedProgram,
      modifiedProgram
    );
    // if (getPatchesForFile(filename).length) {
    //   console.log(modifiedSource);
    // }
    return babelCore.transformSync(modifiedSource, {
      presets: ["@babel/preset-typescript"],
      filename: filename,
    });
  } catch (e) {
    console.error(e);
    return babelCore.transformSync(src, {
      presets: ["@babel/preset-typescript"],
      filename: filename,
    });
  }
}

function testFilePatchRecorder(program) {
  ts.forEachChildRecursively(program, testFilePatchRecorderVisitor);
}
function testFilePatchRecorderVisitor(node) {
  if (!ts.isCallExpression(node)) {
    return;
  }
  if (node.expression.escapedText !== "___patch") {
    return;
  }
  const [filepath, patchPath] = node.arguments || [];
  if (!filepath || !patchPath) {
    throw new Error("Expecting __patch to have a filepath and a patch path");
  }
  patches[filepath.text] = patches[filepath.text] || new Set();
  patches[filepath.text].add(filepath.text + "|" + patchPath.text);
}

// Counter for generating unique node ids
let __nodeId = 0;
const nodeToId = new WeakMap();
function getNodeId(node) {
  if (!nodeToId.has(node)) {
    nodeToId.set(node, "id:" + __nodeId++);
  }
  return nodeToId.get(node);
}

const patchIdToNodesFile = __dirname + "/patchIdToNodesTemplate.js";
const patchIdToNodesProgram = ts.createProgram([patchIdToNodesFile], {
  allowJs: true,
});
const patchIdToNodesSourceFile =
  patchIdToNodesProgram.getSourceFile(patchIdToNodesFile);

const patchFile = __dirname + "/patchTemplate.js";
const program = ts.createProgram([patchFile], { allowJs: true });

const patchSourceFile = program.getSourceFile(patchFile);

function filePatcher(program, filename) {
  const patches = getPatchesForFile(filename);
  if (!patches.length) {
    return program;
  }

  const patchesToApply = new Map();

  const patchIdToNodes = {};

  patches.forEach((patchID) => {
    const [_, patch] = patchID.split("|");
    const nodesToPatch = getNodesToPatchRecursively(
      program,
      patch.split("."),
      0
    );
    patchIdToNodes[patchID] = nodesToPatch;
  });

  const patchIdToNodeIds = {};

  patches.forEach((patchID) => {
    patchIdToNodes[patchID].forEach((node) => {
      if (nodeToId.has(node)) {
        patchIdToNodeIds[patchID] = patchIdToNodeIds[patchID] || [];
        patchIdToNodeIds[patchID].push(getNodeId(node));
        return;
      }
      const nodeID = getNodeId(node);
      patchIdToNodeIds[patchID] = patchIdToNodeIds[patchID] || [];
      patchIdToNodeIds[patchID].push(nodeID);

      const result = ts.transform(patchSourceFile, [
        (context) => {
          const visitor = (visitingNode, parent) => {
            if (ts.isStringLiteral(visitingNode)) {
              switch (visitingNode.text) {
                case "{PATCH_ID}": {
                  return context.factory.createStringLiteral(nodeID);
                }
                case "{ORIGINAL_IMPLEMENTATION_PLACEHOLDER}": {
                  return node;
                }
              }
            }
            return ts.visitEachChild(visitingNode, visitor, context);
          };
          return visitor;
        },
      ]);
      const modifiedSourceFile = result.transformed[0].getSourceFile(filename);
      let patchNode;
      ts.forEachChildRecursively(modifiedSourceFile, (node) => {
        if (node?.arguments?.[0]?.text == nodeID) {
          patchNode = node;
        }
      });
      if (!patchNode) {
        throw new Error(
          "Unexpected error, could not find patched template for node id:" +
            nodeID
        );
      }
      patchesToApply.set(node, patchNode);
    });
  });

  const patchIdToNodesStatements = [];
  patches.forEach((patchID) => {
    patchIdToNodesStatements.push(
      ts
        .transform(patchIdToNodesSourceFile, [
          (context) => {
            const visitor = (visitingNode) => {
              if (ts.isStringLiteral(visitingNode)) {
                switch (visitingNode.text) {
                  case "{PATCH_ID}": {
                    return context.factory.createStringLiteral(patchID);
                  }
                  case "{NODE_IDS}": {
                    return context.factory.createArrayLiteralExpression(
                      patchIdToNodeIds[patchID].map((id) =>
                        context.factory.createStringLiteral(id)
                      )
                    );
                  }
                }
              }
              return ts.visitEachChild(visitingNode, visitor, context);
            };
            return visitor;
          },
        ])
        .transformed[0].getSourceFile(patchIdToNodesSourceFile)
    );
  });

  const transformed = ts
    .transform(program, [
      (context) => {
        let rootNode;
        let didAddStatements = false;
        const visitor = (node) => {
          if (node.kind === 305 && !didAddStatements) {
            didAddStatements = true;
            node.statements.push(...patchIdToNodesStatements);
          }
          if (patchesToApply.has(node)) {
            return patchesToApply.get(node);
          }
          return ts.visitEachChild(node, visitor, context);
        };
        return visitor;
      },
    ])
    .transformed[0].getSourceFile(filename);

  return transformed;
}

function getNodesToPatchRecursively(parentNode, bindingPath, pathIndex) {
  let nodes = [];
  const nextBinding = bindingPath[pathIndex];
  ts.forEachChildRecursively(parentNode, (node, parent) => {
    if (ts.isIdentifier(node) && node.escapedText === nextBinding) {
      if (bindingPath[pathIndex + 1]) {
        nodes.push(
          ...getNodesToPatchRecursively(parent, bindingPath, pathIndex + 1)
        );
      } else {
        if (!ts.isVariableDeclaration(parent)) {
          nodes.push(node);
        }
      }
    }
  });
  return nodes;
}

function getPatchesForFile(filename) {
  const newSet = new Set();
  Object.keys(patches).forEach((key) => {
    if (new RegExp(key + ".[jt]sx?", "g").test(filename)) {
      patches[key].forEach((patch) => newSet.add(patch));
    }
  });
  return Array.from(newSet);
}

module.exports = {
  getCacheKey(fileData, filename, ...rest) {
    return Math.random().toString();
    // return crypto
    //   .createHash("md5")
    //   .update(fileData)
    //   .update(getPatchesForFile(filename).toString())
    //   .digest();
  },
  process,
};
