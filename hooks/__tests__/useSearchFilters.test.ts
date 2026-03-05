import { renderHook, act } from "@testing-library/react";
import { useSearchFilters } from "../useSearchFilters";
import { FilterType } from "@/lib/types";

describe("useSearchFilters", () => {
  it("should initialize with empty filters", () => {
    const { result } = renderHook(() => useSearchFilters());

    expect(result.current.filters).toEqual({
      priceRange: [],
      brands: [],
      categories: [],
    });
  });

  it("should update filters with handleFiltersChange", () => {
    const { result } = renderHook(() => useSearchFilters());

    const newFilters = {
      priceRange: ["0-80"],
      brands: ["Nike"],
      categories: ["Running"],
    };

    act(() => {
      result.current.handleFiltersChange(newFilters);
    });

    expect(result.current.filters).toEqual(newFilters);
  });

  it("should remove price range filter with handleRemoveFilter", () => {
    const { result } = renderHook(() => useSearchFilters());

    // Set initial filters
    act(() => {
      result.current.handleFiltersChange({
        priceRange: ["0-80", "80-150"],
        brands: ["Nike"],
        categories: ["Running"],
      });
    });

    // Remove one price range
    act(() => {
      result.current.handleRemoveFilter(FilterType.PriceRange, "0-80");
    });

    expect(result.current.filters.priceRange).toEqual(["80-150"]);
    expect(result.current.filters.brands).toEqual(["Nike"]);
    expect(result.current.filters.categories).toEqual(["Running"]);
  });

  it("should remove brand filter with handleRemoveFilter", () => {
    const { result } = renderHook(() => useSearchFilters());

    // Set initial filters
    act(() => {
      result.current.handleFiltersChange({
        priceRange: ["0-80"],
        brands: ["Nike", "Adidas"],
        categories: ["Running"],
      });
    });

    // Remove one brand
    act(() => {
      result.current.handleRemoveFilter(FilterType.Brand, "Nike");
    });

    expect(result.current.filters.brands).toEqual(["Adidas"]);
    expect(result.current.filters.priceRange).toEqual(["0-80"]);
    expect(result.current.filters.categories).toEqual(["Running"]);
  });

  it("should remove category filter with handleRemoveFilter", () => {
    const { result } = renderHook(() => useSearchFilters());

    // Set initial filters
    act(() => {
      result.current.handleFiltersChange({
        priceRange: ["0-80"],
        brands: ["Nike"],
        categories: ["Running", "Training"],
      });
    });

    // Remove one category
    act(() => {
      result.current.handleRemoveFilter(FilterType.Category, "Running");
    });

    expect(result.current.filters.categories).toEqual(["Training"]);
    expect(result.current.filters.priceRange).toEqual(["0-80"]);
    expect(result.current.filters.brands).toEqual(["Nike"]);
  });

  it("should clear all filters with handleClearAllFilters", () => {
    const { result } = renderHook(() => useSearchFilters());

    // Set filters
    act(() => {
      result.current.handleFiltersChange({
        priceRange: ["0-80", "80-150"],
        brands: ["Nike", "Adidas"],
        categories: ["Running", "Training"],
      });
    });

    expect(result.current.filters.priceRange).toHaveLength(2);
    expect(result.current.filters.brands).toHaveLength(2);
    expect(result.current.filters.categories).toHaveLength(2);

    // Clear all filters
    act(() => {
      result.current.handleClearAllFilters();
    });

    expect(result.current.filters).toEqual({
      priceRange: [],
      brands: [],
      categories: [],
    });
  });

  it("should handle removing non-existent filter gracefully", () => {
    const { result } = renderHook(() => useSearchFilters());

    act(() => {
      result.current.handleFiltersChange({
        priceRange: ["0-80"],
        brands: ["Nike"],
        categories: ["Running"],
      });
    });

    // Try to remove filter that doesn't exist
    act(() => {
      result.current.handleRemoveFilter(FilterType.Brand, "Adidas");
    });

    // Should remain unchanged
    expect(result.current.filters.brands).toEqual(["Nike"]);
  });

  it("should allow manual setFilters", () => {
    const { result } = renderHook(() => useSearchFilters());

    const customFilters = {
      priceRange: ["150+"],
      brands: ["Asics", "Brooks"],
      categories: ["Trail"],
    };

    act(() => {
      result.current.setFilters(customFilters);
    });

    expect(result.current.filters).toEqual(customFilters);
  });
});
