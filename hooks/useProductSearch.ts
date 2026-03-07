import { useEffect, useState, useCallback, useRef } from "react";
import { Product, SearchFilters, SearchResponse } from "@/lib/types";

interface UseProductSearchParams {
  query: string;
  filters: SearchFilters;
}

interface UseProductSearchReturn {
  products: Product[];
  displayedProducts: Product[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  explanation: string;
  suggestedQuery?: string;
  rejectionReason?: string;
  totalBeforeFilters: number;
  hasMore: boolean;
  loadMore: () => void;
}

const BATCH_SIZE = 12;

// Apply client-side filters (brands, categories)
function applyClientFilters(
  products: Product[],
  filters: SearchFilters,
): Product[] {
  let filtered = products;

  // Filter by brands
  if (filters.brands && filters.brands.length > 0) {
    filtered = filtered.filter((p) => filters.brands!.includes(p.brand));
  }

  // Filter by categories
  if (filters.categories && filters.categories.length > 0) {
    filtered = filtered.filter((p) => filters.categories!.includes(p.category));
  }

  return filtered;
}

export function useProductSearch({
  query,
  filters,
}: UseProductSearchParams): UseProductSearchReturn {
  const [allProducts, setAllProducts] = useState<Product[]>([]); // Store ALL unfiltered products
  const [displayedCount, setDisplayedCount] = useState(BATCH_SIZE);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string | undefined>();
  const [suggestedQuery, setSuggestedQuery] = useState<string | undefined>();
  const [totalBeforeFilters, setTotalBeforeFilters] = useState<number>(0);
  const [canFetchMore, setCanFetchMore] = useState(false); // Track if can fetch from API

  // Use ref for synchronous guard against multiple loadMore calls
  const loadingMoreRef = useRef(false);

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(BATCH_SIZE);
  }, [filters]);

  // Create stable dependency for priceRange array
  const priceRangeKey = filters.priceRange?.join(",") || "";

  useEffect(() => {
    if (!query) {
      setAllProducts([]);
      setDisplayedCount(BATCH_SIZE);
      setCanFetchMore(false);
      setRejectionReason(undefined);
      setSuggestedQuery(undefined);
      setExplanation("");
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      setDisplayedCount(BATCH_SIZE); // Reset to first batch
      setCanFetchMore(true); // Reset fetch capability

      try {
        // Only send priceRange to API (brands/categories filtered on client)
        const serverFilters = {
          priceRange: filters.priceRange,
        };

        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, filters: serverFilters }),
        });

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data: SearchResponse = await response.json();
        setAllProducts(data.products);
        setExplanation(data.explanation || "");
        setRejectionReason(data.rejectionReason);
        setSuggestedQuery(data.suggestedQuery);
        setTotalBeforeFilters(data.totalBeforeFilters || data.count);

        // If we got less than topK, can't fetch more
        if (data.products.length < 50) {
          setCanFetchMore(false);
        }
      } catch (err) {
        console.error("Search error:", err);
        setError("Failed to load results. Please try again.");
        setAllProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, priceRangeKey]); // Only depend on query and priceRange stringified

  const loadMore = useCallback(async () => {
    // Prevent multiple simultaneous loads (use ref for synchronous check)
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;

    // Apply filters to check filtered product count
    const filteredProducts = applyClientFilters(allProducts, filters);

    // Case 1: Still have filtered products to show, just increase displayed count
    if (displayedCount < filteredProducts.length) {
      setLoadingMore(true);
      // Simulate network delay for smooth UX
      setTimeout(() => {
        setDisplayedCount((prev) =>
          Math.min(prev + BATCH_SIZE, filteredProducts.length),
        );
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }, 300);
      return;
    }

    // Case 2: All filtered products shown, need to fetch more from API
    if (displayedCount >= filteredProducts.length && canFetchMore) {
      setLoadingMore(true);
      setError(null);

      try {
        // Get all current product IDs to exclude (from unfiltered list)
        const excludedIds = allProducts.map((p) => p.id);

        // Only send priceRange to API (brands/categories filtered on client)
        const serverFilters = {
          priceRange: filters.priceRange,
        };

        const response = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, filters: serverFilters, excludedIds }),
        });

        if (!response.ok) {
          throw new Error("Failed to load more products");
        }

        const data: SearchResponse = await response.json();

        if (data.products.length === 0) {
          // No more products available
          setCanFetchMore(false);
        } else {
          // Filter out any duplicates just in case
          const existingIds = new Set(excludedIds);
          const newProducts = data.products.filter(
            (p) => !existingIds.has(p.id),
          );

          if (newProducts.length > 0) {
            // Append new products to existing (unfiltered list)
            setAllProducts((prev) => [...prev, ...newProducts]);
            setDisplayedCount((prev) => prev + BATCH_SIZE);
          }

          // If we got less than topK, can't fetch more
          if (data.products.length < 50) {
            setCanFetchMore(false);
          }
        }
      } catch (err) {
        console.error("Load more error:", err);
        setError("Failed to load more products");
        setCanFetchMore(false);
      } finally {
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }
    } else {
      // Neither case applies, reset the ref
      loadingMoreRef.current = false;
    }
  }, [displayedCount, allProducts, canFetchMore, query, filters]);

  // Apply client-side filters (brands, categories)
  const filteredProducts = applyClientFilters(allProducts, filters);

  // Slice to display only the current batch
  const displayedProducts = filteredProducts.slice(0, displayedCount);

  // Has more if: still have filtered products to show OR can fetch more from API
  const hasMore = displayedCount < filteredProducts.length || canFetchMore;

  return {
    products: filteredProducts, // Return filtered products
    displayedProducts,
    loading,
    loadingMore,
    error,
    explanation,
    rejectionReason,
    suggestedQuery,
    totalBeforeFilters,
    hasMore,
    loadMore,
  };
}
