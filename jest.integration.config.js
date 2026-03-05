const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  displayName: "Integration Tests",
  testMatch: ["<rootDir>/tests/integration/**/*.test.{ts,tsx}"],
  setupFiles: ["<rootDir>/tests/setup/fetch-polyfill.ts"],
  setupFilesAfterEnv: [
    "<rootDir>/jest.setup.js",
    "<rootDir>/tests/setup/integration-setup.ts",
  ],
  testEnvironment: "jest-environment-jsdom",
  transformIgnorePatterns: [
    "/node_modules/(?!(msw|@mswjs|@bundled-es-modules)/)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: [
    "app/**/*.{js,jsx,ts,tsx}",
    "components/**/*.{js,jsx,ts,tsx}",
    "!app/api/**", // Exclude API routes from integration coverage
    "!app/layout.tsx", // Exclude root layout (infrastructure only)
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
    "!lib/**/*",
    "!**/__tests__/**",
  ],
  coverageDirectory: "coverage/integration",
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
    },
  },
  testTimeout: 30000, // Integration tests may take longer
};

// Export async config to properly override transformIgnorePatterns
module.exports = async () => {
  const config = await createJestConfig(customJestConfig)();
  config.transformIgnorePatterns = [
    "/node_modules/(?!(msw|@mswjs|@bundled-es-modules|until-async|strict-event-emitter|headers-polyfill)/)",
  ];
  return config;
};
