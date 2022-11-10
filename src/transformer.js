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

  const modifiedSource = printer.printNode(
    ts.EmitHint.Unspecified,
    modifiedProgram,
    modifiedProgram
  );

  const result = babelCore.transformSync(modifiedSource, {
    presets: ["@babel/preset-typescript"],
    filename: filename,
  });

  return result;
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

const patchFile = __dirname + "/patch-hook.js";
const program = ts.createProgram([patchFile], {
  allowJs: true,
});

const patchSourceFile = program.getSourceFile(patchFile);

function filePatcher(program, filename) {
  const patches = getPatchesForFile(filename);
  if (!patches.length) {
    return program;
  }
  const patchesToApply = new Map();
  patches.forEach((patchID) => {
    const [_, patch] = patchID.split("|");
    const nodesToPatch = getNodesToPatchRecursively(
      program,
      patch.split("."),
      0
    );
    nodesToPatch.forEach((node) => {
      const result = ts.transform(patchSourceFile, [
        (context) => {
          const visitor = (visitingNode, parent) => {
            if (ts.isStringLiteral(visitingNode)) {
              switch (visitingNode.text) {
                case "{PATCH_ID}": {
                  return context.factory.createStringLiteral(patchID);
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
        if (node?.arguments?.[0]?.text === patchID) {
          patchNode = node;
        }
      });
      if (!patchNode) {
        throw new Error("Unexpected error, could not find patched template");
      }
      patchesToApply.set(node, patchNode);
    });
  });

  const result = ts.transform(program, [
    (context) => {
      const visitor = (node) => {
        if (patchesToApply.has(node)) {
          return patchesToApply.get(node);
        }
        return ts.visitEachChild(node, visitor, context);
      };
      return visitor;
    },
  ]);
  return result.transformed[0].getSourceFile(filename);
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
        nodes.push(parent);
      }
    }
  });
  return nodes;
}

function getPatchesForFile(filename) {
  const newSet = new Set();
  Object.keys(patches).forEach((key) => {
    if (new RegExp(key + ".[jt]sx?", "g").test(filename)) {
      newSet.add(...patches[key]);
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
