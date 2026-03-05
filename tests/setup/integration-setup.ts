import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { setupMswServer } from "../mocks/server";

// Mock IntersectionObserver for tests
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Setup MSW server for all integration tests
setupMswServer();

// Cleanup React components after each test
afterEach(() => {
  cleanup();
});

// Suppress console errors for expected test scenarios
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("act(...)") ||
        args[0].includes("ReactDOM.render") ||
        args[0].includes("Search error") ||
        args[0].includes("cannot be a child of") ||
        args[0].includes("non-boolean attribute") ||
        args[0].includes("IntersectionObserver"))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
