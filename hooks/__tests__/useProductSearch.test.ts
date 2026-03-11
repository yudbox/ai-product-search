import { renderHook, waitFor, act } from "@testing-library/react";
import { useProductSearch } from "../useProductSearch";
import { SearchFilters, SearchResponse, Gender } from "@/lib/types";

// Mock fetch
global.fetch = jest.fn();

describe("useProductSearch", () => {
  const mockProducts = Array.from({ length: 25 }, (_, i) => ({
    id: `${i + 1}`,
    name: `Product ${i + 1}`,
    price: 100 + i * 10,
    brand: i % 2 === 0 ? "Nike" : "Adidas",
    category: i % 3 === 0 ? "Running" : "Training",
    image: `image${i + 1}.jpg`,
    description: `Description ${i + 1}`,
    color: i % 2 === 0 ? "Black" : "White",
    sizes: [8, 9, 10],
    inStock: true,
    rating: 4.5,
    features: ["Feature"],
    gender: i % 2 === 0 ? Gender.Men : Gender.Women,
  }));

  const mockResponse: SearchResponse = {
    success: true,
    query: "running shoes",
    count: 25,
    totalBeforeFilters: 50,
    products: mockProducts,
    explanation: "Found great running shoes",
    hasMoreResults: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });
  });

  it("should initialize with empty state", () => {
    const filters: SearchFilters = {
      priceRange: [],
      brands: [],
      categories: [],
    };

    const { result } = renderHook(() =>
      useProductSearch({ query: "", filters }),
    );

    expect(result.current.products).toEqual([]);
    expect(result.current.displayedProducts).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.loadingMore).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.explanation).toBe("");
    expect(result.current.totalBeforeFilters).toBe(0);
    expect(result.current.hasMore).toBe(false);
  });

  it("should not fetch when query is empty", () => {
    const filters: SearchFilters = {
      priceRange: [],
      brands: [],
      categories: [],
    };

    renderHook(() => useProductSearch({ query: "", filters }));

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should fetch products when query is provided", async () => {
    const filters: SearchFilters = {
      priceRange: [],
      brands: [],
      categories: [],
    };

    const { result } = renderHook(() =>
      useProductSearch({ query: "running shoes", filters }),
    );

    // Should start loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "running shoes",
        filters: { priceRange: [] },
      }),
    });

    expect(result.current.products).toEqual(mockProducts);
    expect(result.current.explanation).toBe("Found great running shoes");
    expect(result.current.totalBeforeFilters).toBe(50);
    expect(result.current.error).toBe(null);
  });

  it("should fetch with filters", async () => {
    const filters: SearchFilters = {
      priceRange: ["0-80"],
      brands: ["Nike"],
      categories: ["Running"],
    };

    const { result } = renderHook(() =>
      useProductSearch({ query: "shoes", filters }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "shoes",
        filters: { priceRange: ["0-80"] },
      }),
    });
  });

  it("should handle fetch error", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const filters: SearchFilters = {
      priceRange: [],
      brands: [],
      categories: [],
    };

    const { result } = renderHook(() =>
      useProductSearch({ query: "test", filters }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(
      "Failed to load results. Please try again.",
    );
    expect(result.current.products).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith("Search error:", expect.any(Error));

    consoleSpy.mockRestore();
  });

  it("should handle network error", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();

    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network error"),
    );

    const filters: SearchFilters = {
      priceRange: [],
      brands: [],
      categories: [],
    };

    const { result } = renderHook(() =>
      useProductSearch({ query: "test", filters }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(
      "Failed to load results. Please try again.",
    );
    expect(result.current.products).toEqual([]);

    consoleSpy.mockRestore();
  });

  it("should refetch when query changes", async () => {
    const filters: SearchFilters = {
      priceRange: [],
      brands: [],
      categories: [],
    };

    const { rerender, result } = renderHook(
      ({ query, filters }) => useProductSearch({ query, filters }),
      {
        initialProps: { query: "nike", filters },
      },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Change query
    rerender({ query: "adidas", filters });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    expect(global.fetch).toHaveBeenLastCalledWith("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "adidas",
        filters: { priceRange: filters.priceRange },
      }),
    });
  });

  it("should refetch when priceRange filter changes", async () => {
    const initialFilters: SearchFilters = {
      priceRange: [],
      brands: [],
      categories: [],
    };

    const { rerender, result } = renderHook(
      ({ query, filters }) => useProductSearch({ query, filters }),
      {
        initialProps: { query: "shoes", filters: initialFilters },
      },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Change priceRange filter (should refetch)
    const newFilters: SearchFilters = {
      priceRange: ["0-80"],
      brands: ["Nike"],
      categories: [],
    };

    rerender({ query: "shoes", filters: newFilters });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    expect(global.fetch).toHaveBeenLastCalledWith("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: "shoes",
        filters: { priceRange: ["0-80"] },
      }),
    });
  });

  it("should NOT refetch when only brands/categories change", async () => {
    const initialFilters: SearchFilters = {
      priceRange: [],
      brands: [],
      categories: [],
    };

    const { rerender, result } = renderHook(
      ({ query, filters }) => useProductSearch({ query, filters }),
      {
        initialProps: { query: "shoes", filters: initialFilters },
      },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    // Change only brands/categories (should NOT refetch, only re-filter client-side)
    const newFilters: SearchFilters = {
      priceRange: [],
      brands: ["Nike"],
      categories: ["Running"],
    };

    rerender({ query: "shoes", filters: newFilters });

    // Should still be 1 fetch call (no refetch)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // Should show filtered products (client-side filtering)
    expect(result.current.products.length).toBeLessThanOrEqual(
      mockProducts.length,
    );
  });

  it("should clear products when query becomes empty", async () => {
    const filters: SearchFilters = {
      priceRange: [],
      brands: [],
      categories: [],
    };

    const { rerender, result } = renderHook(
      ({ query, filters }) => useProductSearch({ query, filters }),
      {
        initialProps: { query: "shoes", filters },
      },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toEqual(mockProducts);

    // Clear query
    rerender({ query: "", filters });

    // Products should be cleared
    expect(result.current.products).toEqual([]);
  });

  it("should use totalBeforeFilters from response", async () => {
    const filters: SearchFilters = {
      priceRange: [],
      brands: [],
      categories: [],
    };

    const { result } = renderHook(() =>
      useProductSearch({ query: "test", filters }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.totalBeforeFilters).toBe(50);
  });

  it("should fallback to count when totalBeforeFilters is missing", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        query: "test",
        count: 10,
        products: mockProducts,
      }),
    });

    const filters: SearchFilters = {
      priceRange: [],
      brands: [],
      categories: [],
    };

    const { result } = renderHook(() =>
      useProductSearch({ query: "test", filters }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.totalBeforeFilters).toBe(10);
  });

  it("should handle empty explanation", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        query: "test",
        count: 2,
        products: mockProducts,
        explanation: undefined,
      }),
    });

    const filters: SearchFilters = {
      priceRange: [],
      brands: [],
      categories: [],
    };

    const { result } = renderHook(() =>
      useProductSearch({ query: "test", filters }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.explanation).toBe("");
  });

  // Batching tests
  it("should initially display only 12 products", async () => {
    const filters: SearchFilters = {
      priceRange: [],
      brands: [],
      categories: [],
    };

    const { result } = renderHook(() =>
      useProductSearch({ query: "test", filters }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.products).toHaveLength(25);
    expect(result.current.displayedProducts).toHaveLength(12);
    expect(result.current.hasMore).toBe(true);
  });

  it("should load more products when loadMore is called", async () => {
    jest.useFakeTimers();

    const filters: SearchFilters = {
      priceRange: [],
      brands: [],
      categories: [],
    };

    const { result } = renderHook(() =>
      useProductSearch({ query: "test", filters }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.displayedProducts).toHaveLength(12);

    // Load more
    act(() => {
      result.current.loadMore();
    });

    expect(result.current.loadingMore).toBe(true);

    // Fast-forward timers
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.loadingMore).toBe(false);
    });

    expect(result.current.displayedProducts).toHaveLength(24);
    expect(result.current.hasMore).toBe(true);

    jest.useRealTimers();
  });

  it("should load all remaining products on final loadMore", async () => {
    jest.useFakeTimers();

    const filters: SearchFilters = {
      priceRange: [],
      brands: [],
      categories: [],
    };

    const { result } = renderHook(() =>
      useProductSearch({ query: "test", filters }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Load more twice (12 -> 24 -> 25)
    act(() => {
      result.current.loadMore();
    });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.loadingMore).toBe(false);
    });

    act(() => {
      result.current.loadMore();
    });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.loadingMore).toBe(false);
    });

    expect(result.current.displayedProducts).toHaveLength(25);
    expect(result.current.hasMore).toBe(false);

    jest.useRealTimers();
  });

  it("should reset displayed count when query changes", async () => {
    jest.useFakeTimers();

    const filters: SearchFilters = {
      priceRange: [],
      brands: [],
      categories: [],
    };

    const { rerender, result } = renderHook(
      ({ query, filters }) => useProductSearch({ query, filters }),
      {
        initialProps: { query: "nike", filters },
      },
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Load more
    act(() => {
      result.current.loadMore();
    });
    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(result.current.displayedProducts).toHaveLength(24);
    });

    // Change query - should reset to 12
    rerender({ query: "adidas", filters });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.displayedProducts).toHaveLength(12);

    jest.useRealTimers();
  });

  it("should fetch more products from API when all current products are shown", async () => {
    // Override default mock to return 50 products (so canFetchMore stays true)
    const firstBatchProducts = Array.from({ length: 50 }, (_, i) => ({
      id: `prod-${i + 1}`,
      name: `Product ${i + 1}`,
      price: 100 + i * 10,
      brand: "FirstBrand",
      category: "FirstCategory",
      image: `image${i + 1}.jpg`,
      description: `Description ${i + 1}`,
      color: "Red",
      sizes: [8, 9, 10],
      inStock: true,
      rating: 4.5,
      features: ["Feature"],
      gender: "unisex" as const,
    }));

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        query: "test",
        count: 50,
        totalBeforeFilters: 100,
        products: firstBatchProducts,
        explanation: "First batch",
      }),
    });

    const filters: SearchFilters = {
      priceRange: [],
      brands: [],
      categories: [],
    };

    // Mock products for second request
    const newMockProducts = Array.from({ length: 25 }, (_, i) => ({
      id: `new-${i + 1}`,
      name: `New Product ${i + 1}`,
      price: 200 + i * 10,
      brand: "NewBrand",
      category: "NewCategory",
      image: `new-image${i + 1}.jpg`,
      description: `New Description ${i + 1}`,
      color: "Blue",
      sizes: [8, 9, 10],
      inStock: true,
      rating: 4.0,
      features: ["New Feature"],
      gender: Gender.Unisex,
    }));

    const { result } = renderHook(() =>
      useProductSearch({ query: "test", filters }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Initially 50 products, showing 12
    expect(result.current.products).toHaveLength(50);
    expect(result.current.displayedProducts).toHaveLength(12);

    // Load more 3 times to show 48 products (12 -> 24 -> 36 -> 48)
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        result.current.loadMore();
        await new Promise((resolve) => setTimeout(resolve, 350));
      });
    }

    expect(result.current.displayedProducts).toHaveLength(48);
    expect(global.fetch).toHaveBeenCalledTimes(1); // Still just initial fetch

    // Load more once more to show all 50
    await act(async () => {
      result.current.loadMore();
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    expect(result.current.displayedProducts).toHaveLength(50);
    expect(global.fetch).toHaveBeenCalledTimes(1); // Still just initial fetch

    // Mock second API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        query: "test",
        count: 25,
        totalBeforeFilters: 50,
        products: newMockProducts,
      }),
    });

    // Load more again - now should fetch from API (all 50 shown, canFetchMore is true)
    await act(async () => {
      result.current.loadMore();
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    // Should have been called with excludedIds
    expect(global.fetch).toHaveBeenLastCalledWith("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: expect.stringContaining("excludedIds"),
    });

    // Should now have 75 total products (50 + 25)
    await waitFor(() => {
      expect(result.current.products.length).toBeGreaterThan(50);
    });
  });

  it("should not call loadMore multiple times simultaneously", async () => {
    // Override default mock to return 50 products (so canFetchMore stays true)
    const firstBatchProducts = Array.from({ length: 50 }, (_, i) => ({
      id: `prod-${i + 1}`,
      name: `Product ${i + 1}`,
      price: 100 + i * 10,
      brand: "Brand",
      category: "Category",
      image: `image${i + 1}.jpg`,
      description: `Description ${i + 1}`,
      color: "Red",
      sizes: [8, 9, 10],
      inStock: true,
      rating: 4.5,
      features: ["Feature"],
      gender: Gender.Unisex,
    }));

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        query: "test",
        count: 50,
        totalBeforeFilters: 100,
        products: firstBatchProducts,
        explanation: "First batch",
      }),
    });

    const filters: SearchFilters = {
      priceRange: [],
      brands: [],
      categories: [],
    };

    const { result } = renderHook(() =>
      useProductSearch({ query: "test", filters }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should have 50 products initially, showing 12
    expect(result.current.displayedProducts).toHaveLength(12);

    // Call loadMore multiple times rapidly
    act(() => {
      result.current.loadMore();
      result.current.loadMore();
      result.current.loadMore();
    });

    // Should only trigger once
    expect(result.current.loadingMore).toBe(true);

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    // Should have incremented only once (from 12 to 24)
    expect(result.current.displayedProducts).toHaveLength(24);
  });
});
