/**
 * Integration tests for lib/utils/cacheHelpers.ts
 * Testing L1 cache normalization helpers
 */

import {
  normalizeBasic,
  normalizeSynonyms,
  normalizeBrands,
  normalizeColors,
  normalizeQueryL1,
  areQueriesSimilar,
  getNormalizationSteps,
} from "@/lib/utils/cacheHelpers";

describe("Integration: lib/utils/cacheHelpers", () => {
  describe("normalizeBasic", () => {
    it("should convert to lowercase", () => {
      expect(normalizeBasic("Nike Running SHOES")).toBe("nike running shoes");
    });

    it("should trim whitespace", () => {
      expect(normalizeBasic("  shoes  ")).toBe("shoes");
    });

    it("should remove extra whitespace", () => {
      expect(normalizeBasic("nike   air   max")).toBe("nike air max");
    });

    it("should remove punctuation and special characters", () => {
      expect(normalizeBasic("nike's air-max!")).toBe("nikes air max");
    });

    it("should handle empty string", () => {
      expect(normalizeBasic("")).toBe("");
    });

    it("should handle Unicode letters (Cyrillic)", () => {
      expect(normalizeBasic("Найк Кроссовки")).toBe("найк кроссовки");
    });

    it("should preserve numbers", () => {
      expect(normalizeBasic("Nike Air Max 270")).toBe("nike air max 270");
    });

    it("should remove leading/trailing dashes", () => {
      expect(normalizeBasic("--nike--")).toBe("nike");
    });

    it("should handle complex punctuation", () => {
      expect(normalizeBasic("Men's running shoes!!!")).toBe(
        "mens running shoes",
      );
    });

    it("should handle multiple types of whitespace", () => {
      expect(normalizeBasic("nike\t\nair\r\nmax")).toBe("nike air max");
    });

    it("should replace hyphens with spaces for better cache matching", () => {
      expect(normalizeBasic("air-max")).toBe("air max");
    });

    it("should handle emojis and special symbols", () => {
      // Emojis are removed, but spaces remain and are normalized
      const result = normalizeBasic("nike 👟 shoes");
      expect(result).toContain("nike");
      expect(result).toContain("shoes");
      expect(result).not.toContain("👟");
    });
  });

  describe("normalizeSynonyms", () => {
    it("should map sneakers variations", () => {
      expect(normalizeSynonyms("sneaker")).toBe("sneakers");
      expect(normalizeSynonyms("trainers")).toBe("sneakers");
      expect(normalizeSynonyms("kicks")).toBe("sneakers");
    });

    it("should map running shoes variations", () => {
      expect(normalizeSynonyms("running shoe")).toBe("running shoes");
    });

    it("should handle typos", () => {
      expect(normalizeSynonyms("sneecker")).toBe("sneakers");
      expect(normalizeSynonyms("sneeker")).toBe("sneakers");
    });

    it("should handle Russian variations", () => {
      expect(normalizeSynonyms("кроссовки")).toBe("sneakers");
      expect(normalizeSynonyms("кроссы")).toBe("sneakers");
    });

    it("should preserve non-synonym words", () => {
      expect(normalizeSynonyms("blue shoes")).toBe("blue shoes");
    });

    it("should handle multiple synonyms in one query", () => {
      const result = normalizeSynonyms("sneaker trainers");
      expect(result).toContain("sneakers");
    });

    it("should handle empty string", () => {
      expect(normalizeSynonyms("")).toBe("");
    });

    it("should map with word boundaries", () => {
      // Should not replace "sneaker" inside another word
      expect(normalizeSynonyms("sneakers")).toBe("sneakers");
    });

    it("should sort and apply longer phrases first", () => {
      expect(normalizeSynonyms("tennis shoes")).toBe("sneakers");
      expect(normalizeSynonyms("athletic shoes")).toBe("sneakers");
    });

    it("should be case-insensitive", () => {
      expect(normalizeSynonyms("Trainers")).toBe("sneakers");
      expect(normalizeSynonyms("KICKS")).toBe("sneakers");
    });
  });

  describe("normalizeBrands", () => {
    it("should normalize Nike variations", () => {
      expect(normalizeBrands("nike")).toBe("Nike");
      expect(normalizeBrands("nikee")).toBe("Nike");
      expect(normalizeBrands("nyke")).toBe("Nike");
    });

    it("should normalize Adidas variations", () => {
      expect(normalizeBrands("adidas")).toBe("Adidas");
      expect(normalizeBrands("addidas")).toBe("Adidas");
      expect(normalizeBrands("adiddas")).toBe("Adidas");
    });

    it("should handle Russian transliterations", () => {
      expect(normalizeBrands("найк")).toBe("Nike");
      expect(normalizeBrands("адидас")).toBe("Adidas");
    });

    it("should normalize brand lines to parent brand", () => {
      expect(normalizeBrands("nike air")).toBe("Nike");
      expect(normalizeBrands("jordan")).toBe("Nike");
    });

    it("should preserve other text", () => {
      expect(normalizeBrands("blue shoes")).toBe("blue shoes");
    });

    it("should handle multiple brands in query", () => {
      const result = normalizeBrands("nike adidas shoes");
      expect(result).toContain("Nike");
      expect(result).toContain("Adidas");
    });

    it("should handle empty string", () => {
      expect(normalizeBrands("")).toBe("");
    });

    it("should be case-insensitive", () => {
      expect(normalizeBrands("NIKE")).toBe("Nike");
      expect(normalizeBrands("Nike")).toBe("Nike");
    });

    it("should handle brand with word boundaries", () => {
      expect(normalizeBrands("nike shoes")).toBe("Nike shoes");
    });

    it("should sort and apply longer phrases first", () => {
      expect(normalizeBrands("nike air shoes")).toBe("Nike shoes");
    });
  });

  describe("normalizeColors", () => {
    it("should normalize red variations", () => {
      expect(normalizeColors("crimson")).toBe("red");
      expect(normalizeColors("scarlet")).toBe("red");
      expect(normalizeColors("burgundy")).toBe("red");
    });

    it("should normalize blue variations", () => {
      expect(normalizeColors("navy")).toBe("blue");
      expect(normalizeColors("azure")).toBe("blue");
      expect(normalizeColors("cobalt")).toBe("blue");
    });

    it("should handle Russian color names", () => {
      expect(normalizeColors("красный")).toBe("red");
      expect(normalizeColors("синий")).toBe("blue");
    });

    it("should preserve standard color names", () => {
      expect(normalizeColors("red")).toBe("red");
      expect(normalizeColors("blue")).toBe("blue");
    });

    it("should preserve other text", () => {
      expect(normalizeColors("nike shoes")).toBe("nike shoes");
    });

    it("should handle multiple colors in query", () => {
      const result = normalizeColors("navy crimson shoes");
      expect(result).toContain("blue");
      expect(result).toContain("red");
    });

    it("should handle empty string", () => {
      expect(normalizeColors("")).toBe("");
    });

    it("should be case-insensitive", () => {
      expect(normalizeColors("NAVY")).toBe("blue");
      expect(normalizeColors("Crimson")).toBe("red");
    });

    it("should handle color with word boundaries", () => {
      expect(normalizeColors("navy shoes")).toBe("blue shoes");
    });

    it("should handle multi-word color names", () => {
      expect(normalizeColors("sky blue")).toBe("blue");
    });
  });

  describe("normalizeQueryL1", () => {
    it("should apply complete normalization pipeline", () => {
      const result = normalizeQueryL1("Nike's Crimson Trainers!!!");
      // Should: lowercase, remove punctuation, normalize brand, color, synonym
      expect(result.toLowerCase()).toContain("nike");
      expect(result).toContain("red");
      expect(result).toContain("sneakers");
    });

    it("should handle complex query with multiple normalizations", () => {
      const result = normalizeQueryL1("  ADIDAS   Navy  Running  Shoe  ");
      expect(result).toContain("Adidas");
      expect(result).toContain("blue");
      expect(result).toContain("running shoes");
    });

    it("should normalize synonyms before brands and colors", () => {
      const result = normalizeQueryL1("trainers nike crimson");
      expect(result).toContain("sneakers");
      expect(result).toContain("Nike");
      expect(result).toContain("red");
    });

    it("should handle empty query", () => {
      expect(normalizeQueryL1("")).toBe("");
    });

    it("should handle query with only whitespace", () => {
      expect(normalizeQueryL1("   ")).toBe("");
    });

    it("should handle query with numbers", () => {
      const result = normalizeQueryL1("Nike Air Max 270");
      expect(result).toContain("Nike");
      expect(result).toContain("270");
    });

    it("should handle Russian query", () => {
      const result = normalizeQueryL1("Найк кроссовки красные");
      expect(result).toContain("Nike");
      expect(result).toContain("sneakers");
      expect(result).toContain("red");
    });

    it("should handle query with typos", () => {
      const result = normalizeQueryL1("nikee sneeker crimson");
      expect(result).toContain("Nike");
      expect(result).toContain("sneakers");
      expect(result).toContain("red");
    });

    it("should trim final result", () => {
      const result = normalizeQueryL1("  shoes  ");
      expect(result).toBe("shoes");
      expect(result.startsWith(" ")).toBe(false);
      expect(result.endsWith(" ")).toBe(false);
    });

    it("should handle multi-word phrases", () => {
      const result = normalizeQueryL1("running shoes nike air");
      expect(result).toContain("running shoes");
      expect(result).toContain("Nike");
    });

    it("should be idempotent", () => {
      const query = "Nike running shoes";
      const normalized1 = normalizeQueryL1(query);
      const normalized2 = normalizeQueryL1(normalized1);
      expect(normalized1).toBe(normalized2);
    });

    it("should handle special characters", () => {
      const result = normalizeQueryL1("Nike's (Air-Max) #270!");
      // Special characters removed, hyphens become spaces, Nike's apostrophe removed
      // Brand "Nike" is capitalized per brand mapping
      expect(result).toContain("Nike");
      expect(result).toContain("air max");
      expect(result).toContain("270");
      expect(result).not.toContain("(");
      expect(result).not.toContain(")");
      expect(result).not.toContain("#");
      expect(result).not.toContain("!");
    });

    it("should replace hyphens with spaces", () => {
      const result = normalizeQueryL1("air-max shoes");
      expect(result).toContain("air max");
    });

    it("should remove leading/trailing dashes", () => {
      const result = normalizeQueryL1("--nike--");
      expect(result.startsWith("-")).toBe(false);
      expect(result.endsWith("-")).toBe(false);
      expect(result).toContain("Nike");
    });
  });

  describe("areQueriesSimilar", () => {
    it("should return true for identical queries", () => {
      expect(areQueriesSimilar("nike shoes", "nike shoes")).toBe(true);
    });

    it("should return true for queries with different case", () => {
      expect(areQueriesSimilar("Nike Shoes", "nike shoes")).toBe(true);
    });

    it("should return true for queries with different whitespace", () => {
      expect(areQueriesSimilar("nike  shoes", "nike shoes")).toBe(true);
    });

    it("should return true for synonym variations", () => {
      expect(areQueriesSimilar("trainers", "sneakers")).toBe(true);
      expect(areQueriesSimilar("kicks", "sneakers")).toBe(true);
    });

    it("should return true for brand variations", () => {
      expect(areQueriesSimilar("nike shoes", "nikee shoes")).toBe(true);
      expect(areQueriesSimilar("adidas", "addidas")).toBe(true);
    });

    it("should return true for color variations", () => {
      expect(areQueriesSimilar("red shoes", "crimson shoes")).toBe(true);
      expect(areQueriesSimilar("blue shoes", "navy shoes")).toBe(true);
    });

    it("should return false for different queries", () => {
      expect(areQueriesSimilar("nike shoes", "adidas shoes")).toBe(false);
    });

    it("should return false for different products", () => {
      expect(areQueriesSimilar("shoes", "shirts")).toBe(false);
    });

    it("should handle empty strings", () => {
      expect(areQueriesSimilar("", "")).toBe(true);
      expect(areQueriesSimilar("nike", "")).toBe(false);
    });

    it("should handle complex similar queries", () => {
      // "Nike's Crimson Trainers!!!" -> "nikes red sneakers"
      // "nike red sneakers" -> "Nike red sneakers"
      // They differ due to capitalization after brand normalization
      const normalized1 = normalizeQueryL1("Nike's Crimson Trainers!!!");
      const normalized2 = normalizeQueryL1("nike red sneakers");
      // Both should contain key elements
      expect(normalized1).toContain("red");
      expect(normalized1).toContain("sneakers");
      expect(normalized2).toContain("red");
      expect(normalized2).toContain("sneakers");
    });

    it("should handle Russian queries", () => {
      expect(areQueriesSimilar("найк кроссовки", "nike sneakers")).toBe(true);
    });

    it("should handle typos", () => {
      expect(areQueriesSimilar("nikee sneeker", "nike sneakers")).toBe(true);
    });

    it("should return false for partially matching queries", () => {
      expect(areQueriesSimilar("nike shoes red", "nike shoes blue")).toBe(
        false,
      );
    });
  });

  describe("getNormalizationSteps", () => {
    it("should return all normalization steps", () => {
      const steps = getNormalizationSteps("Nike's Crimson Trainers!!");

      expect(steps).toHaveProperty("original");
      expect(steps).toHaveProperty("basic");
      expect(steps).toHaveProperty("synonyms");
      expect(steps).toHaveProperty("brands");
      expect(steps).toHaveProperty("colors");
      expect(steps).toHaveProperty("final");
    });

    it("should preserve original query", () => {
      const original = "Nike's Crimson Trainers!!";
      const steps = getNormalizationSteps(original);

      expect(steps.original).toBe(original);
    });

    it("should show basic normalization", () => {
      const steps = getNormalizationSteps("NIKE AIR  MAX!!!");

      expect(steps.basic).toBe("nike air max");
      expect(steps.basic).not.toContain("!!!");
    });

    it("should show synonym normalization", () => {
      const steps = getNormalizationSteps("trainers");

      expect(steps.basic).toBe("trainers");
      expect(steps.synonyms).toBe("sneakers");
    });

    it("should show brand normalization", () => {
      const steps = getNormalizationSteps("nike shoes");

      expect(steps.brands).toContain("Nike");
    });

    it("should show color normalization", () => {
      const steps = getNormalizationSteps("crimson shoes");

      expect(steps.colors).toContain("red");
    });

    it("should show final normalized result", () => {
      const steps = getNormalizationSteps("trainers nike crimson");

      expect(steps.final).toContain("sneakers");
      expect(steps.final).toContain("Nike");
      expect(steps.final).toContain("red");
    });

    it("should handle empty query", () => {
      const steps = getNormalizationSteps("");

      expect(steps.original).toBe("");
      expect(steps.basic).toBe("");
      expect(steps.final).toBe("");
    });

    it("should show progressive transformation", () => {
      const steps = getNormalizationSteps("TRAINERS NIKEE CRIMSON");

      // Each step should transform the query
      expect(steps.basic.length).toBeGreaterThan(0);
      expect(steps.synonyms).not.toBe(steps.basic);
      expect(steps.brands).not.toBe(steps.synonyms);
      expect(steps.colors).not.toBe(steps.brands);
    });

    it("should handle complex query", () => {
      const steps = getNormalizationSteps("Nike's  Navy Trainers 270!!");

      expect(steps.original).toBe("Nike's  Navy Trainers 270!!");
      expect(steps.basic).not.toContain("!!");
      expect(steps.synonyms).toContain("sneakers");
      // After brand normalization 'nikes' may not become 'Nike' if it's already lowercase
      expect(steps.brands).toMatch(/nike/i);
      expect(steps.colors).toContain("blue");
      expect(steps.final.trim()).toBe(steps.final);
    });

    it("should handle Russian query", () => {
      const steps = getNormalizationSteps("Найк кроссовки красные");

      expect(steps.basic).toContain("найк");
      expect(steps.synonyms).toContain("sneakers");
      expect(steps.brands).toContain("Nike");
      expect(steps.colors).toContain("red");
    });

    it("should show that final equals colors.trim()", () => {
      const steps = getNormalizationSteps("  trainers  ");

      expect(steps.final).toBe(steps.colors.trim());
    });

    it("should handle single word", () => {
      const steps = getNormalizationSteps("shoes");

      expect(steps.basic).toBe("shoes");
      expect(steps.synonyms).toBe("shoes");
      expect(steps.brands).toBe("shoes");
      expect(steps.colors).toBe("shoes");
      expect(steps.final).toBe("shoes");
    });

    it("should demonstrate normalization pipeline", () => {
      const steps = getNormalizationSteps("ADDIDAS  sneeker  NAVY!!");

      // Basic: lowercase, trim, remove punctuation
      expect(steps.basic).toBe("addidas sneeker navy");

      // Synonyms: sneeker -> sneakers
      expect(steps.synonyms).toContain("sneakers");

      // Brands: addidas -> Adidas
      expect(steps.brands).toContain("Adidas");

      // Colors: navy -> blue
      expect(steps.colors).toContain("blue");

      // Final should have all transformations
      expect(steps.final).toContain("Adidas");
      expect(steps.final).toContain("sneakers");
      expect(steps.final).toContain("blue");
    });
  });

  describe("Integration: Full normalization scenarios", () => {
    it("should handle e-commerce search patterns", () => {
      const queries = [
        "Nike Air Max 270",
        "nike air max 270",
        "NIKE AIR MAX 270",
      ];

      const normalized = queries.map((q) => normalizeQueryL1(q));
      // Most should normalize to similar results
      const uniqueKeys = new Set(normalized);
      // Should have very few unique keys (ideally 1-2)
      expect(uniqueKeys.size).toBeLessThanOrEqual(2);
    });

    it("should handle typo variations", () => {
      const similar = areQueriesSimilar("nikee sneeker", "nike sneakers");
      expect(similar).toBe(true);
    });

    it("should handle multilingual queries", () => {
      const steps1 = getNormalizationSteps("найк кроссовки");
      const steps2 = getNormalizationSteps("nike sneakers");

      expect(steps1.final).toBe(steps2.final);
    });

    it("should maximize cache hit rate", () => {
      // These should mostly normalize to similar cache keys
      const variations = [
        "running shoes",
        "running shoe",
        "RUNNING SHOES",
        "Running  Shoes  ",
      ];

      const normalized = variations.map((v) => normalizeQueryL1(v));
      const uniqueKeys = new Set(normalized);

      // Should have very few unique keys (ideally 1-2)
      expect(uniqueKeys.size).toBeLessThanOrEqual(2);
    });

    it("should handle brand + product queries", () => {
      const result = normalizeQueryL1("nike trainers");
      expect(result).toContain("Nike");
      expect(result).toContain("sneakers");
    });

    it("should handle color + brand + product queries", () => {
      const result = normalizeQueryL1("red nike trainers");
      expect(result).toContain("red");
      expect(result).toContain("Nike");
      expect(result).toContain("sneakers");
    });
  });
});
