import { http, HttpResponse } from "msw";
import {
  mockNikeShoe,
  mockAdidasShoe,
  mockPumaShoe,
} from "../data/products.mock";
import { SearchResponse } from "@/lib/types";

export const searchHandlers = [
  // Successful search - returns Nike and Adidas shoes
  http.post("http://localhost/api/search", async ({ request }) => {
    const body = (await request.json()) as {
      query: string;
      filters?: {
        brands?: string[];
        priceRange?: string[];
        categories?: string[];
      };
      excludedIds?: string[];
    };
    const { query, filters } = body;

    // Empty query validation
    if (!query || query.trim().length === 0) {
      return HttpResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Simulate API error
    if (query === "trigger-error") {
      return HttpResponse.json(
        { error: "Search failed", details: "Internal server error" },
        { status: 500 },
      );
    }

    // Empty results scenario
    if (query === "nonexistent product") {
      const response: SearchResponse = {
        success: true,
        query,
        count: 0,
        totalBeforeFilters: 0,
        products: [],
        explanation: `No products found matching "${query}". Try different keywords.`,
        performance: {
          embedding: "5ms",
          search: "10ms",
          total: "15ms",
        },
      };
      return HttpResponse.json(response);
    }

    // Start with all products
    let products = [mockNikeShoe, mockAdidasShoe, mockPumaShoe];
    const totalBeforeFilters = products.length;

    // Apply filters if provided
    if (filters) {
      // Filter by price range
      if (filters.priceRange && filters.priceRange.length > 0) {
        products = products.filter((p) => {
          return filters.priceRange!.some((range: string) => {
            if (range === "0-80") return p.price >= 0 && p.price <= 80;
            if (range === "80-150") return p.price > 80 && p.price <= 150;
            if (range === "150+") return p.price > 150;
            return true;
          });
        });
      }

      // Filter by brands
      if (filters.brands && filters.brands.length > 0) {
        products = products.filter((p) => filters.brands!.includes(p.brand));
      }

      // Filter by categories
      if (filters.categories && filters.categories.length > 0) {
        products = products.filter((p) =>
          filters.categories!.includes(p.category),
        );
      }
    }

    const response: SearchResponse = {
      success: true,
      query,
      count: products.length,
      totalBeforeFilters,
      products,
      explanation:
        products.length > 0
          ? `Found ${products.length} products matching your search for ${query}.`
          : `No products found matching your criteria.`,
      performance: {
        embedding: "5ms",
        search: "12ms",
        total: "17ms",
      },
    };

    return HttpResponse.json(response);
  }),
];
