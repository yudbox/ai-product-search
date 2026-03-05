"use client";

import { SearchFilters, FilterType } from "@/lib/types";
import { useActiveFilters } from "@/hooks/useActiveFilters";

interface ActiveFiltersProps {
  filters: SearchFilters;
  onRemoveFilter: (type: FilterType, value: string) => void;
  onClearAll: () => void;
  resultCount: number;
  totalCount?: number;
  searchQuery?: string;
}

export function ActiveFilters({
  filters,
  onRemoveFilter,
  onClearAll,
  resultCount,
  totalCount,
  searchQuery = "",
}: ActiveFiltersProps) {
  const {
    hasFilters,
    filterCount,
    getPriceLabel,
    hasBrandConflict,
    brandInQuery,
  } = useActiveFilters({ filters, searchQuery });

  if (!hasFilters) {
    return null;
  }

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
      {/* Brand Conflict Warning */}
      {hasBrandConflict && (
        <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
          <div className="flex items-start gap-2">
            <span className="text-amber-600 text-lg">💡</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">
                You searched for "
                <span className="font-bold">{brandInQuery}</span>" but filtered
                by{" "}
                <span className="font-bold">{filters.brands?.join(", ")}</span>
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Brand filters override your search query. Remove brand filters
                to see {brandInQuery} products.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          Active Filters ({filterCount})
        </h3>
        <button
          data-testid="clear-all"
          onClick={onClearAll}
          className="text-sm font-medium text-red-600 hover:text-red-700"
        >
          Clear all filters
        </button>
      </div>

      {/* Filter Tags */}
      <div className="flex flex-wrap gap-2">
        {/* Price Range Tags */}
        {filters.priceRange?.map((range) => (
          <button
            key={range}
            onClick={() => onRemoveFilter(FilterType.PriceRange, range)}
            className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 transition-colors hover:bg-blue-200"
          >
            <span>{getPriceLabel(range)}</span>
            <span className="font-bold">✕</span>
          </button>
        ))}

        {/* Brand Tags */}
        {filters.brands?.map((brand) => (
          <button
            key={brand}
            data-testid={`remove-brand-${brand}`}
            onClick={() => onRemoveFilter(FilterType.Brand, brand)}
            className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800 transition-colors hover:bg-purple-200"
          >
            <span>{brand}</span>
            <span className="font-bold">✕</span>
          </button>
        ))}

        {/* Category Tags */}
        {filters.categories?.map((category) => (
          <button
            key={category}
            onClick={() => onRemoveFilter(FilterType.Category, category)}
            className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800 transition-colors hover:bg-green-200"
          >
            <span>{category}</span>
            <span className="font-bold">✕</span>
          </button>
        ))}
      </div>

      {/* Results Counter */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          <span data-testid="result-count" className="font-semibold">
            {resultCount}
          </span>{" "}
          {resultCount === 1 ? "product" : "products"} found
        </p>
      </div>

      {/* Warning if few results */}
      {resultCount < 3 && resultCount > 0 && (
        <div className="mt-3 rounded-lg bg-yellow-50 p-3 border border-yellow-200">
          <div className="flex items-start gap-2">
            <span className="text-yellow-600">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800">
                Only {resultCount} {resultCount === 1 ? "product" : "products"}{" "}
                match your filters
              </p>
              <button
                onClick={onClearAll}
                className="mt-1 text-sm font-medium text-yellow-700 hover:text-yellow-900 underline"
              >
                Remove filters to see more results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No results warning */}
      {resultCount === 0 && (
        <div className="mt-3 rounded-lg bg-red-50 p-3 border border-red-200">
          <div className="flex items-start gap-2">
            <span className="text-red-600">❌</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">
                No products match your current filters
              </p>
              <button
                onClick={onClearAll}
                className="mt-1 text-sm font-medium text-red-700 hover:text-red-900 underline"
              >
                Clear filters to see results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
