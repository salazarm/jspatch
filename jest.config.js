/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    // "^.+\\.[jt]sx?$": "babel-jest",
    "^.+\\.tsx?$": "<rootDir>/src/transformer.js",
  },
};
