/* eslint-disable @typescript-eslint/no-require-imports */
const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Путь к Next.js приложению
  dir: "./",
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: [
    "app/**/*.{js,jsx,ts,tsx}",
    "components/**/*.{js,jsx,ts,tsx}",
    "hooks/**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
    "!lib/**/*",
  ],
  coverageThreshold: {
    "components/**/*.{ts,tsx}": {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    "hooks/**/*.{ts,tsx}": {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    "app/api/**/*.{ts,tsx}": {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    "app/layout.tsx": {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    "app/page.tsx": {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
