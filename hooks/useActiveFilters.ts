import { useMemo } from "react";
import { SearchFilters } from "@/lib/types";

interface UseActiveFiltersParams {
  filters: SearchFilters;
  searchQuery?: string;
}

interface UseActiveFiltersReturn {
  hasFilters: boolean;
  filterCount: number;
  getPriceLabel: (range: string) => string;
  hasBrandConflict: boolean;
  brandInQuery: string | undefined;
}

const ALL_BRANDS = [
  "Nike",
  "Adidas",
  "Brooks",
  "Asics",
  "New Balance",
  "Salomon",
  "Reebok",
  "Converse",
];

const PRICE_LABELS: Record<string, string> = {
  "0-80": "$0 - $80",
  "80-150": "$80 - $150",
  "150+": "$150+",
};

export function useActiveFilters({
  filters,
  searchQuery = "",
}: UseActiveFiltersParams): UseActiveFiltersReturn {
  // Check if there are any active filters
  const hasFilters = useMemo(() => {
    return (
      (filters.priceRange?.length || 0) > 0 ||
      (filters.brands?.length || 0) > 0 ||
      (filters.categories?.length || 0) > 0
    );
  }, [filters]);

  // Count total number of active filters
  const filterCount = useMemo(() => {
    return (
      (filters.priceRange?.length || 0) +
      (filters.brands?.length || 0) +
      (filters.categories?.length || 0)
    );
  }, [filters]);

  // Find brand mentioned in search query
  const brandInQuery = useMemo(() => {
    const queryLower = searchQuery.toLowerCase();
    return ALL_BRANDS.find((brand) => queryLower.includes(brand.toLowerCase()));
  }, [searchQuery]);

  // Check for brand filter conflict with search query
  const hasBrandConflict = useMemo(() => {
    return (
      !!brandInQuery &&
      !!filters.brands &&
      filters.brands.length > 0 &&
      !filters.brands.includes(brandInQuery)
    );
  }, [brandInQuery, filters.brands]);

  // Get human-readable label for price range
  const getPriceLabel = (range: string): string => {
    return PRICE_LABELS[range] || range;
  };

  return {
    hasFilters,
    filterCount,
    getPriceLabel,
    hasBrandConflict,
    brandInQuery,
  };
}
