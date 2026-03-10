// Mock openai before any imports that use it
jest.mock("../../openai", () => ({
  openai: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
}));

// Import from index.ts to cover the re-export statements
import * as utilsIndex from "../index";

describe("lib/utils/index - Export Validation", () => {
  describe("cacheHelpers exports", () => {
    it("should export normalizeBasic function", () => {
      expect(typeof utilsIndex.normalizeBasic).toBe("function");
    });

    it("should export normalizeSynonyms function", () => {
      expect(typeof utilsIndex.normalizeSynonyms).toBe("function");
    });

    it("should export normalizeQueryL1 function", () => {
      expect(typeof utilsIndex.normalizeQueryL1).toBe("function");
    });

    it("should export areQueriesSimilar function", () => {
      expect(typeof utilsIndex.areQueriesSimilar).toBe("function");
    });

    it("should export getNormalizationSteps function", () => {
      expect(typeof utilsIndex.getNormalizationSteps).toBe("function");
    });
  });

  describe("queryParser exports", () => {
    it("should export buildPineconeFilter function", () => {
      expect(typeof utilsIndex.buildPineconeFilter).toBe("function");
    });
  });

  describe("searchHelpers exports", () => {
    it("should export generateCacheKey function", () => {
      expect(typeof utilsIndex.generateCacheKey).toBe("function");
    });

    it("should export generateRejectionMessage function", () => {
      expect(typeof utilsIndex.generateRejectionMessage).toBe("function");
    });

    it("should export generateExplanation function", () => {
      expect(typeof utilsIndex.generateExplanation).toBe("function");
    });
  });

  describe("Integration - Verify exports work correctly", () => {
    it("should use normalizeBasic from index", () => {
      const result = utilsIndex.normalizeBasic("HELLO  world!");
      expect(result).toBe("hello world");
    });

    it("should use areQueriesSimilar from index", () => {
      const result = utilsIndex.areQueriesSimilar("nike shoes", "nike shoes");
      expect(result).toBe(true);
    });

    it("should use buildPineconeFilter from index", () => {
      const parsedQuery = {
        semanticQuery: "shoes",
        originalQuery: "Nike shoes",
        brand: "Nike",
        category: "Clothing",
      };
      const result = utilsIndex.buildPineconeFilter(parsedQuery);
      expect(result).toHaveProperty("brand");
    });

    it("should use generateCacheKey from index", () => {
      const result = utilsIndex.generateCacheKey("test query", {
        brands: ["Nike"],
      });
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
