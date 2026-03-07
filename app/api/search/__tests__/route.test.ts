/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - Test file with extensive mocking
// Mock dependencies BEFORE importing route
jest.mock("@/lib/openai", () => ({
  openai: {
    embeddings: {
      create: jest.fn(),
    },
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
}));

jest.mock("@/lib/pinecone", () => ({
  index: {
    namespace: jest.fn(),
  },
}));

jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      status: options?.status || 200,
      json: async () => data,
      data,
    })),
  },
}));

// Now import the route
import { POST } from "../route";
import { NextResponse } from "next/server";
import { Gender } from "@/lib/types";
import { openai } from "@/lib/openai";
import { index } from "@/lib/pinecone";

const mockOpenai = jest.mocked(openai);
const mockIndex = jest.mocked(index);

// Suppress console.error for expected errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    // Suppress expected error messages from error handling tests
    if (typeof args[0] === "string" && args[0].includes("❌ Search error")) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

describe("POST /api/search", () => {
  const mockEmbedding = new Array(768).fill(0.1);
  const mockProducts = [
    {
      id: "1",
      score: 0.9,
      metadata: {
        name: "Nike Air Max",
        description: "Running shoes",
        price: 120,
        image: "https://example.com/image1.jpg",
        brand: "Nike",
        category: "Running Shoes",
        color: "Black",
        sizes: [8, 9, 10],
        inStock: true,
        rating: 4.5,
        features: ["Comfortable", "Durable"],
        gender: Gender.Men,
      },
    },
    {
      id: "2",
      score: 0.8,
      metadata: {
        name: "Adidas Ultraboost",
        description: "Training shoes",
        price: 160,
        image: "https://example.com/image2.jpg",
        brand: "Adidas",
        category: "Training Shoes",
        color: "White",
        sizes: [9, 10, 11],
        inStock: true,
        rating: 4.8,
        features: ["Lightweight", "Responsive"],
        gender: Gender.Women,
      },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks for embeddings
    mockOpenai.embeddings.create.mockResolvedValue({
      data: [{ embedding: mockEmbedding }],
    });

    // Setup chat completions mock for parseQueryWithLLM
    mockOpenai.chat.completions.create.mockImplementation(
      async ({ messages }: any) => {
        const userMessage = messages.find((m: any) => m.role === "user");
        const query = userMessage?.content || "";

        // Parse price from query text
        let minPrice: number | undefined;
        let maxPrice: number | undefined;
        let semanticQuery = query;

        // Extract "under $X", "below $X", or "less than $X"
        const underMatch = query.match(
          /(?:under|below|less\s+than)\s+\$?(\d+)/i,
        );
        if (underMatch) {
          maxPrice = parseInt(underMatch[1]);
          semanticQuery = query.replace(underMatch[0], "").trim();
        }

        // Extract "above $X", "over $X", or "more than $X"
        const aboveMatch = query.match(
          /(?:above|over|more\s+than)\s+\$?(\d+)/i,
        );
        if (aboveMatch) {
          minPrice = parseInt(aboveMatch[1]);
          semanticQuery = query.replace(aboveMatch[0], "").trim();
        }

        // Handle "between $X and $Y" or "$X to $Y"
        const betweenMatch = query.match(/\$?(\d+)\s+(?:to|and)\s+\$?(\d+)/i);
        if (betweenMatch) {
          minPrice = parseInt(betweenMatch[1]);
          maxPrice = parseInt(betweenMatch[2]);
        }

        const parsedResult = {
          isRelevant: true,
          semanticQuery: semanticQuery || query,
          originalQuery: query,
          ...(minPrice !== undefined && { minPrice }),
          ...(maxPrice !== undefined && { maxPrice }),
        };

        return {
          choices: [
            {
              message: {
                content: JSON.stringify(parsedResult),
              },
            },
          ],
        };
      },
    );

    const mockNamespace = {
      query: jest.fn().mockResolvedValue({
        matches: mockProducts,
      }),
    };

    mockIndex.namespace.mockReturnValue(mockNamespace);
  });

  it("returns 400 when query is missing", async () => {
    const req = {
      json: async () => ({ query: "" }),
    } as unknown as Request;

    await POST(req);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Query is required" },
      { status: 400 },
    );
  });

  it("returns 400 when query is only whitespace", async () => {
    const req = {
      json: async () => ({ query: "   " }),
    } as unknown as Request;

    await POST(req);

    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: "Query is required" },
      { status: 400 },
    );
  });

  it("successfully processes search request", async () => {
    const req = {
      json: async () => ({ query: "running shoes" }),
    } as unknown as Request;

    await POST(req);

    expect(mockOpenai.embeddings.create).toHaveBeenCalledWith({
      model: "test-embedding-model",
      input: "running shoes",
    });

    expect(mockIndex.namespace).toHaveBeenCalledWith("test-namespace");

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.success).toBe(true);
    expect(callArgs.query).toBe("running shoes");
    expect(callArgs.products).toHaveLength(2);
  });

  it("trims and lowercases query for embedding", async () => {
    const req = {
      json: async () => ({ query: "  Nike SHOES  " }),
    } as unknown as Request;

    await POST(req);

    expect(mockOpenai.embeddings.create).toHaveBeenCalledWith({
      model: "test-embedding-model",
      input: "nike shoes",
    });
  });

  it("filters products by price range 0-80", async () => {
    const req = {
      json: async () => ({
        query: "shoes",
        filters: {
          priceRange: ["0-80"],
        },
      }),
    } as unknown as Request;

    await POST(req);

    // Verify Pinecone was called with price filter
    const mockNamespace = mockIndex.namespace.mock.results[0].value;
    const queryCall = mockNamespace.query.mock.calls[0][0];
    expect(queryCall.filter?.price).toEqual({ $gte: 0, $lte: 80 });
  });

  it("filters products by price range 80-150", async () => {
    const req = {
      json: async () => ({
        query: "shoes",
        filters: {
          priceRange: ["80-150"],
        },
      }),
    } as unknown as Request;

    await POST(req);

    // Verify Pinecone was called with price filter
    const mockNamespace = mockIndex.namespace.mock.results[0].value;
    const queryCall = mockNamespace.query.mock.calls[0][0];
    expect(queryCall.filter?.price).toEqual({ $gte: 80, $lte: 150 });
  });

  it("filters products by price range 150+", async () => {
    const req = {
      json: async () => ({
        query: "shoes",
        filters: {
          priceRange: ["150+"],
        },
      }),
    } as unknown as Request;

    await POST(req);

    // Verify Pinecone was called with price filter
    const mockNamespace = mockIndex.namespace.mock.results[0].value;
    const queryCall = mockNamespace.query.mock.calls[0][0];
    expect(queryCall.filter?.price).toEqual({ $gte: 150, $lte: 10000 });
  });

  it("filters products by brand", async () => {
    const req = {
      json: async () => ({
        query: "shoes",
        filters: {
          brands: ["Nike"],
        },
      }),
    } as unknown as Request;

    await POST(req);

    // Verify Pinecone was called with brand filter
    const mockNamespace = mockIndex.namespace.mock.results[0].value;
    const queryCall = mockNamespace.query.mock.calls[0][0];
    expect(queryCall.filter?.brand).toEqual({ $in: ["Nike"] });
  });

  it("filters products by category", async () => {
    const req = {
      json: async () => ({
        query: "shoes",
        filters: {
          categories: ["Running Shoes"],
        },
      }),
    } as unknown as Request;

    await POST(req);

    // Categories are not filtered in Pinecone (intentionally disabled)
    // Just verify the API call succeeds
    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.success).toBe(true);
  });

  it("applies multiple filters", async () => {
    const req = {
      json: async () => ({
        query: "shoes",
        filters: {
          brands: ["Nike"],
          priceRange: ["80-150"],
        },
      }),
    } as unknown as Request;

    await POST(req);

    // Verify Pinecone was called with both filters
    const mockNamespace = mockIndex.namespace.mock.results[0].value;
    const queryCall = mockNamespace.query.mock.calls[0][0];
    expect(queryCall.filter?.brand).toEqual({ $in: ["Nike"] });
    expect(queryCall.filter?.price).toEqual({ $gte: 80, $lte: 150 });
  });

  it("returns products when filters are applied", async () => {
    const req = {
      json: async () => ({
        query: "shoes",
        filters: {
          brands: ["Nike"],
        },
      }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.success).toBe(true);
    expect(callArgs.products).toBeDefined();
  });

  it("returns all topK results without slicing", async () => {
    const manyProducts = Array.from({ length: 50 }, (_, i) => ({
      id: `${i}`,
      score: 0.9,
      metadata: {
        name: `Product ${i}`,
        description: "Test product",
        price: 100,
        image: "https://example.com/image.jpg",
        brand: "TestBrand",
        category: "Test",
        color: "Black",
        sizes: [8, 9, 10],
        inStock: true,
        rating: 4.5,
        features: ["Feature"],
        gender: Gender.Unisex,
      },
    }));

    const mockNamespace = {
      query: jest.fn().mockResolvedValue({
        matches: manyProducts,
      }),
    };
    mockIndex.namespace.mockReturnValue(mockNamespace);

    const req = {
      json: async () => ({ query: "shoes" }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    // Should return all 50 products (batching handled on client)
    expect(callArgs.products).toHaveLength(50);
  });

  it("includes performance metrics", async () => {
    const req = {
      json: async () => ({ query: "shoes" }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.performance).toBeDefined();
    expect(callArgs.performance.embedding).toMatch(/\d+ms/);
    expect(callArgs.performance.search).toMatch(/\d+ms/);
    expect(callArgs.performance.total).toMatch(/\d+ms/);
  });

  it("generates explanation for results", async () => {
    const req = {
      json: async () => ({ query: "running shoes" }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.explanation).toContain("Found 2 products");
    expect(callArgs.explanation).toContain("running shoes");
    expect(callArgs.explanation).toContain("Nike Air Max");
  });

  it("generates explanation for no results", async () => {
    const mockNamespace = {
      query: jest.fn().mockResolvedValue({
        matches: [],
      }),
    };
    mockIndex.namespace.mockReturnValue(mockNamespace);

    const req = {
      json: async () => ({ query: "nonexistent" }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.explanation).toContain("No products found");
    expect(callArgs.explanation).toContain("nonexistent");
  });

  it("handles OpenAI API errors", async () => {
    mockOpenai.embeddings.create.mockRejectedValue(
      new Error("OpenAI API error"),
    );

    const req = {
      json: async () => ({ query: "shoes" }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0];
    expect(callArgs[0]).toMatchObject({
      success: false,
      error: "Search failed",
      details: "OpenAI API error",
      query: "shoes",
      count: 0,
      products: [],
    });
    expect(callArgs[1]).toEqual({ status: 500 });
  });

  it("handles Pinecone API errors", async () => {
    const mockNamespace = {
      query: jest.fn().mockRejectedValue(new Error("Pinecone query failed")),
    };
    mockIndex.namespace.mockReturnValue(mockNamespace);

    const req = {
      json: async () => ({ query: "shoes" }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0];
    expect(callArgs[0]).toMatchObject({
      success: false,
      error: "Search failed",
      details: "Pinecone query failed",
      query: "shoes",
      count: 0,
      products: [],
    });
    expect(callArgs[1]).toEqual({ status: 500 });
  });

  it("handles malformed request body", async () => {
    const req = {
      json: async () => {
        throw new Error("Invalid JSON");
      },
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0];
    expect(callArgs[0]).toMatchObject({
      success: false,
      error: "Search failed",
      details: "Invalid JSON",
      query: "",
      count: 0,
      products: [],
    });
    expect(callArgs[1]).toEqual({ status: 500 });
  });

  it("handles missing metadata fields", async () => {
    const mockNamespace = {
      query: jest.fn().mockResolvedValue({
        matches: [
          {
            id: "1",
            score: 0.9,
            metadata: {
              name: "Test Product",
              // Missing most fields
            },
          },
        ],
      }),
    };
    mockIndex.namespace.mockReturnValue(mockNamespace);

    const req = {
      json: async () => ({ query: "shoes" }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.products).toHaveLength(1);
    expect(callArgs.products[0].name).toBe("Test Product");
    expect(callArgs.products[0].description).toBe("");
    expect(callArgs.products[0].price).toBe(0);
    expect(callArgs.products[0].inStock).toBe(true); // Default
  });

  it("sets inStock to true when not explicitly false", async () => {
    const mockNamespace = {
      query: jest.fn().mockResolvedValue({
        matches: [
          {
            id: "1",
            score: 0.9,
            metadata: {
              name: "Product 1",
              price: 100,
              // inStock not set
            },
          },
        ],
      }),
    };
    mockIndex.namespace.mockReturnValue(mockNamespace);

    const req = {
      json: async () => ({ query: "shoes" }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.products[0].inStock).toBe(true);
  });

  it("filters by multiple price ranges", async () => {
    const req = {
      json: async () => ({
        query: "shoes",
        filters: {
          priceRange: ["80-150", "150+"],
        },
      }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.products).toHaveLength(2); // Nike in 80-150, Adidas in 150+
  });

  it("filters by multiple brands", async () => {
    const req = {
      json: async () => ({
        query: "shoes",
        filters: {
          brands: ["Nike", "Adidas"],
        },
      }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.products).toHaveLength(2);
  });

  it("extracts max price from query text (under)", async () => {
    const req = {
      json: async () => ({
        query: "basketball shoes under $100",
      }),
    } as unknown as Request;

    await POST(req);

    // Verify Pinecone was called with maxPrice filter
    const mockNamespace = mockIndex.namespace.mock.results[0].value;
    const queryCall = mockNamespace.query.mock.calls[0][0];
    expect(queryCall.filter?.price?.$lte).toBe(100);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.explanation).toContain("under $100");
  });

  it("extracts max price from query text (below)", async () => {
    const req = {
      json: async () => ({
        query: "shoes below $120",
      }),
    } as unknown as Request;

    await POST(req);

    // Verify Pinecone was called with maxPrice filter
    const mockNamespace = mockIndex.namespace.mock.results[0].value;
    const queryCall = mockNamespace.query.mock.calls[0][0];
    expect(queryCall.filter?.price?.$lte).toBe(120);
  });

  it("extracts max price from query text (less than)", async () => {
    const req = {
      json: async () => ({
        query: "running shoes less than $90",
      }),
    } as unknown as Request;

    await POST(req);

    // Verify Pinecone was called with maxPrice filter
    const mockNamespace = mockIndex.namespace.mock.results[0].value;
    const queryCall = mockNamespace.query.mock.calls[0][0];
    expect(queryCall.filter?.price?.$lte).toBe(90);
  });

  it("extracts min price from query text (over)", async () => {
    const req = {
      json: async () => ({
        query: "shoes over $100",
      }),
    } as unknown as Request;

    await POST(req);

    // Verify Pinecone was called with minPrice filter
    const mockNamespace = mockIndex.namespace.mock.results[0].value;
    const queryCall = mockNamespace.query.mock.calls[0][0];
    expect(queryCall.filter?.price?.$gte).toBe(100);
  });

  it("extracts min price from query text (above)", async () => {
    const req = {
      json: async () => ({
        query: "shoes above $150",
      }),
    } as unknown as Request;

    await POST(req);

    // Verify Pinecone was called with minPrice filter
    const mockNamespace = mockIndex.namespace.mock.results[0].value;
    const queryCall = mockNamespace.query.mock.calls[0][0];
    expect(queryCall.filter?.price?.$gte).toBe(150);
  });

  it("handles both min and max price constraints", async () => {
    const req = {
      json: async () => ({
        query: "shoes over $80 and under $150",
      }),
    } as unknown as Request;

    await POST(req);

    // Verify Pinecone was called with both min and max price filters
    const mockNamespace = mockIndex.namespace.mock.results[0].value;
    const queryCall = mockNamespace.query.mock.calls[0][0];
    expect(queryCall.filter?.price?.$gte).toBe(80);
    expect(queryCall.filter?.price?.$lte).toBe(150);
  });

  it("price constraints work with UI filters", async () => {
    const req = {
      json: async () => ({
        query: "shoes under $150",
        filters: {
          brands: ["Nike"],
        },
      }),
    } as unknown as Request;

    await POST(req);

    // Verify Pinecone was called with both price and brand filters
    const mockNamespace = mockIndex.namespace.mock.results[0].value;
    const queryCall = mockNamespace.query.mock.calls[0][0];
    expect(queryCall.filter?.price?.$lte).toBe(150);
    expect(queryCall.filter?.brand).toEqual({ $in: ["Nike"] });
  });

  it("handles query with price but no matching products", async () => {
    const req = {
      json: async () => ({
        query: "shoes under $10",
      }),
    } as unknown as Request;

    await POST(req);

    // Verify Pinecone was called with very low price filter
    const mockNamespace = mockIndex.namespace.mock.results[0].value;
    const queryCall = mockNamespace.query.mock.calls[0][0];
    expect(queryCall.filter?.price?.$lte).toBe(10);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.explanation).toContain("$10");
  });

  it("rejects non-footwear queries", async () => {
    mockOpenai.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              isRelevant: false,
              rejectionReason: "not_footwear",
              semanticQuery: "laptop",
              originalQuery: "laptop",
              suggestedQuery: "running shoes",
            }),
          },
        },
      ],
    });

    const req = {
      json: async () => ({ query: "laptop" }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.success).toBe(false);
    expect(callArgs.rejected).toBe(true);
    expect(callArgs.rejectionReason).toBe("not_footwear");
    expect(callArgs.explanation).toContain("not a shoe product");
    expect(callArgs.suggestedQuery).toBe("running shoes");
    expect(callArgs.performance.embedding).toBe("0ms");
  });

  it("rejects questions instead of search queries", async () => {
    mockOpenai.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              isRelevant: false,
              rejectionReason: "question_not_search",
              semanticQuery: "what are the best shoes",
              originalQuery: "what are the best shoes",
              suggestedQuery: "Nike sneakers",
            }),
          },
        },
      ],
    });

    const req = {
      json: async () => ({ query: "what are the best shoes" }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.success).toBe(false);
    expect(callArgs.rejected).toBe(true);
    expect(callArgs.rejectionReason).toBe("question_not_search");
    expect(callArgs.explanation).toContain(
      "search for products instead of asking questions",
    );
    expect(callArgs.suggestedQuery).toBe("Nike sneakers");
  });

  it("rejects nonsense queries", async () => {
    mockOpenai.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              isRelevant: false,
              rejectionReason: "nonsense",
              semanticQuery: "asdfghjkl",
              originalQuery: "asdfghjkl",
            }),
          },
        },
      ],
    });

    const req = {
      json: async () => ({ query: "asdfghjkl" }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.success).toBe(false);
    expect(callArgs.rejected).toBe(true);
    expect(callArgs.rejectionReason).toBe("nonsense");
    expect(callArgs.explanation).toContain("couldn't understand");
  });

  it("handles rejection without suggestion", async () => {
    mockOpenai.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              isRelevant: false,
              rejectionReason: "not_footwear",
              semanticQuery: "car",
              originalQuery: "car",
            }),
          },
        },
      ],
    });

    const req = {
      json: async () => ({ query: "car" }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.success).toBe(false);
    expect(callArgs.explanation).toContain("not a shoe product");
    expect(callArgs.explanation).not.toContain("Try searching for");
  });

  it("generates explanation with gender filter", async () => {
    mockOpenai.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              isRelevant: true,
              semanticQuery: "running shoes",
              originalQuery: "women's running shoes",
              gender: "women",
            }),
          },
        },
      ],
    });

    const req = {
      json: async () => ({ query: "women's running shoes" }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.explanation).toContain("women's shoes");
  });

  it("generates explanation with color filter", async () => {
    mockOpenai.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              isRelevant: true,
              semanticQuery: "running shoes",
              originalQuery: "red running shoes",
              color: "red",
            }),
          },
        },
      ],
    });

    const req = {
      json: async () => ({ query: "red running shoes" }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.explanation).toContain("red color");
  });

  it("generates explanation with brand filter", async () => {
    mockOpenai.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              isRelevant: true,
              semanticQuery: "running shoes",
              originalQuery: "Nike running shoes",
              brand: "Nike",
            }),
          },
        },
      ],
    });

    const req = {
      json: async () => ({ query: "Nike running shoes" }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.explanation).toContain("Brand");
  });

  it("generates explanation with multiple filters", async () => {
    mockOpenai.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              isRelevant: true,
              semanticQuery: "running shoes",
              originalQuery: "women's red Nike running shoes under $100",
              gender: "women",
              color: "red",
              brand: "Nike",
              maxPrice: 100,
            }),
          },
        },
      ],
    });

    const req = {
      json: async () => ({
        query: "women's red Nike running shoes under $100",
      }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.explanation).toContain("women's shoes");
    expect(callArgs.explanation).toContain("under $100");
    expect(callArgs.explanation).toContain("red color");
  });

  it("generates explanation with semantic query different from original", async () => {
    mockOpenai.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              isRelevant: true,
              semanticQuery: "athletic sneakers",
              originalQuery: "kicks for the gym",
            }),
          },
        },
      ],
    });

    const req = {
      json: async () => ({ query: "kicks for the gym" }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.explanation).toContain("Searching for: athletic sneakers");
  });

  it("generates explanation with special terms", async () => {
    mockOpenai.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              isRelevant: true,
              semanticQuery: "running shoes",
              originalQuery: "running shoes with boost",
              specialTerms: ["boost", "cushioning"],
            }),
          },
        },
      ],
    });

    const req = {
      json: async () => ({ query: "running shoes with boost" }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.explanation).toContain("Understood: boost, cushioning");
  });

  it("generates no-results explanation with gender filter", async () => {
    const mockNamespace = {
      query: jest.fn().mockResolvedValue({
        matches: [],
      }),
    };
    mockIndex.namespace.mockReturnValue(mockNamespace);

    mockOpenai.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              isRelevant: true,
              semanticQuery: "running shoes",
              originalQuery: "men's running shoes",
              gender: "men",
            }),
          },
        },
      ],
    });

    const req = {
      json: async () => ({ query: "men's running shoes" }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.explanation).toContain("No products found");
    expect(callArgs.explanation).toContain("gender: men");
  });

  it("generates no-results explanation with color and suggests removing it", async () => {
    const mockNamespace = {
      query: jest.fn().mockResolvedValue({
        matches: [],
      }),
    };
    mockIndex.namespace.mockReturnValue(mockNamespace);

    mockOpenai.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              isRelevant: true,
              semanticQuery: "running shoes",
              originalQuery: "purple running shoes",
              color: "purple",
            }),
          },
        },
      ],
    });

    const req = {
      json: async () => ({ query: "purple running shoes" }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.explanation).toContain("No products found");
    expect(callArgs.explanation).toContain("color: purple");
    expect(callArgs.explanation).toContain("try without color filter");
  });

  it("generates no-results explanation with brand and suggests alternatives", async () => {
    const mockNamespace = {
      query: jest.fn().mockResolvedValue({
        matches: [],
      }),
    };
    mockIndex.namespace.mockReturnValue(mockNamespace);

    mockOpenai.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              isRelevant: true,
              semanticQuery: "running shoes",
              originalQuery: "Reebok running shoes",
              brand: "Reebok",
            }),
          },
        },
      ],
    });

    const req = {
      json: async () => ({ query: "Reebok running shoes" }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.explanation).toContain("No products found");
    expect(callArgs.explanation).toContain("brand: Reebok");
    expect(callArgs.explanation).toContain("try different brands");
  });

  it("generates no-results explanation with minPrice", async () => {
    const mockNamespace = {
      query: jest.fn().mockResolvedValue({
        matches: [],
      }),
    };
    mockIndex.namespace.mockReturnValue(mockNamespace);

    mockOpenai.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              isRelevant: true,
              semanticQuery: "running shoes",
              originalQuery: "running shoes over $500",
              minPrice: 500,
            }),
          },
        },
      ],
    });

    const req = {
      json: async () => ({ query: "running shoes over $500" }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.explanation).toContain("No products found");
    expect(callArgs.explanation).toContain("min price: $500");
  });

  it("generates no-results explanation with maxPrice", async () => {
    const mockNamespace = {
      query: jest.fn().mockResolvedValue({
        matches: [],
      }),
    };
    mockIndex.namespace.mockReturnValue(mockNamespace);

    mockOpenai.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              isRelevant: true,
              semanticQuery: "running shoes",
              originalQuery: "running shoes under $5",
              maxPrice: 5,
            }),
          },
        },
      ],
    });

    const req = {
      json: async () => ({ query: "running shoes under $5" }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.explanation).toContain("No products found");
    expect(callArgs.explanation).toContain("max price: $5");
  });

  it("generates no-results explanation with suggested query", async () => {
    const mockNamespace = {
      query: jest.fn().mockResolvedValue({
        matches: [],
      }),
    };
    mockIndex.namespace.mockReturnValue(mockNamespace);

    mockOpenai.chat.completions.create.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              isRelevant: true,
              semanticQuery: "dress shoes",
              originalQuery: "formal shoes",
              suggestedQuery: "leather dress shoes",
            }),
          },
        },
      ],
    });

    const req = {
      json: async () => ({ query: "formal shoes" }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.explanation).toContain("No products found");
    expect(callArgs.explanation).toContain('search: "leather dress shoes"');
  });

  it("excludes products by ID", async () => {
    const req = {
      json: async () => ({
        query: "shoes",
        excludedIds: ["1"],
      }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.products).toHaveLength(1);
    expect(callArgs.products[0].id).toBe("2");
  });

  it("increases topK when excludedIds provided", async () => {
    const req = {
      json: async () => ({
        query: "shoes",
        excludedIds: ["1", "2", "3"],
      }),
    } as unknown as Request;

    await POST(req);

    const mockNamespace = mockIndex.namespace.mock.results[0].value;
    const queryCall = mockNamespace.query.mock.calls[0][0];
    // Should request 50 + 3 = 53 results
    expect(queryCall.topK).toBe(53);
  });

  it("caps topK at 100 even with many excluded IDs", async () => {
    const excludedIds = Array.from({ length: 100 }, (_, i) => `${i}`);

    const req = {
      json: async () => ({
        query: "shoes",
        excludedIds,
      }),
    } as unknown as Request;

    await POST(req);

    const mockNamespace = mockIndex.namespace.mock.results[0].value;
    const queryCall = mockNamespace.query.mock.calls[0][0];
    // Should cap at 100
    expect(queryCall.topK).toBe(100);
  });
});
