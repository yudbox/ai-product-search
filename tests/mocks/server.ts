import { setupServer } from "msw/node";
import { searchHandlers } from "./handlers/search.handlers";

// Create MSW server with all handlers
export const server = setupServer(...searchHandlers);

// Setup hooks for tests
export function setupMswServer() {
  // Establish API mocking before all tests
  beforeAll(() => {
    server.listen({
      onUnhandledRequest: "warn",
    });
  });

  // Reset any request handlers that are declared during tests
  afterEach(() => {
    server.resetHandlers();
  });

  // Clean up after all tests are done
  afterAll(() => {
    server.close();
  });
}
