/**
 * Unit tests for Pinecone Search Service
 */

// Mock dependencies BEFORE imports with factory functions
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

jest.mock("@/lib/utils/queryParser");

import {
  generateEmbedding,
  searchPinecone,
  transformToProducts,
} from "../pinecone";
import { openai } from "@/lib/openai";
import { index } from "@/lib/pinecone";
import { buildPineconeFilter } from "@/lib/utils/queryParser";
import { Gender } from "@/lib/types";
import { SEARCH_CONFIG } from "@/lib/constants/search";
import type { ParsedQuery } from "@/lib/types";

const mockOpenAI = jest.mocked(openai);
const mockIndex = jest.mocked(index);
const mockBuildPineconeFilter = jest.mocked(buildPineconeFilter);

describe("pinecone service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateEmbedding", () => {
    it("should generate embedding from semantic query", async () => {
      const mockEmbedding = new Array(1536).fill(0).map((_, i) => i / 1536);

      (mockOpenAI.embeddings.create as jest.Mock).mockResolvedValueOnce({
        data: [{ embedding: mockEmbedding }],
      });

      const result = await generateEmbedding("running shoes");

      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
        model: process.env.OPENAI_EMBEDDING_MODEL,
        input: "running shoes",
      });
      expect(result).toEqual(mockEmbedding);
      expect(result).toHaveLength(1536);
    });

    it("should lowercase and trim the query", async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];

      (mockOpenAI.embeddings.create as jest.Mock).mockResolvedValueOnce({
        data: [{ embedding: mockEmbedding }],
      });

      await generateEmbedding("  RUNNING SHOES  ");

      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
        model: process.env.OPENAI_EMBEDDING_MODEL,
        input: "running shoes",
      });
    });

    it("should handle special characters", async () => {
      const mockEmbedding = [0.1, 0.2];

      (mockOpenAI.embeddings.create as jest.Mock).mockResolvedValueOnce({
        data: [{ embedding: mockEmbedding }],
      });

      await generateEmbedding("Nike's Air Max 90!");

      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
        model: process.env.OPENAI_EMBEDDING_MODEL,
        input: "nike's air max 90!",
      });
    });

    it("should use configured embedding model", async () => {
      const mockEmbedding = [0.1];

      (mockOpenAI.embeddings.create as jest.Mock).mockResolvedValueOnce({
        data: [{ embedding: mockEmbedding }],
      });

      await generateEmbedding("test");

      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: process.env.OPENAI_EMBEDDING_MODEL,
        }),
      );
    });
  });

  describe("searchPinecone", () => {
    const mockEmbedding = [0.1, 0.2, 0.3];
    const mockParsedQuery: ParsedQuery = {
      semanticQuery: "running shoes",
      originalQuery: "running shoes",
    };

    let mockNamespace: { query: jest.Mock };

    beforeEach(() => {
      mockNamespace = {
        query: jest.fn(),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockIndex.namespace.mockReturnValue(mockNamespace as any);
      mockBuildPineconeFilter.mockReturnValue(undefined);
    });

    it("should search Pinecone with embedding", async () => {
      mockNamespace.query.mockResolvedValueOnce({
        matches: [],
      });

      await searchPinecone(mockEmbedding, mockParsedQuery);

      expect(mockIndex.namespace).toHaveBeenCalledWith(
        process.env.PINECONE_NAMESPACE,
      );
      expect(mockNamespace.query).toHaveBeenCalledWith({
        vector: mockEmbedding,
        topK: SEARCH_CONFIG.INITIAL_TOP_K,
        includeMetadata: true,
      });
    });

    it("should apply Pinecone filter when provided", async () => {
      const mockFilter = { gender: { $eq: "men" } };
      mockBuildPineconeFilter.mockReturnValueOnce(mockFilter);

      mockNamespace.query.mockResolvedValueOnce({
        matches: [],
      });

      const result = await searchPinecone(mockEmbedding, mockParsedQuery);

      expect(mockBuildPineconeFilter).toHaveBeenCalledWith(
        mockParsedQuery,
        undefined,
      );
      expect(mockNamespace.query).toHaveBeenCalledWith({
        vector: mockEmbedding,
        filter: mockFilter,
        topK: SEARCH_CONFIG.INITIAL_TOP_K,
        includeMetadata: true,
      });
      expect(result.pineconeFilter).toEqual(mockFilter);
    });

    it("should pass UI filters to buildPineconeFilter", async () => {
      const filters = { brands: ["Nike", "Adidas"] };

      mockNamespace.query.mockResolvedValueOnce({
        matches: [],
      });

      await searchPinecone(mockEmbedding, mockParsedQuery, filters);

      expect(mockBuildPineconeFilter).toHaveBeenCalledWith(
        mockParsedQuery,
        filters,
      );
    });

    it("should increase topK when excludedIds provided", async () => {
      const excludedIds = ["id1", "id2", "id3"];

      mockNamespace.query.mockResolvedValueOnce({
        matches: [],
      });

      await searchPinecone(
        mockEmbedding,
        mockParsedQuery,
        undefined,
        excludedIds,
      );

      expect(mockNamespace.query).toHaveBeenCalledWith(
        expect.objectContaining({
          topK: SEARCH_CONFIG.INITIAL_TOP_K + 3,
        }),
      );
    });

    it("should cap topK at 100", async () => {
      const excludedIds = new Array(60).fill(0).map((_, i) => `id${i}`);

      mockNamespace.query.mockResolvedValueOnce({
        matches: [],
      });

      await searchPinecone(
        mockEmbedding,
        mockParsedQuery,
        undefined,
        excludedIds,
      );

      expect(mockNamespace.query).toHaveBeenCalledWith(
        expect.objectContaining({
          topK: SEARCH_CONFIG.MAX_TOP_K,
        }),
      );
    });

    it("should return search results and filter", async () => {
      const mockMatches = [
        { id: "1", score: 0.95, metadata: { name: "Product 1" } },
        { id: "2", score: 0.9, metadata: { name: "Product 2" } },
      ];

      mockNamespace.query.mockResolvedValueOnce({
        matches: mockMatches,
      });

      const result = await searchPinecone(mockEmbedding, mockParsedQuery);

      expect(result.searchResults.matches).toEqual(mockMatches);
      expect(result.pineconeFilter).toBeUndefined();
    });

    it("should handle empty results", async () => {
      mockNamespace.query.mockResolvedValueOnce({
        matches: [],
      });

      const result = await searchPinecone(mockEmbedding, mockParsedQuery);

      expect(result.searchResults.matches).toEqual([]);
    });
  });

  describe("transformToProducts", () => {
    const mockMatches = [
      {
        id: "1",
        metadata: {
          name: "Nike Air Max",
          description: "Running shoes",
          price: 120,
          image: "image1.jpg",
          brand: "Nike",
          category: "Sneakers",
          color: "red",
          sizes: [8, 9, 10],
          inStock: true,
          rating: 4.5,
          features: ["Cushioned", "Breathable"],
          gender: "men",
        },
      },
      {
        id: "2",
        metadata: {
          name: "Adidas Ultra Boost",
          description: "Performance shoes",
          price: 180,
          image: "image2.jpg",
          brand: "Adidas",
          category: "Running",
          color: "blue",
          sizes: [9, 10, 11],
          inStock: true,
          rating: 4.8,
          features: ["Energy Return"],
          gender: "men",
        },
      },
    ];

    it("should transform matches to Product objects", () => {
      const result = transformToProducts(mockMatches);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: "1",
        name: "Nike Air Max",
        description: "Running shoes",
        price: 120,
        image: "image1.jpg",
        brand: "Nike",
        category: "Sneakers",
        color: "red",
        sizes: [8, 9, 10],
        inStock: true,
        rating: 4.5,
        features: ["Cushioned", "Breathable"],
        gender: "men",
      });
    });

    it("should exclude products by ID", () => {
      const excludedIds = ["1"];

      const result = transformToProducts(mockMatches, excludedIds);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("2");
      expect(result[0].name).toBe("Adidas Ultra Boost");
    });

    it("should exclude multiple products", () => {
      const excludedIds = ["1", "2"];

      const result = transformToProducts(mockMatches, excludedIds);

      expect(result).toHaveLength(0);
    });

    it("should handle missing metadata fields with defaults", () => {
      const incompleteMatch = [
        {
          id: "3",
          metadata: {
            name: "Test Product",
          },
        },
      ];

      const result = transformToProducts(incompleteMatch);

      expect(result[0]).toEqual({
        id: "3",
        name: "Test Product",
        description: "",
        price: 0,
        image: "",
        brand: "",
        category: "",
        color: "",
        sizes: [],
        inStock: true, // Default to true
        rating: 0,
        features: [],
        gender: Gender.Unisex,
      });
    });

    it("should handle inStock false explicitly", () => {
      const outOfStockMatch = [
        {
          id: "4",
          metadata: {
            name: "Out of Stock Product",
            inStock: false,
          },
        },
      ];

      const result = transformToProducts(outOfStockMatch);

      expect(result[0].inStock).toBe(false);
    });

    it("should handle empty matches array", () => {
      const result = transformToProducts([]);

      expect(result).toEqual([]);
    });

    it("should handle matches without metadata fields", () => {
      const matchesNoMetadata = [
        { id: "5", metadata: {} },
        { id: "6", metadata: {} },
      ];

      const result = transformToProducts(matchesNoMetadata);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("");
      expect(result[1].name).toBe("");
    });

    it("should preserve all metadata fields", () => {
      const result = transformToProducts(mockMatches);

      const product = result[0];
      expect(product.id).toBe("1");
      expect(product.name).toBe("Nike Air Max");
      expect(product.description).toBe("Running shoes");
      expect(product.price).toBe(120);
      expect(product.image).toBe("image1.jpg");
      expect(product.brand).toBe("Nike");
      expect(product.category).toBe("Sneakers");
      expect(product.color).toBe("red");
      expect(product.sizes).toEqual([8, 9, 10]);
      expect(product.inStock).toBe(true);
      expect(product.rating).toBe(4.5);
      expect(product.features).toEqual(["Cushioned", "Breathable"]);
      expect(product.gender).toBe("men");
    });

    it("should handle numeric and string values correctly", () => {
      const mixedTypes = [
        {
          id: "7",
          metadata: {
            name: "Test",
            price: "100", // String instead of number
            rating: "4.5", // String instead of number
            sizes: ["8", "9"], // String array
          },
        },
      ];

      const result = transformToProducts(mixedTypes);

      // Should still work with type coercion
      expect(result[0].price).toBe("100");
      expect(result[0].rating).toBe("4.5");
      expect(result[0].sizes).toEqual(["8", "9"]);
    });

    it("should not exclude when excludedIds is empty", () => {
      const result = transformToProducts(mockMatches, []);

      expect(result).toHaveLength(2);
    });

    it("should handle excludedIds with non-matching IDs", () => {
      const result = transformToProducts(mockMatches, ["999", "888"]);

      expect(result).toHaveLength(2);
    });
  });
});
