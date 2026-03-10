/**
 * Integration tests for lib/utils
 * Testing index.ts exports, queryParser.ts, and searchHelpers.ts
 */

import {
  parseQueryWithLLM,
  buildPineconeFilter,
  generateCacheKey,
  generateRejectionMessage,
  generateExplanation,
} from "@/lib/utils";
import { Gender } from "@/lib/types";
import type { ParsedQuery, Product } from "@/lib/types";
import { openai } from "@/lib/openai";

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

const mockedOpenai = jest.mocked(openai);

describe("Integration: lib/utils/index", () => {
  it("should export parseQueryWithLLM", () => {
    expect(parseQueryWithLLM).toBeDefined();
    expect(typeof parseQueryWithLLM).toBe("function");
  });

  it("should export buildPineconeFilter", () => {
    expect(buildPineconeFilter).toBeDefined();
    expect(typeof buildPineconeFilter).toBe("function");
  });

  it("should export generateCacheKey", () => {
    expect(generateCacheKey).toBeDefined();
    expect(typeof generateCacheKey).toBe("function");
  });

  it("should export generateRejectionMessage", () => {
    expect(generateRejectionMessage).toBeDefined();
    expect(typeof generateRejectionMessage).toBe("function");
  });

  it("should export generateExplanation", () => {
    expect(generateExplanation).toBeDefined();
    expect(typeof generateExplanation).toBe("function");
  });
});

