import * as ts from "typescript";
import * as babelCore from "@babel/core";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "node:path";

import api from "./api";

const patches: Record<string, Set<string>> = {};

/**
 * Copied from https://github.com/ajafff/TypeScript/blob/af19b77ca55175c6239089bcb64e31c6b09cdf0f/src/compiler/parser.ts#L560.
 * Not sure why its missing here...
 */
const forEachChildRecursively = (ts as any).forEachChildRecursively.bind(
  ts
) as <T>(
  rootNode: ts.Node,
  cbNode: (node: ts.Node, parent: ts.Node) => T | "skip" | undefined,
  cbNodes?: (
    nodes: ts.NodeArray<ts.Node>,
    parent: ts.Node
  ) => T | "skip" | undefined
) => T | undefined;

function process(src: string, filename: string) {
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
    // console.log(modifiedSource);
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

/**
 * Processes test files and records which files need to be patched aswell as the
 * variable selector.
 */
function testFilePatchRecorder(program: ts.SourceFile) {
  forEachChildRecursively(program, testFilePatchRecorderVisitor);
}
function testFilePatchRecorderVisitor(node: ts.Node) {
  if (!ts.isCallExpression(node)) {
    return;
  }
  // @ts-ignore
  if (node.expression.escapedText !== "___patch") {
    return;
  }
  const [filepath, variableSelector] = node.arguments || [];
  if (!ts.isStringLiteral(filepath) || !ts.isStringLiteral(variableSelector)) {
    throw new Error("Expecting __patch to have a filepath and a patch path");
  }
  patches[filepath.text] = patches[filepath.text] || new Set();
  patches[filepath.text].add(filepath.text + "|" + variableSelector.text);
}

// Counter for generating unique node ids
let __nodeId = 0;
const nodeToId = new WeakMap<ts.Node, string>();
function getNodeId(node: ts.Node): string {
  if (!nodeToId.has(node)) {
    nodeToId.set(node, "id:" + __nodeId++);
  }
  return nodeToId.get(node)!;
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

function filePatcher(program: ts.SourceFile, filename: string) {
  const patches = getPatchesForFile(filename);
  if (!patches.length) {
    return program;
  }

  const patchesToApply = new Map();

  const patchIdToNodes: Record<string, ts.Node[]> = {};

  patches.forEach((patchID) => {
    const [_, patch] = patchID.split("|");
    const nodesToPatch = getNodesToPatchRecursively(
      program,
      patch.split("."),
      0
    );
    patchIdToNodes[patchID] = nodesToPatch;
  });

  const patchIdToNodeIds: Record<string, string[]> = {};
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

      const result = ts.transform(patchSourceFile!, [
        (context) => {
          const visitor = (visitingNode: ts.Node): ts.Node => {
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
      // @ts-ignore
      const modifiedSourceFile = result.transformed[0].getSourceFile(filename);
      let patchNode;
      forEachChildRecursively(modifiedSourceFile, (node) => {
        // @ts-ignore
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

  const patchIdToNodesStatements: ts.SourceFile[] = [];
  patches.forEach((patchID) => {
    patchIdToNodesStatements.push(
      ts
        .transform(patchIdToNodesSourceFile!, [
          (context) => {
            const visitor = (visitingNode: ts.Node): ts.Node => {
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
        // @ts-ignore
        .transformed[0].getSourceFile(patchIdToNodesSourceFile)
    );
  });

  const transformed = ts
    .transform(program, [
      (context) => {
        let didAddStatements = false;
        const visitor: ts.Transformer<ts.Node> = (node: ts.Node) => {
          if (node.kind === 305 && !didAddStatements) {
            didAddStatements = true;
            // @ts-ignore
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
    // @ts-ignore
    .transformed[0].getSourceFile(filename);

  return transformed;
}

function getNodesToPatchRecursively(
  parentNode: ts.Node,
  variableSelector: string[],
  pathIndex: number
) {
  let nodes: ts.Node[] = [];
  const nextBinding = variableSelector[pathIndex];
  forEachChildRecursively(parentNode, (node: ts.Node, parent: ts.Node) => {
    if (ts.isIdentifier(node) && node.escapedText === nextBinding) {
      if (variableSelector[pathIndex + 1]) {
        nodes.push(
          ...getNodesToPatchRecursively(parent, variableSelector, pathIndex + 1)
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

function getPatchesForFile(filename: string) {
  const newSet = new Set<string>();
  Object.keys(patches).forEach((key) => {
    if (new RegExp(key + ".[jt]sx?", "g").test(filename)) {
      patches[key].forEach((patch) => newSet.add(patch));
    }
  });
  return Array.from(newSet);
}

const packageJson = fs.readFileSync(
  path.join(__dirname, "../../package.json"),
  "utf8"
);
if (!packageJson) {
  throw new Error("JSPatch: Could not find package.json");
}
const VERSION = JSON.parse(packageJson).version;

function getCacheKey(fileData: any, filename: string) {
  return crypto
    .createHash("md5")
    .update(VERSION)
    .update(fileData)
    .update(getPatchesForFile(filename).toString())
    .digest();
}

export default {
  getCacheKey,
  process,
  __patch: api.__patch,
};
