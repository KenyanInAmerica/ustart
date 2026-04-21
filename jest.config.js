const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^canvas$": "<rootDir>/test/mocks/canvas.js",
  },
};

module.exports = createJestConfig(customJestConfig);
