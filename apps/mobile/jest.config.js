/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  testPathIgnorePatterns: ["/node_modules/", "/.expo/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
};
