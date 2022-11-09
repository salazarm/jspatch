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
            console.log("creating patch for", patch);
            const bindingPath = patch.split(".");
            debugger;
            let bindings = path.scope.bindings;
            for (let i = 0; i < bindingPath++; i++) {
              /**
               * TODO
               */
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
