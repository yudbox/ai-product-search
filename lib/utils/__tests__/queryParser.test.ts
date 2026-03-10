/**
 * Unit tests for Query Parser utilities
 */

import { parseQueryWithLLM, buildPineconeFilter } from "../queryParser";
import { Gender } from "@/lib/types";
import type { ParsedQuery } from "@/lib/types";

// Mock OpenAI
jest.mock("@/lib/openai", () => ({
  openai: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
}));

import { openai } from "@/lib/openai";
const mockOpenAI = jest.mocked(openai.chat.completions.create);

describe("queryParser", () => {
  describe("buildPineconeFilter", () => {
    it("should return undefined when no filters provided", () => {
      const parsed: ParsedQuery = {
        semanticQuery: "running shoes",
        originalQuery: "running shoes",
      };

      const result = buildPineconeFilter(parsed);
      expect(result).toBeUndefined();
    });

    it("should handle gender filter from parsed query", () => {
      const parsed: ParsedQuery = {
        semanticQuery: "mens shoes",
        originalQuery: "mens shoes",
        gender: Gender.Men,
      };

      const result = buildPineconeFilter(parsed);
      expect(result).toEqual({
        gender: { $eq: "men" },
      });
    });

    it("should handle price range from parsed query", () => {
      const parsed: ParsedQuery = {
        semanticQuery: "shoes",
        originalQuery: "shoes",
        minPrice: 50,
        maxPrice: 150,
      };

      const result = buildPineconeFilter(parsed);
      expect(result).toEqual({
        price: { $gte: 50, $lte: 150 },
      });
    });

    it("should add default min price when only max is provided", () => {
      const parsed: ParsedQuery = {
        semanticQuery: "shoes",
        originalQuery: "shoes",
        maxPrice: 100,
      };

      const result = buildPineconeFilter(parsed);
      expect(result).toEqual({
        price: { $gte: 0, $lte: 100 },
      });
    });

    it("should add default max price when only min is provided", () => {
      const parsed: ParsedQuery = {
        semanticQuery: "shoes",
        originalQuery: "shoes",
        minPrice: 50,
      };

      const result = buildPineconeFilter(parsed);
      expect(result).toEqual({
        price: { $gte: 50, $lte: 10000 },
      });
    });

    it("should handle brand filter from parsed query", () => {
      const parsed: ParsedQuery = {
        semanticQuery: "nike shoes",
        originalQuery: "nike shoes",
        brand: "Nike",
      };

      const result = buildPineconeFilter(parsed);
      expect(result).toEqual({
        brand: { $eq: "Nike" },
      });
    });

    it("should handle color filter from parsed query", () => {
      const parsed: ParsedQuery = {
        semanticQuery: "red shoes",
        originalQuery: "red shoes",
        color: "red",
      };

      const result = buildPineconeFilter(parsed);
      expect(result).toEqual({
        color: { $eq: "red" },
      });
    });

    it("should combine multiple filters", () => {
      const parsed: ParsedQuery = {
        semanticQuery: "nike red shoes",
        originalQuery: "nike red shoes",
        gender: Gender.Women,
        brand: "Nike",
        color: "red",
        minPrice: 50,
        maxPrice: 150,
      };

      const result = buildPineconeFilter(parsed);
      expect(result).toEqual({
        gender: { $eq: "women" },
        price: { $gte: 50, $lte: 150 },
        brand: { $eq: "Nike" },
        color: { $eq: "red" },
      });
    });

    describe("UI filters integration", () => {
      it("should handle UI price range filters", () => {
        const parsed: ParsedQuery = {
          semanticQuery: "shoes",
          originalQuery: "shoes",
        };

        const result = buildPineconeFilter(parsed, {
          priceRange: ["80-150"],
        });

        expect(result).toEqual({
          price: { $gte: 80, $lte: 150 },
        });
      });

      it("should handle multiple UI price ranges", () => {
        const parsed: ParsedQuery = {
          semanticQuery: "shoes",
          originalQuery: "shoes",
        };

        const result = buildPineconeFilter(parsed, {
          priceRange: ["0-80", "80-150"],
        });

        expect(result).toEqual({
          price: { $gte: 0, $lte: 150 },
        });
      });

      it("should handle 150+ price range", () => {
        const parsed: ParsedQuery = {
          semanticQuery: "shoes",
          originalQuery: "shoes",
        };

        const result = buildPineconeFilter(parsed, {
          priceRange: ["150+"],
        });

        expect(result).toEqual({
          price: { $gte: 150, $lte: 10000 },
        });
      });

      it("should handle UI brands filter", () => {
        const parsed: ParsedQuery = {
          semanticQuery: "shoes",
          originalQuery: "shoes",
        };

        const result = buildPineconeFilter(parsed, {
          brands: ["Nike", "Adidas"],
        });

        expect(result).toEqual({
          brand: { $in: ["Nike", "Adidas"] },
        });
      });

      it("should prioritize UI brands over parsed brand", () => {
        const parsed: ParsedQuery = {
          semanticQuery: "nike shoes",
          originalQuery: "nike shoes",
          brand: "Nike",
        };

        const result = buildPineconeFilter(parsed, {
          brands: ["Adidas", "Puma"],
        });

        expect(result).toEqual({
          brand: { $in: ["Adidas", "Puma"] },
        });
      });

      it("should combine UI price filters with parsed prices", () => {
        const parsed: ParsedQuery = {
          semanticQuery: "cheap shoes",
          originalQuery: "cheap shoes",
          maxPrice: 200,
        };

        const result = buildPineconeFilter(parsed, {
          priceRange: ["0-80"],
        });

        // UI filter is more restrictive, so it should win
        expect(result).toEqual({
          price: { $gte: 0, $lte: 80 },
        });
      });

      it("should handle empty UI filters", () => {
        const parsed: ParsedQuery = {
          semanticQuery: "shoes",
          originalQuery: "shoes",
          brand: "Nike",
        };

        const result = buildPineconeFilter(parsed, {
          brands: [],
          priceRange: [],
        });

        expect(result).toEqual({
          brand: { $eq: "Nike" },
        });
      });
    });
  });

  describe("parseQueryWithLLM", () => {
    beforeEach(() => {
      mockOpenAI.mockReset();
    });

    it("should parse simple query successfully", async () => {
      mockOpenAI.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                isRelevant: true,
                semanticQuery: "running shoes",
                detectedLanguage: "en",
                confidence: 0.9,
              }),
            },
          },
        ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await parseQueryWithLLM("running shoes");

      expect(result.semanticQuery).toBe("running shoes");
      expect(result.originalQuery).toBe("running shoes");
      expect(result.isRelevant).toBe(true);
      expect(result.confidence).toBe(0.9);
    });

    it("should extract gender from query", async () => {
      mockOpenAI.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                isRelevant: true,
                semanticQuery: "mens running shoes",
                gender: "men",
                detectedLanguage: "en",
              }),
            },
          },
        ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await parseQueryWithLLM("mens running shoes");

      expect(result.gender).toBe("men");
    });

    it("should extract brand and color", async () => {
      mockOpenAI.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                isRelevant: true,
                semanticQuery: "nike red shoes",
                brand: "Nike",
                color: "RED",
                detectedLanguage: "en",
              }),
            },
          },
        ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await parseQueryWithLLM("nike red shoes");

      expect(result.brand).toBe("Nike");
      expect(result.color).toBe("red"); // Should be lowercase
    });

    it("should extract price range", async () => {
      mockOpenAI.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                isRelevant: true,
                semanticQuery: "affordable shoes",
                minPrice: 50,
                maxPrice: 150,
                detectedLanguage: "en",
              }),
            },
          },
        ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await parseQueryWithLLM("shoes between $50 and $150");

      expect(result.minPrice).toBe(50);
      expect(result.maxPrice).toBe(150);
    });

    it("should handle rejected queries", async () => {
      mockOpenAI.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                isRelevant: false,
                rejectionReason: "not_footwear",
                suggestedQuery: "Try searching for sneakers or boots",
                semanticQuery: "laptop",
                detectedLanguage: "en",
              }),
            },
          },
        ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await parseQueryWithLLM("laptop");

      expect(result.isRelevant).toBe(false);
      expect(result.rejectionReason).toBe("not_footwear");
      expect(result.suggestedQuery).toBe("Try searching for sneakers or boots");
    });

    it("should validate and filter invalid genders", async () => {
      mockOpenAI.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                isRelevant: true,
                semanticQuery: "shoes",
                gender: "invalid_gender",
                detectedLanguage: "en",
              }),
            },
          },
        ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await parseQueryWithLLM("shoes");

      expect(result.gender).toBeUndefined();
    });

    it("should validate price ranges", async () => {
      mockOpenAI.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                isRelevant: true,
                semanticQuery: "expensive shoes",
                minPrice: -100, // Invalid
                maxPrice: 200000, // Invalid (above MAX_VALID_PRICE)
                detectedLanguage: "en",
              }),
            },
          },
        ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await parseQueryWithLLM("very expensive shoes");

      expect(result.minPrice).toBeUndefined();
      expect(result.maxPrice).toBeUndefined();
    });

    it("should round prices to integers", async () => {
      mockOpenAI.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: JSON.stringify({
                isRelevant: true,
                semanticQuery: "shoes",
                minPrice: 49.99,
                maxPrice: 150.5,
                detectedLanguage: "en",
              }),
            },
          },
        ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await parseQueryWithLLM("shoes $49.99 to $150.50");

      expect(result.minPrice).toBe(50);
      expect(result.maxPrice).toBe(151);
    });

    it("should handle API errors gracefully", async () => {
      mockOpenAI.mockRejectedValueOnce(new Error("API Error"));

      const result = await parseQueryWithLLM("running shoes");

      // Should return fallback
      expect(result.semanticQuery).toBe("running shoes");
      expect(result.originalQuery).toBe("running shoes");
    });

    it("should handle empty response from API", async () => {
      mockOpenAI.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      const result = await parseQueryWithLLM("running shoes");

      // Should return fallback
      expect(result.semanticQuery).toBe("running shoes");
      expect(result.originalQuery).toBe("running shoes");
    });
  });
});