describe("Integration: lib/utils/queryParser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("parseQueryWithLLM", () => {
    it("should parse query with LLM successfully", async () => {
      mockedOpenai.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              role: "assistant" as const,
              refusal: null,
              content: JSON.stringify({
                isRelevant: true,
                semanticQuery: "running shoes",
                gender: "men",
                color: "blue",
                brand: "Nike",
                category: "sneakers",
                minPrice: 50,
                maxPrice: 150,
                detectedLanguage: "en",
                confidence: 0.95,
              }),
            },
            finish_reason: "stop" as const,
            index: 0,
            logprobs: null,
          },
        ],
        id: "chatcmpl-test",
        created: Date.now(),
        model: "gpt-4",
        object: "chat.completion" as const,
      });

      const result = await parseQueryWithLLM("nike blue running shoes");

      expect(mockedOpenai.chat.completions.create).toHaveBeenCalled();
      expect(result).toHaveProperty("semanticQuery", "running shoes");
      expect(result).toHaveProperty("gender", Gender.Men);
      expect(result).toHaveProperty("color", "blue");
      expect(result).toHaveProperty("brand", "Nike");
      expect(result).toHaveProperty("category", "sneakers");
      expect(result).toHaveProperty("minPrice", 50);
      expect(result).toHaveProperty("maxPrice", 150);
    });

    it("should handle minimal LLM response", async () => {
      mockedOpenai.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              role: "assistant" as const,
              refusal: null,
              content: JSON.stringify({
                semanticQuery: "shoes",
              }),
            },
            finish_reason: "stop" as const,
            index: 0,
            logprobs: null,
          },
        ],
        id: "chatcmpl-test",
        created: Date.now(),
        model: "gpt-4",
        object: "chat.completion" as const,
      });

      const result = await parseQueryWithLLM("shoes");

      expect(result.semanticQuery).toBe("shoes");
      expect(result.originalQuery).toBe("shoes");
    });

    it("should validate and normalize gender", async () => {
      mockedOpenai.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              role: "assistant" as const,
              refusal: null,
              content: JSON.stringify({
                semanticQuery: "shoes",
                gender: "women",
              }),
            },
            finish_reason: "stop" as const,
            index: 0,
            logprobs: null,
          },
        ],
        id: "chatcmpl-test",
        created: Date.now(),
        model: "gpt-4",
        object: "chat.completion" as const,
      });

      const result = await parseQueryWithLLM("women shoes");

      expect(result.gender).toBe(Gender.Women);
    });

    it("should ignore invalid gender", async () => {
      mockedOpenai.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              role: "assistant" as const,
              refusal: null,
              content: JSON.stringify({
                semanticQuery: "shoes",
                gender: "invalid",
              }),
            },
            finish_reason: "stop" as const,
            index: 0,
            logprobs: null,
          },
        ],
        id: "chatcmpl-test",
        created: Date.now(),
        model: "gpt-4",
        object: "chat.completion" as const,
      });

      const result = await parseQueryWithLLM("shoes");

      expect(result.gender).toBeUndefined();
    });

    it("should normalize color to lowercase", async () => {
      mockedOpenai.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              role: "assistant" as const,
              refusal: null,
              content: JSON.stringify({
                semanticQuery: "shoes",
                color: "RED",
              }),
            },
            finish_reason: "stop" as const,
            index: 0,
            logprobs: null,
          },
        ],
        id: "chatcmpl-test",
        created: Date.now(),
        model: "gpt-4",
        object: "chat.completion" as const,
      });

      const result = await parseQueryWithLLM("red shoes");

      expect(result.color).toBe("red");
    });

    it("should round price values", async () => {
      mockedOpenai.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              role: "assistant" as const,
              refusal: null,
              content: JSON.stringify({
                semanticQuery: "shoes",
                minPrice: 49.99,
                maxPrice: 150.49,
              }),
            },
            finish_reason: "stop" as const,
            index: 0,
            logprobs: null,
          },
        ],
        id: "chatcmpl-test",
        created: Date.now(),
        model: "gpt-4",
        object: "chat.completion" as const,
      });

      const result = await parseQueryWithLLM("shoes under 150");

      expect(result.minPrice).toBe(50);
      expect(result.maxPrice).toBe(150);
    });

    it("should reject invalid prices", async () => {
      mockedOpenai.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              role: "assistant" as const,
              refusal: null,
              content: JSON.stringify({
                semanticQuery: "shoes",
                minPrice: -10,
                maxPrice: 1000000,
              }),
            },
            finish_reason: "stop" as const,
            index: 0,
            logprobs: null,
          },
        ],
        id: "chatcmpl-test",
        created: Date.now(),
        model: "gpt-4",
        object: "chat.completion" as const,
      });

      const result = await parseQueryWithLLM("shoes");

      expect(result.minPrice).toBeUndefined();
      expect(result.maxPrice).toBeUndefined();
    });

    it("should handle validation fields", async () => {
      mockedOpenai.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              role: "assistant" as const,
              refusal: null,
              content: JSON.stringify({
                semanticQuery: "shoes",
                isRelevant: false,
                rejectionReason: "not_footwear",
                suggestedQuery: "try sneakers",
                confidence: 0.8,
              }),
            },
            finish_reason: "stop" as const,
            index: 0,
            logprobs: null,
          },
        ],
        id: "chatcmpl-test",
        created: Date.now(),
        model: "gpt-4",
        object: "chat.completion" as const,
      });

      const result = await parseQueryWithLLM("laptop");

      expect(result.isRelevant).toBe(false);
      expect(result.rejectionReason).toBe("not_footwear");
      expect(result.suggestedQuery).toBe("try sneakers");
      expect(result.confidence).toBe(0.8);
    });

    it("should handle empty LLM response with fallback", async () => {
      mockedOpenai.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              role: "assistant" as const,
              refusal: null,
              content: null,
            },
            finish_reason: "stop" as const,
            index: 0,
            logprobs: null,
          },
        ],
        id: "chatcmpl-test",
        created: Date.now(),
        model: "gpt-4",
        object: "chat.completion" as const,
      });

      const result = await parseQueryWithLLM("test");

      expect(result.semanticQuery).toBe("test");
      expect(result.originalQuery).toBe("test");
    });

    it("should handle LLM error with fallback", async () => {
      mockedOpenai.chat.completions.create.mockRejectedValue(
        new Error("API error"),
      );

      const result = await parseQueryWithLLM("running shoes");

      expect(result.semanticQuery).toBe("running shoes");
      expect(result.originalQuery).toBe("running shoes");
    });

    it("should handle special terms", async () => {
      mockedOpenai.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              role: "assistant" as const,
              refusal: null,
              content: JSON.stringify({
                semanticQuery: "shoes",
                specialTerms: ["kicks", "creps"],
              }),
            },
            finish_reason: "stop" as const,
            index: 0,
            logprobs: null,
          },
        ],
        id: "chatcmpl-test",
        created: Date.now(),
        model: "gpt-4",
        object: "chat.completion" as const,
      });

      const result = await parseQueryWithLLM("buy some kicks");

      expect(result.specialTerms).toEqual(["kicks", "creps"]);
    });

    it("should preserve brand capitalization", async () => {
      mockedOpenai.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              role: "assistant" as const,
              refusal: null,
              content: JSON.stringify({
                semanticQuery: "shoes",
                brand: "Nike",
              }),
            },
            finish_reason: "stop" as const,
            index: 0,
            logprobs: null,
          },
        ],
        id: "chatcmpl-test",
        created: Date.now(),
        model: "gpt-4",
        object: "chat.completion" as const,
      });

      const result = await parseQueryWithLLM("nike shoes");

      expect(result.brand).toBe("Nike");
    });

    it("should normalize category to lowercase", async () => {
      mockedOpenai.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              role: "assistant" as const,
              refusal: null,
              content: JSON.stringify({
                semanticQuery: "shoes",
                category: "SNEAKERS",
              }),
            },
            finish_reason: "stop" as const,
            index: 0,
            logprobs: null,
          },
        ],
        id: "chatcmpl-test",
        created: Date.now(),
        model: "gpt-4",
        object: "chat.completion" as const,
      });

      const result = await parseQueryWithLLM("sneakers");

      expect(result.category).toBe("sneakers");
    });

    it("should handle detected language", async () => {
      mockedOpenai.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              role: "assistant" as const,
              refusal: null,
              content: JSON.stringify({
                semanticQuery: "sneakers",
                detectedLanguage: "ru",
              }),
            },
            finish_reason: "stop" as const,
            index: 0,
            logprobs: null,
          },
        ],
        id: "chatcmpl-test",
        created: Date.now(),
        model: "gpt-4",
        object: "chat.completion" as const,
      });

      const result = await parseQueryWithLLM("кроссовки");

      expect(result.detectedLanguage).toBe("ru");
    });

    it("should use correct model and temperature", async () => {
      mockedOpenai.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              role: "assistant" as const,
              refusal: null,
              content: JSON.stringify({
                semanticQuery: "shoes",
              }),
            },
            finish_reason: "stop" as const,
            index: 0,
            logprobs: null,
          },
        ],
        id: "chatcmpl-test",
        created: Date.now(),
        model: "gpt-4",
        object: "chat.completion" as const,
      });

      await parseQueryWithLLM("test");

      expect(mockedOpenai.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "gpt-4o-mini",
          temperature: 0,
        }),
      );
    });
  });

  describe("buildPineconeFilter", () => {
    it("should build filter with gender", () => {
      const parsed: ParsedQuery = {
        originalQuery: "test query",
        semanticQuery: "shoes",
        gender: Gender.Men,
      };

      const filter = buildPineconeFilter(parsed);

      expect(filter).toEqual({
        gender: { $eq: Gender.Men },
      });
    });

    it("should build filter with price range from LLM", () => {
      const parsed: ParsedQuery = {
        originalQuery: "test query",
        semanticQuery: "shoes",
        minPrice: 50,
        maxPrice: 150,
      };

      const filter = buildPineconeFilter(parsed);

      expect(filter).toHaveProperty("price");
      expect(filter!.price).toEqual({
        $gte: 50,
        $lte: 150,
      });
    });

    it("should build filter with price range from UI", () => {
      const parsed: ParsedQuery = {
        originalQuery: "test query",
        semanticQuery: "shoes",
      };

      const filter = buildPineconeFilter(parsed, {
        priceRange: ["0-80"],
      });

      expect(filter).toHaveProperty("price");
      expect(filter!.price).toEqual({
        $gte: 0,
        $lte: 80,
      });
    });

    it("should combine LLM and UI price filters (most restrictive)", () => {
      const parsed: ParsedQuery = {
        originalQuery: "test query",
        semanticQuery: "shoes",
        minPrice: 30,
        maxPrice: 200,
      };

      const filter = buildPineconeFilter(parsed, {
        priceRange: ["80-150"],
      });

      expect(filter!.price).toEqual({
        $gte: 80, // UI is more restrictive
        $lte: 150, // UI is more restrictive
      });
    });

    it("should handle multiple UI price ranges", () => {
      const parsed: ParsedQuery = {
        originalQuery: "test query",
        semanticQuery: "shoes",
      };

      const filter = buildPineconeFilter(parsed, {
        priceRange: ["0-80", "80-150"],
      });

      expect(filter!.price).toEqual({
        $gte: 0,
        $lte: 150,
      });
    });

    it("should handle 150+ price range", () => {
      const parsed: ParsedQuery = {
        originalQuery: "test query",
        semanticQuery: "shoes",
      };

      const filter = buildPineconeFilter(parsed, {
        priceRange: ["150+"],
      });

      expect(filter!.price).toEqual({
        $gte: 150,
        $lte: 10000,
      });
    });

    it("should add default bounds to price filter", () => {
      const parsed: ParsedQuery = {
        originalQuery: "test query",
        semanticQuery: "shoes",
        minPrice: 50,
      };

      const filter = buildPineconeFilter(parsed);

      expect(filter!.price).toHaveProperty("$gte", 50);
      expect(filter!.price).toHaveProperty("$lte", 10000);
    });

    it("should build filter with single brand from LLM", () => {
      const parsed: ParsedQuery = {
        originalQuery: "test query",
        semanticQuery: "shoes",
        brand: "Nike",
      };

      const filter = buildPineconeFilter(parsed);

      expect(filter).toEqual({
        brand: { $eq: "Nike" },
      });
    });

    it("should build filter with multiple brands from UI", () => {
      const parsed: ParsedQuery = {
        originalQuery: "test query",
        semanticQuery: "shoes",
      };

      const filter = buildPineconeFilter(parsed, {
        brands: ["Nike", "Adidas"],
      });

      expect(filter).toEqual({
        brand: { $in: ["Nike", "Adidas"] },
      });
    });

    it("should prefer UI brands over LLM brand", () => {
      const parsed: ParsedQuery = {
        originalQuery: "test query",
        semanticQuery: "shoes",
        brand: "Nike",
      };

      const filter = buildPineconeFilter(parsed, {
        brands: ["Adidas", "Puma"],
      });

      expect(filter).toEqual({
        brand: { $in: ["Adidas", "Puma"] },
      });
    });

    it("should build filter with color", () => {
      const parsed: ParsedQuery = {
        originalQuery: "test query",
        semanticQuery: "shoes",
        color: "red",
      };

      const filter = buildPineconeFilter(parsed);

      expect(filter).toEqual({
        color: { $eq: "red" },
      });
    });

    it("should not filter by category", () => {
      const parsed: ParsedQuery = {
        originalQuery: "test query",
        semanticQuery: "shoes",
        category: "sneakers",
      };

      const filter = buildPineconeFilter(parsed);

      expect(filter).toBeUndefined();
    });

    it("should combine multiple filters", () => {
      const parsed: ParsedQuery = {
        originalQuery: "test query",
        semanticQuery: "shoes",
        gender: Gender.Women,
        minPrice: 50,
        maxPrice: 150,
        brand: "Nike",
        color: "blue",
      };

      const filter = buildPineconeFilter(parsed);

      expect(filter).toEqual({
        gender: { $eq: Gender.Women },
        price: { $gte: 50, $lte: 150 },
        brand: { $eq: "Nike" },
        color: { $eq: "blue" },
      });
    });

    it("should return undefined for empty filter", () => {
      const parsed: ParsedQuery = {
        originalQuery: "test query",
        semanticQuery: "shoes",
      };

      const filter = buildPineconeFilter(parsed);

      expect(filter).toBeUndefined();
    });

    it("should handle invalid price ranges gracefully", () => {
      const parsed: ParsedQuery = {
        originalQuery: "test query",
        semanticQuery: "shoes",
      };

      const filter = buildPineconeFilter(parsed, {
        priceRange: ["invalid"],
      });

      expect(filter).toBeUndefined();
    });

    it("should handle empty UI filters", () => {
      const parsed: ParsedQuery = {
        originalQuery: "test query",
        semanticQuery: "shoes",
        gender: Gender.Men,
      };

      const filter = buildPineconeFilter(parsed, {});

      expect(filter).toEqual({
        gender: { $eq: Gender.Men },
      });
    });
  });
});

