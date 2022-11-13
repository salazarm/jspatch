// babel.config.js
module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    "@babel/preset-react",
    "@babel/preset-typescript",
  ],
  plugins: [
    "@babel/plugin-syntax-jsx",
    "@babel/plugin-transform-react-jsx",
    ["@babel/plugin-proposal-class-properties", { loose: true }],
    "syntax-trailing-function-commas",
    [
      "@babel/plugin-proposal-object-rest-spread",
      { loose: true, useBuiltIns: true },
    ],
    ["@babel/plugin-transform-template-literals", { loose: true }],
    "@babel/plugin-transform-literals",
    "@babel/plugin-transform-arrow-functions",
    "@babel/plugin-transform-block-scoped-functions",
    "@babel/plugin-transform-object-super",
    "@babel/plugin-transform-shorthand-properties",
    "@babel/plugin-transform-computed-properties",
    "@babel/plugin-transform-for-of",
    ["@babel/plugin-transform-spread", { loose: true, useBuiltIns: true }],
    "@babel/plugin-transform-parameters",
    [
      "@babel/plugin-transform-destructuring",
      { loose: true, useBuiltIns: true },
    ],
    ["@babel/plugin-transform-block-scoping", { throwIfClosureRequired: true }],
  ],
};
