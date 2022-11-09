const ts = require("typescript");
const babelCore = require("@babel/core");
const crypto = require("crypto");

const patches = {}; // Record<string, string[]>

function patchRecorder(filename) {
  return (context) => {
    return {
      visitor: {
        CallExpression(path, rest) {
          if (path.node.callee.name !== "__patch") {
            return;
          }

          const [filepath, patchPath] = path.node.arguments || [];

          if (!filepath || !patchPath) {
            return;
          }
          patches[filepath.value] = patches[filepath.value] || new Set();
          patches[filepath.value].add(patchPath.value);
        },
      },
    };
  };
}

function patchingTransformer(filename) {
  return () => {
    return {
      visitor: {
        Program(path) {
          const patches = getPatchesForFile(filename);
          if (!patches.length) {
            return;
          }
          patches.forEach((patch) => {
            const patchHook = ts.transform(sourceFile, [patchHookTransform]);
            const bindingPath = patch.split(".");
            let bindings = path.scope.bindings[bindingPath[0]];
            for (let i = 1; i < bindingPath.length; i++) {
              if (bindings.path.isFunctionDeclaration()) {
                const nodes = bindings.path.node.body?.body || [];
                for (const node of nodes) {
                  if (node.type !== "VariableDeclaration") {
                    return;
                    // Need to handle destructing cases, assume its not destructuring for now
                  }
                  const id = node?.declarations?.[0]?.id;
                  if (id.type !== "Identifier" || id.name !== bindingPath[i]) {
                    return;
                  }
                  console.log("found node", id);
                  debugger;
                }
              }
            }
          });
        },
      },
    };
  };
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

console.log("creatingProgram from", __dirname + "/patch-hook.js");
const patchFile = __dirname + "/patch-hook.js";
const program = ts.createProgram([patchFile], {
  allowJs: true,
});
const sourceFile = program.getSourceFile(patchFile);

const patchHookTransform = (context) => {
  const visit = (node) => {
    switch (node?.name?.escapedText) {
      case "___PATCH_FACTORY__": {
        debugger;
      }
      case "___PATCH_GETTER__": {
        debugger;
      }

      case "{ORIGINAL_IMPLEMENTATION_PLACEHOLDER}": {
        debugger;
      }
    }
    return node;
  };
  return (node) => ts.visitNode(node, visit);
};

module.exports = {
  getCacheKey(fileData, filename, ...rest) {
    return Math.random().toString();
    // return crypto
    //   .createHash("md5")
    //   .update(fileData)
    //   .update(getPatchesForFile(filename).toString())
    //   .digest();
  },

  process(src, filename, ...rest) {
    // try {
    const isTest = filename.includes(".test.ts");

    const result = babelCore.transformSync(src, {
      presets: ["@babel/preset-typescript"],
      plugins: [
        // Test files have patches that need to be made
        // They are always processed before the tests that use the patches.
        isTest ? patchRecorder(filename) : patchingTransformer(filename),
      ],
      filename: filename,
    });

    return result;
    // } catch (e) {
    //   throw new Error(
    //     `JSMock: Failed to transform source file ${filename}. ${e}`
    //   );
    // }
  },
};

function isNodeExported(node) {
  return (
    (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0 ||
    (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
  );
}
