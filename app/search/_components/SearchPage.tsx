"use client";

import { SearchBar } from "@/components/SearchBar";
import { ProductGrid } from "@/components/ProductGrid";
import { FilterSidebar } from "@/components/FilterSidebar";
import { ActiveFilters } from "@/components/ActiveFilters";
import { Button } from "@/components/ui/Button";
import { useSearchParams, useRouter } from "next/navigation";
import { useSearchFilters } from "@/hooks/useSearchFilters";
import { useProductSearch } from "@/hooks/useProductSearch";
import { useEffect, useRef, useState } from "react";

export function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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
    suggestedQuery,
    rejectionReason,
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
        <div className="mx-auto max-w-screen-2xl px-4 py-4 sm:px-6 lg:px-8">
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
      <main className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar - Filters */}
          <aside className="hidden w-64 flex-shrink-0 lg:block">
            <div className="sticky top-8">
              <FilterSidebar
                filters={filters}
                onFilterChange={handleFiltersChange}
              />
            </div>
          </aside>

          {/* Mobile Filters Modal */}
          <div
            className={`fixed inset-0 z-40 lg:hidden ${
              showMobileFilters ? "pointer-events-auto" : "pointer-events-none"
            }`}
          >
            {/* Overlay */}
            <div
              className={`absolute inset-0 bg-black transition-opacity duration-300 ${
                showMobileFilters ? "opacity-50" : "opacity-0"
              }`}
              onClick={() => setShowMobileFilters(false)}
            />
            {/* Filters Panel */}
            <aside
              className={`absolute inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col overflow-hidden bg-white shadow-xl transition-transform duration-300 ease-in-out ${
                showMobileFilters ? "translate-x-0" : "translate-x-full"
              }`}
              data-testid="mobile-filters-modal"
            >
              <div className="flex items-center justify-between border-b border-gray-200 p-4">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <FilterSidebar
                  filters={filters}
                  onFilterChange={handleFiltersChange}
                />
              </div>
              {/* Apply Button */}
              <div className="border-t border-gray-200 p-4">
                <Button
                  onClick={() => setShowMobileFilters(false)}
                  variant="primary"
                  size="lg"
                  className="w-full"
                >
                  Apply Filters
                </Button>
              </div>
            </aside>
          </div>

          {/* Results */}
          <div className="flex-1">
            {/* Mobile Filter Button */}
            {query && (
              <div className="mb-4 flex items-center justify-between lg:hidden">
                <h2 className="text-xl font-bold text-gray-900">Results</h2>
                <Button
                  onClick={() => setShowMobileFilters(true)}
                  variant="secondary"
                  size="md"
                  className="flex items-center gap-2"
                  data-testid="mobile-filters-button"
                >
                  <span>🔧</span>
                  Filters
                  {(filters.priceRange?.length || 0) +
                    (filters.brands?.length || 0) +
                    (filters.categories?.length || 0) >
                    0 && (
                    <span className="ml-1 rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                      {(filters.priceRange?.length || 0) +
                        (filters.brands?.length || 0) +
                        (filters.categories?.length || 0)}
                    </span>
                  )}
                </Button>
              </div>
            )}

            {/* Desktop Results Header */}
            {query && (
              <div className="mb-6 hidden lg:block">
                <h2 className="text-2xl font-bold text-gray-900">
                  {`Search Results for '${query}'`}
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

            {/* AI Explanation Banner */}
            {query && explanation && products.length === 0 && !loading && (
              <div
                className={`mb-4 rounded-lg border p-4 ${
                  rejectionReason
                    ? "border-yellow-200 bg-yellow-50"
                    : "border-blue-200 bg-blue-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">
                    {rejectionReason === "not_footwear"
                      ? "🚫"
                      : rejectionReason === "question_not_search"
                        ? "❓"
                        : "👟"}
                  </span>
                  <div className="flex-1">
                    <p
                      className={`text-sm ${
                        rejectionReason ? "text-yellow-900" : "text-blue-900"
                      }`}
                    >
                      {explanation}
                    </p>
                    {suggestedQuery && (
                      <button
                        onClick={() =>
                          router.push(
                            `/search?q=${encodeURIComponent(suggestedQuery)}`,
                          )
                        }
                        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
                      >
                        <span>Try: {`'${suggestedQuery}'`}</span>
                        <span>→</span>
                      </button>
                    )}
                  </div>
                </div>
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
