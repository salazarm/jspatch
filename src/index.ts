import * as babelJest from "babel-jest";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "node:path";
import * as ts from "typescript";

import api from "./api";
import { create as createPatch } from "./createPatch";
import { create as createPatchIdToNodesAssignmentAST } from "./createPatchIdToNodesAssignmentAST";

import type { TransformOptions } from "@jest/transform";
import type { TransformOptions as BabelTransformOptions } from "@babel/core";

const patches: Record<string, Set<string>> = {};

const babelJestTransformer = babelJest.createTransformer({
  presets: [require.resolve("babel-preset-react-app")],
});

const DEBUG = false;

function forEachChildRecursively(
  sourceFile: ts.SourceFile,
  parentNode: ts.Node,
  visitor: (node: ts.Node, parent?: ts.Node) => void
) {
  visit(sourceFile, parentNode, undefined);
  function visit(sourceFile: ts.SourceFile, node: ts.Node, parent?: ts.Node) {
    visitor(node, parent);
    for (const child of node.getChildren(sourceFile)) {
      setNodeParent(child, node);
      visit(sourceFile, child, node);
    }
  }
}

function process(
  src: string,
  filename: string,
  options: TransformOptions<BabelTransformOptions>
) {
  if (DEBUG) {
    console.log("process", filename);
  }
  const isTest = filename.includes(".test.");
  const program = ts.createSourceFile(filename, src, ts.ScriptTarget.Latest);
  let modifiedProgram;
  if (isTest) {
    testFilePatchRecorder(program);
    modifiedProgram = program; // we dont modify it
    if (DEBUG) {
      console.log("found patches", patches);
    }
  } else {
    modifiedProgram = filePatcher(program, filename);
  }

  const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

  const modifiedSource = printer.printNode(
    ts.EmitHint.Unspecified,
    modifiedProgram,
    modifiedProgram
  );
  if (DEBUG && getPatchesForFile(filename).length) {
    console.log(modifiedSource);
  }
  return babelJestTransformer.process(modifiedSource, filename, options);
}

/**
 * Processes test files and records which files need to be patched aswell as the
 * variable selector.
 */
function testFilePatchRecorder(program: ts.SourceFile) {
  forEachChildRecursively(program, program, testFilePatchRecorderVisitor);
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

function filePatcher(program: ts.SourceFile, filename: string) {
  const patches = getPatchesForFile(filename);
  if (!patches.length) {
    if (DEBUG) {
      console.log("no patches", filename);
    }
    return program;
  }
  if (DEBUG) {
    console.log("has patches", filename);
  }

  const patchIdToNodes: Record<string, ts.Node[]> = {};
  const nodesToPatch = new Set<ts.Node>();

  patches.forEach((patchID) => {
    const [_, patch] = patchID.split("|");
    const nodes = getNodesToPatchRecursively(
      program,
      patch.split("."),
      0,
      program
    );
    patchIdToNodes[patchID] = nodes;
    nodes.forEach((node) => nodesToPatch.add(node));
  });

  if (DEBUG) {
    console.log("patchIdToNodes", patchIdToNodes);
  }

  const transformed = ts
    .transform(program, [
      (context) => {
        let didAddStatements = false;
        const visitor: ts.Transformer<ts.Node> = (node: ts.Node) => {
          if (ts.isSourceFile(node) && !didAddStatements) {
            didAddStatements = true;
            // @ts-ignore
            node.statements.unshift(
              ...patches
                .map((patchId: string, index: number) =>
                  createPatchIdToNodesAssignmentAST(
                    context.factory,
                    patchId,
                    patchIdToNodes[patchId].map((node) => getNodeId(node)),
                    index === 0
                  )
                )
                .flat()
            );
          }
          try {
            const newNode = ts.visitEachChild(node, visitor, context);
            if (nodesToPatch.has(node)) {
              return createPatch(
                context.factory,
                getNodeId(node),
                newNode,
                getNodeParent(node)
              );
            }
            return newNode;
          } catch (e) {
            return node;
          }
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
  pathIndex: number,
  sourceFile: ts.SourceFile
) {
  let nodes: ts.Node[] = [];
  const nextBinding = variableSelector[pathIndex];
  forEachChildRecursively(sourceFile, parentNode, (node: ts.Node) => {
    const parent = getNodeParent(node)!;
    if (ts.isIdentifier(node) && node.escapedText === nextBinding) {
      if (variableSelector[pathIndex + 1]) {
        nodes.push(
          ...getNodesToPatchRecursively(
            parent, // Use node parent instead of the identifier.
            variableSelector,
            pathIndex + 1,
            sourceFile
          )
        );
      } else {
        if (parent && ts.isVariableDeclaration(parent)) {
          /**
           * If this is a declaration then patch the value instead of the identifier.
           * // const someFunction = () => {..} ;
           */
          nodes.push(parent.getChildren()[2]);
        } else if (
          parent &&
          !ts.isImportSpecifier(parent) &&
          !ts.isImportOrExportSpecifier(parent) &&
          !ts.isExportDeclaration(parent) &&
          !ts.isPropertyAccessExpression(parent) &&
          !ts.isFunctionDeclaration(parent) &&
          !ts.isBindingElement(parent) &&
          !ts.isShorthandPropertyAssignment(parent)
        ) {
          nodes.push(node);
        }
      }
    }
  });
  return nodes;
}

const directorySeperatorRegex = /\\/g;
function getPatchesForFile(filename: string) {
  const newSet = new Set<string>();
  Object.keys(patches).forEach((key) => {
    // Genius windows compatability: turn the backslashes into forward slashes
    if (
      new RegExp(
        key.replaceAll(directorySeperatorRegex, "/") + ".[jt]sx?",
        "g"
      ).test(filename.replaceAll(directorySeperatorRegex, "/"))
    ) {
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
  if (DEBUG) {
    return Math.random().toString();
  }
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

const nodeParents = new WeakMap<ts.Node, ts.Node>();
function setNodeParent(node: ts.Node, parent: ts.Node) {
  nodeParents.set(node, parent);
}
function getNodeParent(node: ts.Node): undefined | ts.Node {
  return nodeParents.get(node);
}
