import { renderHook } from "@testing-library/react";
import { useActiveFilters } from "../useActiveFilters";
import { SearchFilters } from "@/lib/types";

describe("useActiveFilters", () => {
  it("should return hasFilters as false when no filters are active", () => {
    const filters: SearchFilters = {
      priceRange: [],
      brands: [],
      categories: [],
    };

    const { result } = renderHook(() =>
      useActiveFilters({ filters, searchQuery: "" }),
    );

    expect(result.current.hasFilters).toBe(false);
    expect(result.current.filterCount).toBe(0);
  });

  it("should return hasFilters as true when price range filter is active", () => {
    const filters: SearchFilters = {
      priceRange: ["0-80"],
      brands: [],
      categories: [],
    };

    const { result } = renderHook(() =>
      useActiveFilters({ filters, searchQuery: "" }),
    );

    expect(result.current.hasFilters).toBe(true);
    expect(result.current.filterCount).toBe(1);
  });

  it("should return hasFilters as true when brand filter is active", () => {
    const filters: SearchFilters = {
      priceRange: [],
      brands: ["Nike"],
      categories: [],
    };

    const { result } = renderHook(() =>
      useActiveFilters({ filters, searchQuery: "" }),
    );

    expect(result.current.hasFilters).toBe(true);
    expect(result.current.filterCount).toBe(1);
  });

  it("should return hasFilters as true when category filter is active", () => {
    const filters: SearchFilters = {
      priceRange: [],
      brands: [],
      categories: ["Running"],
    };

    const { result } = renderHook(() =>
      useActiveFilters({ filters, searchQuery: "" }),
    );

    expect(result.current.hasFilters).toBe(true);
    expect(result.current.filterCount).toBe(1);
  });

  it("should count multiple filters correctly", () => {
    const filters: SearchFilters = {
      priceRange: ["0-80", "80-150"],
      brands: ["Nike", "Adidas"],
      categories: ["Running"],
    };

    const { result } = renderHook(() =>
      useActiveFilters({ filters, searchQuery: "" }),
    );

    expect(result.current.hasFilters).toBe(true);
    expect(result.current.filterCount).toBe(5); // 2 + 2 + 1
  });

  it("should return correct price labels", () => {
    const filters: SearchFilters = {
      priceRange: [],
      brands: [],
      categories: [],
    };

    const { result } = renderHook(() =>
      useActiveFilters({ filters, searchQuery: "" }),
    );

    expect(result.current.getPriceLabel("0-80")).toBe("$0 - $80");
    expect(result.current.getPriceLabel("80-150")).toBe("$80 - $150");
    expect(result.current.getPriceLabel("150+")).toBe("$150+");
    expect(result.current.getPriceLabel("unknown")).toBe("unknown");
  });

  it("should detect brand in search query", () => {
    const filters: SearchFilters = {
      priceRange: [],
      brands: [],
      categories: [],
    };

    const { result } = renderHook(() =>
      useActiveFilters({ filters, searchQuery: "nike running shoes" }),
    );

    expect(result.current.brandInQuery).toBe("Nike");
  });

  it("should detect brand in search query (case insensitive)", () => {
    const filters: SearchFilters = {
      priceRange: [],
      brands: [],
      categories: [],
    };

    const { result } = renderHook(() =>
      useActiveFilters({ filters, searchQuery: "ADIDAS ultraboost" }),
    );

    expect(result.current.brandInQuery).toBe("Adidas");
  });

  it("should return undefined when no brand in search query", () => {
    const filters: SearchFilters = {
      priceRange: [],
      brands: [],
      categories: [],
    };

    const { result } = renderHook(() =>
      useActiveFilters({ filters, searchQuery: "running shoes" }),
    );

    expect(result.current.brandInQuery).toBeUndefined();
  });

  it("should detect brand conflict when brand in query doesn't match filter", () => {
    const filters: SearchFilters = {
      priceRange: [],
      brands: ["Adidas"],
      categories: [],
    };

    const { result } = renderHook(() =>
      useActiveFilters({ filters, searchQuery: "nike shoes" }),
    );

    expect(result.current.brandInQuery).toBe("Nike");
    expect(result.current.hasBrandConflict).toBe(true);
  });

  it("should not detect brand conflict when brand in query matches filter", () => {
    const filters: SearchFilters = {
      priceRange: [],
      brands: ["Nike"],
      categories: [],
    };

    const { result } = renderHook(() =>
      useActiveFilters({ filters, searchQuery: "nike shoes" }),
    );

    expect(result.current.brandInQuery).toBe("Nike");
    expect(result.current.hasBrandConflict).toBe(false);
  });

  it("should not detect brand conflict when brand in query is in multiple filters", () => {
    const filters: SearchFilters = {
      priceRange: [],
      brands: ["Nike", "Adidas"],
      categories: [],
    };

    const { result } = renderHook(() =>
      useActiveFilters({ filters, searchQuery: "nike running" }),
    );

    expect(result.current.brandInQuery).toBe("Nike");
    expect(result.current.hasBrandConflict).toBe(false);
  });

  it("should not detect brand conflict when no brand filter is active", () => {
    const filters: SearchFilters = {
      priceRange: [],
      brands: [],
      categories: [],
    };

    const { result } = renderHook(() =>
      useActiveFilters({ filters, searchQuery: "nike shoes" }),
    );

    expect(result.current.brandInQuery).toBe("Nike");
    expect(result.current.hasBrandConflict).toBe(false);
  });

  it("should detect multiple brands and return first match", () => {
    const filters: SearchFilters = {
      priceRange: [],
      brands: [],
      categories: [],
    };

    const { result } = renderHook(() =>
      useActiveFilters({
        filters,
        searchQuery: "nike vs adidas comparison",
      }),
    );

    // Should return first brand found (Nike comes before Adidas in ALL_BRANDS array)
    expect(result.current.brandInQuery).toBe("Nike");
  });

  it("should memoize values correctly on re-render with same inputs", () => {
    const filters: SearchFilters = {
      priceRange: ["0-80"],
      brands: ["Nike"],
      categories: [],
    };

    const { result, rerender } = renderHook(
      ({ filters, searchQuery }) => useActiveFilters({ filters, searchQuery }),
      {
        initialProps: { filters, searchQuery: "nike shoes" },
      },
    );

    const firstResult = result.current;

    // Re-render with same inputs
    rerender({ filters, searchQuery: "nike shoes" });

    // Values should be the same (memoization working)
    expect(result.current.hasFilters).toBe(firstResult.hasFilters);
    expect(result.current.filterCount).toBe(firstResult.filterCount);
    expect(result.current.brandInQuery).toBe(firstResult.brandInQuery);
    expect(result.current.hasBrandConflict).toBe(firstResult.hasBrandConflict);
  });
});
