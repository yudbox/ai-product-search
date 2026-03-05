// Mock dependencies BEFORE importing route
jest.mock("@/lib/openai", () => ({
  openai: {
    embeddings: {
      create: jest.fn(),
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

const mockOpenai = require("@/lib/openai").openai;
const mockIndex = require("@/lib/pinecone").index;

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

    // Setup default mocks
    mockOpenai.embeddings.create.mockResolvedValue({
      data: [{ embedding: mockEmbedding }],
    });

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

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.products).toHaveLength(0); // Both products are > $80
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

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.products).toHaveLength(1); // Only Nike at $120
    expect(callArgs.products[0].price).toBeGreaterThan(80);
    expect(callArgs.products[0].price).toBeLessThanOrEqual(150);
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

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.products).toHaveLength(1); // Only Adidas at $160
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

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.products).toHaveLength(1);
    expect(callArgs.products[0].brand).toBe("Nike");
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

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.products).toHaveLength(1);
    expect(callArgs.products[0].category).toBe("Running Shoes");
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

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.products).toHaveLength(1);
    expect(callArgs.products[0].brand).toBe("Nike");
  });

  it("includes totalBeforeFilters count", async () => {
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
    expect(callArgs.totalBeforeFilters).toBe(2);
    expect(callArgs.count).toBe(1);
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

    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        error: "Search failed",
        details: "OpenAI API error",
      },
      { status: 500 },
    );
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

    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        error: "Search failed",
        details: "Pinecone query failed",
      },
      { status: 500 },
    );
  });

  it("handles malformed request body", async () => {
    const req = {
      json: async () => {
        throw new Error("Invalid JSON");
      },
    } as unknown as Request;

    await POST(req);

    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        error: "Search failed",
        details: "Invalid JSON",
      },
      { status: 500 },
    );
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

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    // Should only include products under $100 (Brooks at 75)
    expect(callArgs.products.every((p: any) => p.price <= 100)).toBe(true);
    expect(callArgs.explanation).toContain("under $100");
  });

  it("extracts max price from query text (below)", async () => {
    const req = {
      json: async () => ({
        query: "shoes below $120",
      }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.products.every((p: any) => p.price <= 120)).toBe(true);
  });

  it("extracts max price from query text (less than)", async () => {
    const req = {
      json: async () => ({
        query: "running shoes less than $90",
      }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.products.every((p: any) => p.price <= 90)).toBe(true);
  });

  it("extracts min price from query text (over)", async () => {
    const req = {
      json: async () => ({
        query: "shoes over $100",
      }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    // Should only include products over $100 (Nike at 120, Adidas at 180)
    expect(callArgs.products.every((p: any) => p.price >= 100)).toBe(true);
  });

  it("extracts min price from query text (above)", async () => {
    const req = {
      json: async () => ({
        query: "shoes above $150",
      }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.products.every((p: any) => p.price >= 150)).toBe(true);
  });

  it("handles both min and max price constraints", async () => {
    const req = {
      json: async () => ({
        query: "shoes over $80 and under $150",
      }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(
      callArgs.products.every((p: any) => p.price >= 80 && p.price <= 150),
    ).toBe(true);
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

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.products.every((p: any) => p.price <= 150)).toBe(true);
    expect(callArgs.products.every((p: any) => p.brand === "Nike")).toBe(true);
  });

  it("handles query with price but no matching products", async () => {
    const req = {
      json: async () => ({
        query: "shoes under $10",
      }),
    } as unknown as Request;

    await POST(req);

    const callArgs = (NextResponse.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.products).toHaveLength(0);
    expect(callArgs.explanation).toContain("max price: $10");
    expect(callArgs.explanation).toContain("No products found");
  });
});
