/**
 * Unit tests for Search Helper Functions
 */

import {
  generateCacheKey,
  generateRejectionMessage,
  generateExplanation,
} from "../searchHelpers";
import type { Product, ParsedQuery } from "@/lib/types";
import { Gender } from "@/lib/types";

describe("searchHelpers", () => {
  describe("generateCacheKey", () => {
    it("should return normalized query when no filters", () => {
      const result = generateCacheKey("running shoes");
      expect(result).toBe("running-shoes");
    });

    it("should return normalized query when filters are empty", () => {
      const result = generateCacheKey("running shoes", {});
      expect(result).toBe("running-shoes");
    });

    it("should include price range filter", () => {
      const result = generateCacheKey("shoes", {
        priceRange: ["80-150", "0-80"],
      });
      expect(result).toBe("shoes|pr:0-80,80-150");
    });

    it("should include brands filter", () => {
      const result = generateCacheKey("shoes", {
        brands: ["Nike", "Adidas"],
      });
      expect(result).toBe("shoes|br:Adidas,Nike");
    });

    it("should include categories filter", () => {
      const result = generateCacheKey("shoes", {
        categories: ["sneakers", "boots"],
      });
      expect(result).toBe("shoes|cat:boots,sneakers");
    });

    it("should combine multiple filters", () => {
      const result = generateCacheKey("running shoes", {
        priceRange: ["80-150"],
        brands: ["Nike", "Adidas"],
        categories: ["sneakers"],
      });
      expect(result).toBe(
        "running-shoes|pr:80-150|br:Adidas,Nike|cat:sneakers",
      );
    });

    it("should sort filter values for consistency", () => {
      const result1 = generateCacheKey("shoes", {
        brands: ["Nike", "Adidas", "Puma"],
      });
      const result2 = generateCacheKey("shoes", {
        brands: ["Puma", "Nike", "Adidas"],
      });
      expect(result1).toBe(result2);
    });

    it("should handle empty arrays in filters", () => {
      const result = generateCacheKey("shoes", {
        priceRange: [],
        brands: [],
        categories: [],
      });
      expect(result).toBe("shoes");
    });

    it("should ignore undefined filter properties", () => {
      const result = generateCacheKey("shoes", {
        brands: ["Nike"],
      });
      expect(result).not.toContain("pr:");
      expect(result).not.toContain("cat:");
    });
  });

  describe("generateRejectionMessage", () => {
    it("should generate message for not_footwear", () => {
      const result = generateRejectionMessage(
        "not_footwear",
        undefined,
        "laptop",
      );
      expect(result).toContain("We only sell footwear");
      expect(result).toContain("laptop");
    });

    it("should generate message for question_not_search", () => {
      const result = generateRejectionMessage(
        "question_not_search",
        undefined,
        "how to choose shoes?",
      );
      expect(result).toContain("Please search for products");
      expect(result).toContain("instead of asking questions");
    });

    it("should generate message for nonsense", () => {
      const result = generateRejectionMessage("nonsense", undefined, "asdfgh");
      expect(result).toContain("couldn't understand");
      expect(result).toContain("asdfgh");
    });

    it("should generate default message for unknown reason", () => {
      const result = generateRejectionMessage(
        "unknown_reason",
        undefined,
        "test query",
      );
      expect(result).toContain("No products found");
      expect(result).toContain("test query");
    });

    it("should include suggestion when provided", () => {
      const result = generateRejectionMessage(
        "not_footwear",
        "Try searching for sneakers",
        "laptop",
      );
      expect(result).toContain("Try searching for:");
      expect(result).toContain("Try searching for sneakers");
    });

    it("should handle undefined reason gracefully", () => {
      const result = generateRejectionMessage(undefined, undefined, "test");
      expect(result).toContain("No products found");
    });

    it("should append suggestion to any reason message", () => {
      const result = generateRejectionMessage(
        "nonsense",
        "Try Nike shoes",
        "gibberish",
      );
      expect(result).toContain("couldn't understand");
      expect(result).toContain("Try searching for:");
      expect(result).toContain("Try Nike shoes");
    });
  });

  describe("generateExplanation", () => {
    const mockProducts: Product[] = [
      {
        id: "1",
        name: "Nike Air Max",
        brand: "Nike",
        price: 120,
        category: "Sneakers",
        color: "red",
        gender: Gender.Men,
        image: "image1.jpg",
        description: "Running shoes",
        sizes: [8, 9, 10, 11],
        inStock: true,
        rating: 4.5,
        features: ["Cushioned", "Breathable"],
      },
      {
        id: "2",
        name: "Adidas Ultra Boost",
        brand: "Adidas",
        price: 180,
        category: "Sneakers",
        color: "blue",
        gender: Gender.Men,
        image: "image2.jpg",
        description: "Performance shoes",
        sizes: [8, 9, 10, 11, 12],
        inStock: true,
        rating: 4.8,
        features: ["Energy Return", "Comfortable"],
      },
      {
        id: "3",
        name: "Puma RS-X",
        brand: "Puma",
        price: 100,
        category: "Sneakers",
        color: "white",
        gender: Gender.Unisex,
        image: "image3.jpg",
        description: "Lifestyle shoes",
        sizes: [7, 8, 9, 10],
        inStock: true,
        rating: 4.3,
        features: ["Retro Style", "Lightweight"],
      },
    ];

    describe("successful results", () => {
      it("should generate explanation with product count", () => {
        const parsed: ParsedQuery = {
          semanticQuery: "running shoes",
          originalQuery: "running shoes",
        };

        const result = generateExplanation(
          "running shoes",
          mockProducts,
          parsed,
        );
        expect(result).toContain("Found 3 products");
        expect(result).toContain("running shoes");
      });

      it("should list top products", () => {
        const parsed: ParsedQuery = {
          semanticQuery: "shoes",
          originalQuery: "shoes",
        };

        const result = generateExplanation("shoes", mockProducts, parsed);
        expect(result).toContain("Nike Air Max");
        expect(result).toContain("Adidas Ultra Boost");
        expect(result).toContain("Puma RS-X");
      });

      it("should list brands", () => {
        const parsed: ParsedQuery = {
          semanticQuery: "shoes",
          originalQuery: "shoes",
        };

        const result = generateExplanation("shoes", mockProducts, parsed);
        expect(result).toContain("Brands:");
        expect(result).toContain("Nike");
        expect(result).toContain("Adidas");
        expect(result).toContain("Puma");
      });

      it("should show average price", () => {
        const parsed: ParsedQuery = {
          semanticQuery: "shoes",
          originalQuery: "shoes",
        };

        const result = generateExplanation("shoes", mockProducts, parsed);
        expect(result).toContain("Avg price: $133"); // (120+180+100)/3 = 133
      });

      it("should explain semantic query if different", () => {
        const parsed: ParsedQuery = {
          semanticQuery: "athletic footwear",
          originalQuery: "running kicks",
        };

        const result = generateExplanation(
          "running kicks",
          mockProducts,
          parsed,
        );
        expect(result).toContain("Searching for: athletic footwear");
      });

      it("should explain gender filter", () => {
        const parsed: ParsedQuery = {
          semanticQuery: "mens shoes",
          originalQuery: "mens shoes",
          gender: Gender.Men,
        };

        const result = generateExplanation("mens shoes", mockProducts, parsed);
        expect(result).toContain("Filters:");
        expect(result).toContain("men's shoes");
      });

      it("should explain max price filter", () => {
        const parsed: ParsedQuery = {
          semanticQuery: "cheap shoes",
          originalQuery: "cheap shoes",
          maxPrice: 100,
        };

        const result = generateExplanation("cheap shoes", mockProducts, parsed);
        expect(result).toContain("under $100");
      });

      it("should explain color filter", () => {
        const parsed: ParsedQuery = {
          semanticQuery: "red shoes",
          originalQuery: "red shoes",
          color: "red",
        };

        const result = generateExplanation("red shoes", mockProducts, parsed);
        expect(result).toContain("red color");
      });

      it("should show special terms if present", () => {
        const parsed: ParsedQuery = {
          semanticQuery: "shoes",
          originalQuery: "кроссы",
          specialTerms: ["кроссы"],
        };

        const result = generateExplanation("кроссы", mockProducts, parsed);
        expect(result).toContain("Understood:");
        expect(result).toContain("кроссы");
      });

      it("should combine multiple filters in explanation", () => {
        const parsed: ParsedQuery = {
          semanticQuery: "running shoes",
          originalQuery: "red nike shoes under $150",
          gender: Gender.Women,
          maxPrice: 150,
          color: "red",
        };

        const result = generateExplanation(
          "red nike shoes under $150",
          mockProducts,
          parsed,
        );
        expect(result).toContain("Filters:");
        expect(result).toContain("women's shoes");
        expect(result).toContain("under $150");
        expect(result).toContain("red color");
      });
    });

    describe("empty results", () => {
      it("should generate message for no products", () => {
        const parsed: ParsedQuery = {
          semanticQuery: "unicorn shoes",
          originalQuery: "unicorn shoes",
        };

        const result = generateExplanation("unicorn shoes", [], parsed);
        expect(result).toContain("No products found");
        expect(result).toContain("unicorn shoes");
      });

      it("should explain applied gender filter", () => {
        const parsed: ParsedQuery = {
          semanticQuery: "shoes",
          originalQuery: "womens boots",
          gender: Gender.Women,
        };

        const result = generateExplanation("womens boots", [], parsed);
        expect(result).toContain("Applied filters:");
        expect(result).toContain("gender: women");
      });

      it("should explain applied price filters", () => {
        const parsed: ParsedQuery = {
          semanticQuery: "shoes",
          originalQuery: "shoes $50-100",
          minPrice: 50,
          maxPrice: 100,
        };

        const result = generateExplanation("shoes $50-100", [], parsed);
        expect(result).toContain("max price: $100");
        expect(result).toContain("min price: $50");
      });

      it("should explain color filter and suggest removing it", () => {
        const parsed: ParsedQuery = {
          semanticQuery: "purple shoes",
          originalQuery: "purple shoes",
          color: "purple",
        };

        const result = generateExplanation("purple shoes", [], parsed);
        expect(result).toContain("color: purple");
        expect(result).toContain("try without color filter");
      });

      it("should explain brand filter and suggest alternatives", () => {
        const parsed: ParsedQuery = {
          semanticQuery: "rare brand shoes",
          originalQuery: "rare brand shoes",
          brand: "RareBrand",
        };

        const result = generateExplanation("rare brand shoes", [], parsed);
        expect(result).toContain("brand: RareBrand");
        expect(result).toContain("try different brands");
      });

      it("should show suggested query if present", () => {
        const parsed: ParsedQuery = {
          semanticQuery: "xyz shoes",
          originalQuery: "xyz shoes",
          suggestedQuery: "Try Nike sneakers",
        };

        const result = generateExplanation("xyz shoes", [], parsed);
        expect(result).toContain('Or search: "Try Nike sneakers"');
      });

      it("should provide default suggestion when no specific filters", () => {
        const parsed: ParsedQuery = {
          semanticQuery: "unknown",
          originalQuery: "unknown",
        };

        const result = generateExplanation("unknown", [], parsed);
        expect(result).toContain(
          "Try adjusting your search or removing filters",
        );
      });

      it("should combine multiple filter explanations", () => {
        const parsed: ParsedQuery = {
          semanticQuery: "specific shoes",
          originalQuery: "specific shoes",
          gender: Gender.Men,
          color: "purple",
          brand: "RareBrand",
          maxPrice: 50,
        };

        const result = generateExplanation("specific shoes", [], parsed);
        expect(result).toContain("Applied filters:");
        expect(result).toContain("gender: men");
        expect(result).toContain("max price: $50");
        expect(result).toContain("color: purple");
        expect(result).toContain("brand: RareBrand");
        expect(result).toContain("Try:");
        expect(result).toContain("try without color filter");
        expect(result).toContain("try different brands");
      });
    });
  });
});
