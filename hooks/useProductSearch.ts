import { useEffect, useState, useCallback, useRef } from "react";
import { Product, SearchFilters, SearchResponse } from "@/lib/types";
import { SEARCH_CONFIG, INFINITE_SCROLL_CONFIG } from "@/lib/constants/search";

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

function applyClientFilters(
  products: Product[],
  filters: SearchFilters,
): Product[] {
  let filtered = products;

  if (filters.brands && filters.brands.length > 0) {
    filtered = filtered.filter((p) => filters.brands!.includes(p.brand));
  }

  if (filters.categories && filters.categories.length > 0) {
    filtered = filtered.filter((p) => filters.categories!.includes(p.category));
  }

  return filtered;
}

export function useProductSearch({
  query,
  filters,
}: UseProductSearchParams): UseProductSearchReturn {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [displayedCount, setDisplayedCount] = useState<number>(
    SEARCH_CONFIG.BATCH_SIZE,
  );
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string | undefined>();
  const [suggestedQuery, setSuggestedQuery] = useState<string | undefined>();
  const [totalBeforeFilters, setTotalBeforeFilters] = useState<number>(0);
  const [canFetchMore, setCanFetchMore] = useState(false);

  const loadingMoreRef = useRef(false);

  // Reset displayed count when filters change
  useEffect(() => {
    setDisplayedCount(SEARCH_CONFIG.BATCH_SIZE);
  }, [filters]);

  const priceRangeKey = filters.priceRange?.join(",") || "";

  useEffect(() => {
    if (!query) {
      setAllProducts([]);
      setDisplayedCount(SEARCH_CONFIG.BATCH_SIZE);
      setCanFetchMore(false);
      setRejectionReason(undefined);
      setSuggestedQuery(undefined);
      setExplanation("");
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      setDisplayedCount(SEARCH_CONFIG.BATCH_SIZE);
      setCanFetchMore(true);

      try {
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

        setCanFetchMore(data.hasMoreResults ?? true);
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
  }, [query, priceRangeKey]);

  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;

    const filteredProducts = applyClientFilters(allProducts, filters);

    if (displayedCount < filteredProducts.length) {
      setLoadingMore(true);
      setTimeout(() => {
        setDisplayedCount((prev) =>
          Math.min(prev + SEARCH_CONFIG.BATCH_SIZE, filteredProducts.length),
        );
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }, INFINITE_SCROLL_CONFIG.SIMULATED_DELAY_MS);
      return;
    }

    if (displayedCount >= filteredProducts.length && canFetchMore) {
      setLoadingMore(true);
      setError(null);

      try {
        const excludedIds = allProducts.map((p) => p.id);

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
          setCanFetchMore(false);
        } else {
          const existingIds = new Set(excludedIds);
          const newProducts = data.products.filter(
            (p) => !existingIds.has(p.id),
          );

          if (newProducts.length > 0) {
            setAllProducts((prev) => [...prev, ...newProducts]);
            setDisplayedCount((prev) => prev + SEARCH_CONFIG.BATCH_SIZE);
          } else {
            setCanFetchMore(false);
          }

          if (!data.hasMoreResults) {
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
      loadingMoreRef.current = false;
    }
  }, [displayedCount, allProducts, canFetchMore, query, filters]);

  const filteredProducts = applyClientFilters(allProducts, filters);

  const displayedProducts = filteredProducts.slice(0, displayedCount);

  const hasMore = displayedCount < filteredProducts.length || canFetchMore;

  return {
    products: filteredProducts,
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
