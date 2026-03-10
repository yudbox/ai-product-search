/**
 * Unit tests for L1 Cache Normalization Helpers
 */

import {
  normalizeBasic,
  normalizeSynonyms,
  normalizeBrands,
  normalizeColors,
  normalizeQueryL1,
  areQueriesSimilar,
  getNormalizationSteps,
} from "../cacheHelpers";

describe("cacheHelpers", () => {
  describe("normalizeBasic", () => {
    it("should convert to lowercase", () => {
      expect(normalizeBasic("RUNNING SHOES")).toBe("running shoes");
      expect(normalizeBasic("Nike Air")).toBe("nike air");
    });

    it("should trim whitespace", () => {
      expect(normalizeBasic("  shoes  ")).toBe("shoes");
      expect(normalizeBasic("\t\nboots\n\t")).toBe("boots");
    });

    it("should remove extra whitespace", () => {
      expect(normalizeBasic("running   shoes")).toBe("running shoes");
      expect(normalizeBasic("nike  air   max")).toBe("nike air max");
    });

    it("should remove punctuation and special characters", () => {
      expect(normalizeBasic("shoes!@#$%^&*()")).toBe("shoes");
      expect(normalizeBasic("women's shoes")).toBe("womens shoes");
      expect(normalizeBasic("high-top sneakers")).toBe("high top sneakers");
    });

    it("should replace dashes with spaces", () => {
      expect(normalizeBasic("high-top")).toBe("high top");
      expect(normalizeBasic("all-star")).toBe("all star");
      expect(normalizeBasic("nike-running-shoes")).toBe("nike running shoes");
    });

    it("should handle leading and trailing dashes", () => {
      expect(normalizeBasic("-shoes-")).toBe("shoes");
      expect(normalizeBasic("--boots--")).toBe("boots");
    });

    it("should handle Unicode characters (Cyrillic)", () => {
      expect(normalizeBasic("Кроссовки NIKE")).toBe("кроссовки nike");
    });

    it("should handle Unicode characters (Chinese)", () => {
      expect(normalizeBasic("运动鞋 123")).toBe("运动鞋 123");
    });

    it("should handle empty string", () => {
      expect(normalizeBasic("")).toBe("");
    });

    it("should handle numbers", () => {
      expect(normalizeBasic("Air Max 90")).toBe("air max 90");
    });
  });

  describe("normalizeSynonyms", () => {
    it("should keep sneakers as sneakers", () => {
      expect(normalizeSynonyms("running sneakers")).toBe("running sneakers");
      expect(normalizeSynonyms("sneakers")).toBe("sneakers");
    });

    it("should replace trainers with sneakers", () => {
      expect(normalizeSynonyms("athletic trainers")).toBe("athletic sneakers");
      expect(normalizeSynonyms("trainers")).toBe("sneakers");
    });

    it("should be case-insensitive", () => {
      expect(normalizeSynonyms("TRAINERS")).toBe("sneakers");
      expect(normalizeSynonyms("Trainers")).toBe("sneakers");
    });

    it("should only replace whole words", () => {
      expect(normalizeSynonyms("sneakerstore")).toBe("sneakerstore");
    });

    it("should handle multiple synonyms", () => {
      expect(normalizeSynonyms("sneakers and trainers")).toBe(
        "sneakers and sneakers",
      );
    });

    it("should handle empty string", () => {
      expect(normalizeSynonyms("")).toBe("");
    });
  });

  describe("normalizeBrands", () => {
    it("should normalize Nike variations to Nike", () => {
      expect(normalizeBrands("nike")).toBe("Nike");
      expect(normalizeBrands("NIKE")).toBe("Nike");
    });

    it("should normalize Adidas variations to Adidas", () => {
      expect(normalizeBrands("adidas")).toBe("Adidas");
      expect(normalizeBrands("ADIDAS")).toBe("Adidas");
    });

    it("should be case-insensitive", () => {
      expect(normalizeBrands("NiKe")).toBe("Nike");
      expect(normalizeBrands("AdIdAs")).toBe("Adidas");
    });

    it("should only replace whole words", () => {
      expect(normalizeBrands("nikestore")).toBe("nikestore");
    });

    it("should handle multiple brands", () => {
      expect(normalizeBrands("nike and adidas")).toBe("Nike and Adidas");
    });

    it("should handle empty string", () => {
      expect(normalizeBrands("")).toBe("");
    });
  });

  describe("normalizeColors", () => {
    it("should normalize color variations", () => {
      expect(normalizeColors("red shoes")).toBe("red shoes");
      expect(normalizeColors("blue sneakers")).toBe("blue sneakers");
    });

    it("should be case-insensitive", () => {
      expect(normalizeColors("RED")).toBe("red");
      expect(normalizeColors("Blue")).toBe("blue");
    });

    it("should only replace whole words", () => {
      expect(normalizeColors("reddish")).toBe("reddish");
    });

    it("should handle empty string", () => {
      expect(normalizeColors("")).toBe("");
    });
  });

  describe("normalizeQueryL1", () => {
    it("should apply full normalization pipeline", () => {
      const result = normalizeQueryL1("  Running SNEAKERS!  ");
      expect(result).toBe("running sneakers");
    });

    it("should handle complex queries with brands", () => {
      const result = normalizeQueryL1("NIKE running sneakers - RED");
      expect(result).toBe("Nike running sneakers red");
    });

    it("should normalize brands, synonyms, and colors together", () => {
      const result = normalizeQueryL1("ADIDAS trainers blue");
      expect(result).toBe("Adidas sneakers blue");
    });

    it("should handle punctuation and extra spaces", () => {
      const result = normalizeQueryL1("women's   running   shoes!!!");
      expect(result).toBe("womens running shoes");
    });

    it("should handle empty string", () => {
      expect(normalizeQueryL1("")).toBe("");
    });

    it("should handle single word", () => {
      expect(normalizeQueryL1("shoes")).toBe("shoes");
    });

    it("should trim final result", () => {
      expect(normalizeQueryL1("  shoes  ")).toBe("shoes");
    });

    it("should handle brand normalization with uppercase", () => {
      const result = normalizeQueryL1("nike");
      expect(result).toContain("Nike");
    });
  });

  describe("areQueriesSimilar", () => {
    it("should return true for identical queries", () => {
      expect(areQueriesSimilar("running shoes", "running shoes")).toBe(true);
    });

    it("should return true for queries with different casing", () => {
      expect(areQueriesSimilar("Running Shoes", "running shoes")).toBe(true);
    });

    it("should return true for queries with synonyms", () => {
      expect(areQueriesSimilar("running trainers", "running sneakers")).toBe(
        true,
      );
    });

    it("should return true for queries with extra whitespace", () => {
      expect(areQueriesSimilar("running  shoes", "running shoes")).toBe(true);
    });

    it("should return true for queries with punctuation", () => {
      expect(areQueriesSimilar("running shoes!", "running shoes")).toBe(true);
    });

    it("should return false for different queries", () => {
      expect(areQueriesSimilar("running shoes", "basketball shoes")).toBe(
        false,
      );
    });

    it("should return true for complex similar queries with brands", () => {
      expect(
        areQueriesSimilar("nike running trainers!!!", "Nike running sneakers"),
      ).toBe(true);
    });

    it("should return true for empty strings", () => {
      expect(areQueriesSimilar("", "")).toBe(true);
    });
  });

  describe("getNormalizationSteps", () => {
    it("should return all normalization steps with brands", () => {
      const steps = getNormalizationSteps("  NIKE Running SNEAKERS!  ");

      expect(steps.original).toBe("  NIKE Running SNEAKERS!  ");
      expect(steps.basic).toBe("nike running sneakers");
      expect(steps.synonyms).toBe("nike running sneakers");
      expect(steps.brands).toBe("Nike running sneakers");
      expect(steps.colors).toBe("Nike running sneakers");
      expect(steps.final).toBe("Nike running sneakers");
    });

    it("should show basic normalization", () => {
      const steps = getNormalizationSteps("HELLO   WORLD!!!");

      expect(steps.original).toBe("HELLO   WORLD!!!");
      expect(steps.basic).toBe("hello world");
    });

    it("should show synonym transformation", () => {
      const steps = getNormalizationSteps("trainers");

      expect(steps.original).toBe("trainers");
      expect(steps.basic).toBe("trainers");
      expect(steps.synonyms).toBe("sneakers");
      expect(steps.final).toBe("sneakers");
    });

    it("should handle empty string", () => {
      const steps = getNormalizationSteps("");

      expect(steps.original).toBe("");
      expect(steps.basic).toBe("");
      expect(steps.synonyms).toBe("");
      expect(steps.brands).toBe("");
      expect(steps.colors).toBe("");
      expect(steps.final).toBe("");
    });

    it("should return object with all required keys", () => {
      const steps = getNormalizationSteps("test");

      expect(steps).toHaveProperty("original");
      expect(steps).toHaveProperty("basic");
      expect(steps).toHaveProperty("synonyms");
      expect(steps).toHaveProperty("brands");
      expect(steps).toHaveProperty("colors");
      expect(steps).toHaveProperty("final");
    });
  });
});
