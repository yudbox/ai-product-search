"use client";

import { SearchBar } from "@/components/SearchBar";
import { ProductGrid } from "@/components/ProductGrid";
import { FilterSidebar } from "@/components/FilterSidebar";
import { ActiveFilters } from "@/components/ActiveFilters";
import { Button } from "@/components/ui/Button";
import { useSearchParams, useRouter } from "next/navigation";
import { useSearchFilters } from "@/hooks/useSearchFilters";
import { useProductSearch } from "@/hooks/useProductSearch";
import { useEffect, useRef } from "react";

export function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    filters,
    handleFiltersChange,
    handleRemoveFilter,
    handleClearAllFilters,
  } = useSearchFilters();

  const {
    displayedProducts,
    products,
    loading,
    loadingMore,
    error,
    explanation,
    totalBeforeFilters,
    hasMore,
    loadMore,
  } = useProductSearch({ query, filters });

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || loading || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [loading, loadingMore, hasMore, loadMore]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center justify-between">
            <Button
              onClick={() => router.push("/")}
              variant="ghost"
              size="md"
              className="flex items-center gap-2"
            >
              <span className="text-lg">←</span>
              Home
            </Button>
            <span className="text-2xl font-bold text-gray-900">
              🔍 AI Product Search
            </span>
          </div>
          <SearchBar initialQuery={query} />
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto maxw-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          {/* Sidebar - Filters */}
          <aside className="hidden w-64 flex-shrink-0 lg:block">
            <div className="sticky top-8">
              <FilterSidebar
                filters={filters}
                onFilterChange={handleFiltersChange}
              />
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1">
            {/* Results Header */}
            {query && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Search Results for "{query}"
                </h2>
              </div>
            )}

            {/* Active Filters */}
            {query && (
              <ActiveFilters
                filters={filters}
                onRemoveFilter={handleRemoveFilter}
                onClearAll={handleClearAllFilters}
                resultCount={products.length}
                totalCount={totalBeforeFilters}
                searchQuery={query}
              />
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* Products Grid */}
            <ProductGrid products={displayedProducts} loading={loading} />

            {/* Load More Indicator */}
            {!loading && hasMore && (
              <div ref={loadMoreRef} className="py-8 text-center">
                {loadingMore ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                    <span className="text-gray-600">
                      Loading more products...
                    </span>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">Scroll for more</div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!loading && !query && (
              <div className="py-12 text-center">
                <p className="text-gray-600">
                  Enter a search query to find products
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
