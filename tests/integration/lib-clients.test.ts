/**
 * Integration tests for lib/openai.ts and lib/pinecone.ts
 * Testing client initialization and configuration
 */

import { openai } from "@/lib/openai";
import { pinecone, index } from "@/lib/pinecone";

// Mock OpenAI to allow testing in jsdom environment
jest.mock("openai", () => {
  return {
    OpenAI: jest.fn().mockImplementation(function (config: { apiKey: string }) {
      return {
        apiKey: config.apiKey,
        chat: {
          completions: {
            create: jest.fn(),
          },
        },
        embeddings: {
          create: jest.fn(),
        },
      };
    }),
  };
});

// Mock Pinecone to allow testing in jsdom environment
jest.mock("@pinecone-database/pinecone", () => {
  return {
    Pinecone: jest.fn().mockImplementation(function (config: {
      apiKey: string;
    }) {
      return {
        config,
        index: jest.fn((indexName: string) => ({
          namespace: jest.fn(() => ({
            query: jest.fn(),
            upsert: jest.fn(),
            fetch: jest.fn(),
            deleteOne: jest.fn(),
          })),
          _indexName: indexName,
        })),
      };
    }),
  };
});

describe("Integration: lib/openai", () => {
  beforeEach(() => {
    // Clear module cache to ensure fresh imports
    jest.resetModules();
  });

  it("should export openai client instance", () => {
    // Import to ensure coverage
    expect(openai).toBeDefined();
    expect(openai).toHaveProperty("chat");
    expect(openai).toHaveProperty("embeddings");
  });

  it("should have correct configuration", () => {
    expect(openai).toBeDefined();
    expect(openai.apiKey).toBe("test-openai-api-key");
  });

  it("should be usable for embeddings", () => {
    // Verify the client has the embeddings API
    expect(openai.embeddings).toBeDefined();
    expect(typeof openai.embeddings.create).toBe("function");
  });

  it("should be usable for chat completions", () => {
    // Verify the client has the chat API
    expect(openai.chat).toBeDefined();
    expect(openai.chat.completions).toBeDefined();
    expect(typeof openai.chat.completions.create).toBe("function");
  });

  it("should throw error if OPENAI_API_KEY is not set", () => {
    // Save original value
    const originalKey = process.env.OPENAI_API_KEY;

    // Delete the key
    delete process.env.OPENAI_API_KEY;

    // Clear module cache
    jest.resetModules();

    // Should throw when trying to import
    expect(() => {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require("@/lib/openai");
      });
    }).toThrow("OPENAI_API_KEY is not set");

    // Restore the key
    process.env.OPENAI_API_KEY = originalKey;
  });
});

describe("Integration: lib/pinecone", () => {
  beforeEach(() => {
    // Clear module cache to ensure fresh imports
    jest.resetModules();
  });

  it("should export pinecone client instance", () => {
    expect(pinecone).toBeDefined();
    expect(index).toBeDefined();
  });

  it("should have correct configuration", () => {
    expect(pinecone).toBeDefined();
    expect(pinecone).toHaveProperty("config");
  });

  it("should export index instance", () => {
    expect(index).toBeDefined();
    // Verify index has expected methods
    expect(index).toHaveProperty("namespace");
  });

  it("should create index with correct name", () => {
    // This test ensures the index creation line is executed
    expect(index).toBeDefined();
    expect(pinecone).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((index as any)._indexName).toBe("test-index");
  });

  it("should be ready for vector operations", () => {
    // Verify index has vector operation methods
    expect(index).toBeDefined();
    expect(typeof index.namespace).toBe("function");
  });

  it("should throw error if PINECONE_API_KEY is not set", () => {
    // Save original value
    const originalKey = process.env.PINECONE_API_KEY;

    // Delete the key
    delete process.env.PINECONE_API_KEY;

    // Clear module cache
    jest.resetModules();

    // Should throw when trying to import
    expect(() => {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require("@/lib/pinecone");
      });
    }).toThrow("PINECONE_API_KEY is not set");

    // Restore the key
    process.env.PINECONE_API_KEY = originalKey;
  });

  it("should throw error if PINECONE_INDEX_NAME is not set", () => {
    // Save original value
    const originalIndexName = process.env.PINECONE_INDEX_NAME;

    // Delete the index name
    delete process.env.PINECONE_INDEX_NAME;

    // Clear module cache
    jest.resetModules();

    // Should throw when trying to import
    expect(() => {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require("@/lib/pinecone");
      });
    }).toThrow("PINECONE_INDEX_NAME is not set");

    // Restore the index name
    process.env.PINECONE_INDEX_NAME = originalIndexName;
  });
});

describe("Integration: Client initialization flow", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("should initialize both OpenAI and Pinecone clients", () => {
    expect(openai).toBeDefined();
    expect(pinecone).toBeDefined();
    expect(index).toBeDefined();
  });

  it("should have environment variables configured", () => {
    expect(process.env.OPENAI_API_KEY).toBe("test-openai-api-key");
    expect(process.env.PINECONE_API_KEY).toBe("test-pinecone-api-key");
    expect(process.env.PINECONE_INDEX_NAME).toBe("test-index");
  });
});