describe("Integration: lib/utils/searchHelpers", () => {
  describe("generateCacheKey", () => {
    it("should return normalized query without filters", () => {
      const key = generateCacheKey("nike shoes");

      expect(key).toBe("nike shoes");
    });

    it("should return normalized query for empty filters", () => {
      const key = generateCacheKey("nike shoes", {});

      expect(key).toBe("nike shoes");
    });

    it("should include price range in cache key", () => {
      const key = generateCacheKey("nike shoes", {
        priceRange: ["0-80", "80-150"],
      });

      expect(key).toContain("nike shoes");
      expect(key).toContain("pr:");
      expect(key).toContain("0-80");
      expect(key).toContain("80-150");
    });

    it("should include brands in cache key", () => {
      const key = generateCacheKey("shoes", {
        brands: ["Nike", "Adidas"],
      });

      expect(key).toContain("shoes");
      expect(key).toContain("br:");
      expect(key).toContain("Nike");
      expect(key).toContain("Adidas");
    });

    it("should include categories in cache key", () => {
      const key = generateCacheKey("shoes", {
        categories: ["Sneakers", "Boots"],
      });

      expect(key).toContain("shoes");
      expect(key).toContain("cat:");
      expect(key).toContain("Sneakers");
      expect(key).toContain("Boots");
    });

    it("should sort filters for consistent keys", () => {
      const key1 = generateCacheKey("shoes", {
        brands: ["Nike", "Adidas"],
      });
      const key2 = generateCacheKey("shoes", {
        brands: ["Adidas", "Nike"],
      });

      expect(key1).toBe(key2);
    });

    it("should sort price ranges for consistent keys", () => {
      const key1 = generateCacheKey("shoes", {
        priceRange: ["80-150", "0-80"],
      });
      const key2 = generateCacheKey("shoes", {
        priceRange: ["0-80", "80-150"],
      });

      expect(key1).toBe(key2);
    });

    it("should combine multiple filter types", () => {
      const key = generateCacheKey("shoes", {
        priceRange: ["0-80"],
        brands: ["Nike"],
        categories: ["Sneakers"],
      });

      expect(key).toContain("pr:");
      expect(key).toContain("br:");
      expect(key).toContain("cat:");
      expect(key).toContain("|");
    });

    it("should handle single filter type", () => {
      const key = generateCacheKey("shoes", {
        brands: ["Nike"],
      });

      expect(key).toBe("shoes|br:Nike");
    });
  });

  describe("generateRejectionMessage", () => {
    it("should generate not_footwear rejection message", () => {
      const message = generateRejectionMessage(
        "not_footwear",
        undefined,
        "laptop",
      );

      expect(message).toContain("only sell footwear");
      expect(message).toContain("laptop");
    });

    it("should generate question_not_search rejection message", () => {
      const message = generateRejectionMessage(
        "question_not_search",
        undefined,
        "how to choose shoes?",
      );

      expect(message).toContain("search for products");
      expect(message).toContain("instead of asking questions");
    });

    it("should generate nonsense rejection message", () => {
      const message = generateRejectionMessage("nonsense", undefined, "asdf");

      expect(message).toContain("couldn't understand");
      expect(message).toContain("asdf");
    });

    it("should include suggestion if provided", () => {
      const message = generateRejectionMessage(
        "not_footwear",
        "try searching for sneakers",
        "laptop",
      );

      expect(message).toContain("Try searching for:");
      expect(message).toContain("try searching for sneakers");
    });

    it("should handle unknown reason", () => {
      const message = generateRejectionMessage("unknown", undefined, "test");

      expect(message).toContain("No products found");
      expect(message).toContain("test");
    });

    it("should handle undefined reason", () => {
      const message = generateRejectionMessage(undefined, undefined, "test");

      expect(message).toContain("No products found");
    });

    it("should combine unknown reason with suggestion", () => {
      const message = generateRejectionMessage(
        "unknown",
        "try sneakers",
        "test",
      );

      expect(message).toContain("No products found");
      expect(message).toContain('Try searching for: "try sneakers"');
    });
  });

  describe("generateExplanation", () => {
    const mockProducts: Product[] = [
      {
        id: "1",
        name: "Nike Air Max",
        description: "Running shoes",
        price: 120,
        image: "img1.jpg",
        brand: "Nike",
        category: "Sneakers",
        color: "blue",
        sizes: [8, 9, 10],
        inStock: true,
        rating: 4.5,
        features: ["lightweight"],
        gender: Gender.Men,
      },
      {
        id: "2",
        name: "Adidas Ultraboost",
        description: "Running shoes",
        price: 180,
        image: "img2.jpg",
        brand: "Adidas",
        category: "Sneakers",
        color: "black",
        sizes: [9, 10, 11],
        inStock: true,
        rating: 4.7,
        features: ["comfortable"],
        gender: Gender.Men,
      },
      {
        id: "3",
        name: "Puma RS-X",
        description: "Casual shoes",
        price: 100,
        image: "img3.jpg",
        brand: "Puma",
        category: "Sneakers",
        color: "white",
        sizes: [8, 9, 10],
        inStock: true,
        rating: 4.3,
        features: ["stylish"],
        gender: Gender.Unisex,
      },
    ];

    describe("empty results", () => {
      it("should generate message for empty results", () => {
        const parsed: ParsedQuery = {
          originalQuery: "test query",
          semanticQuery: "running shoes",
        };

        const message = generateExplanation("running shoes", [], parsed);

        expect(message).toContain("No products found");
        expect(message).toContain("running shoes");
      });

      it("should explain gender filter", () => {
        const parsed: ParsedQuery = {
          originalQuery: "test query",
          semanticQuery: "shoes",
          gender: Gender.Women,
        };

        const message = generateExplanation("shoes", [], parsed);

        expect(message).toContain("gender: women");
      });

      it("should explain price filters", () => {
        const parsed: ParsedQuery = {
          originalQuery: "test query",
          semanticQuery: "shoes",
          minPrice: 50,
          maxPrice: 100,
        };

        const message = generateExplanation("shoes", [], parsed);

        expect(message).toContain("max price: $100");
        expect(message).toContain("min price: $50");
      });

      it("should explain color filter with suggestion", () => {
        const parsed: ParsedQuery = {
          originalQuery: "test query",
          semanticQuery: "shoes",
          color: "red",
        };

        const message = generateExplanation("shoes", [], parsed);

        expect(message).toContain("color: red");
        expect(message).toContain("try without color filter");
      });

      it("should explain brand filter with suggestion", () => {
        const parsed: ParsedQuery = {
          originalQuery: "test query",
          semanticQuery: "shoes",
          brand: "Nike",
        };

        const message = generateExplanation("shoes", [], parsed);

        expect(message).toContain("brand: Nike");
        expect(message).toContain("try different brands");
      });

      it("should show suggested query if available", () => {
        const parsed: ParsedQuery = {
          originalQuery: "test query",
          semanticQuery: "shoes",
          suggestedQuery: "try sneakers",
        };

        const message = generateExplanation("shoes", [], parsed);

        expect(message).toContain("Or search:");
        expect(message).toContain("try sneakers");
      });

      it("should combine multiple filters", () => {
        const parsed: ParsedQuery = {
          originalQuery: "test query",
          semanticQuery: "shoes",
          gender: Gender.Men,
          color: "blue",
          brand: "Nike",
          maxPrice: 150,
        };

        const message = generateExplanation("shoes", [], parsed);

        expect(message).toContain("gender: men");
        expect(message).toContain("color: blue");
        expect(message).toContain("brand: Nike");
        expect(message).toContain("max price: $150");
      });

      it("should provide generic suggestion when no specific filters", () => {
        const parsed: ParsedQuery = {
          originalQuery: "test query",
          semanticQuery: "shoes",
        };

        const message = generateExplanation("shoes", [], parsed);

        expect(message).toContain("adjusting your search or removing filters");
      });
    });

    describe("successful results", () => {
      it("should generate message for successful results", () => {
        const parsed: ParsedQuery = {
          originalQuery: "test query",
          semanticQuery: "running shoes",
        };

        const message = generateExplanation(
          "running shoes",
          mockProducts,
          parsed,
        );

        expect(message).toContain("Found 3 products");
        expect(message).toContain("running shoes");
      });

      it("should list top 3 products", () => {
        const parsed: ParsedQuery = {
          originalQuery: "test query",
          semanticQuery: "shoes",
        };

        const message = generateExplanation("shoes", mockProducts, parsed);

        expect(message).toContain("Nike Air Max");
        expect(message).toContain("Adidas Ultraboost");
        expect(message).toContain("Puma RS-X");
      });

      it("should list unique brands", () => {
        const parsed: ParsedQuery = {
          originalQuery: "test query",
          semanticQuery: "shoes",
        };

        const message = generateExplanation("shoes", mockProducts, parsed);

        expect(message).toContain("Nike");
        expect(message).toContain("Adidas");
        expect(message).toContain("Puma");
      });

      it("should calculate average price", () => {
        const parsed: ParsedQuery = {
          originalQuery: "test query",
          semanticQuery: "shoes",
        };

        const message = generateExplanation("shoes", mockProducts, parsed);

        expect(message).toContain("Avg price: $133"); // (120 + 180 + 100) / 3
      });

      it("should show semantic query if different from original", () => {
        const parsed: ParsedQuery = {
          originalQuery: "test query",
          semanticQuery: "athletic footwear",
        };

        const message = generateExplanation(
          "running shoes",
          mockProducts,
          parsed,
        );

        expect(message).toContain("Searching for: athletic footwear");
      });

      it("should explain applied filters", () => {
        const parsed: ParsedQuery = {
          originalQuery: "test query",
          semanticQuery: "shoes",
          gender: Gender.Men,
          color: "blue",
          maxPrice: 150,
        };

        const message = generateExplanation("shoes", mockProducts, parsed);

        expect(message).toContain("Filters:");
        expect(message).toContain("men's shoes");
        expect(message).toContain("blue color");
        expect(message).toContain("under $150");
      });

      it("should show special terms if detected", () => {
        const parsed: ParsedQuery = {
          originalQuery: "test query",
          semanticQuery: "shoes",
          specialTerms: ["kicks", "creps"],
        };

        const message = generateExplanation("shoes", mockProducts, parsed);

        expect(message).toContain("Understood:");
        expect(message).toContain("kicks");
        expect(message).toContain("creps");
      });

      it("should handle more than 3 products", () => {
        const manyProducts = [
          ...mockProducts,
          { ...mockProducts[0], id: "4", name: "Product 4" },
          { ...mockProducts[0], id: "5", name: "Product 5" },
        ];

        const parsed: ParsedQuery = {
          originalQuery: "test query",
          semanticQuery: "shoes",
        };

        const message = generateExplanation("shoes", manyProducts, parsed);

        expect(message).toContain("Found 5 products");
        expect(message).toContain("Nike Air Max");
        expect(message).toContain("Adidas Ultraboost");
        expect(message).toContain("Puma RS-X");
        // Should not contain Product 4 or 5 (only top 3)
        expect(message).not.toContain("Product 4");
      });

      it("should limit brands to 5", () => {
        const manyBrands: Product[] = [
          { ...mockProducts[0], brand: "Brand1" },
          { ...mockProducts[0], brand: "Brand2" },
          { ...mockProducts[0], brand: "Brand3" },
          { ...mockProducts[0], brand: "Brand4" },
          { ...mockProducts[0], brand: "Brand5" },
          { ...mockProducts[0], brand: "Brand6" },
        ];

        const parsed: ParsedQuery = {
          originalQuery: "test query",
          semanticQuery: "shoes",
        };

        const message = generateExplanation("shoes", manyBrands, parsed);

        // Should show only first 5 brands
        const brandsMatch = message.match(/Brands: ([^.]+)/);
        expect(brandsMatch).toBeTruthy();
        const brandsList = brandsMatch![1].split(", ");
        expect(brandsList.length).toBe(5);
      });

      it("should handle single product", () => {
        const parsed: ParsedQuery = {
          originalQuery: "test query",
          semanticQuery: "shoes",
        };

        const message = generateExplanation("shoes", [mockProducts[0]], parsed);

        expect(message).toContain("Found 1 products");
        expect(message).toContain("Nike Air Max");
      });
    });
  });
});
