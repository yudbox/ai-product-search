import { useState, useCallback } from "react";
import { SearchFilters, FilterType } from "@/lib/types";

interface UseSearchFiltersReturn {
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  handleFiltersChange: (newFilters: SearchFilters) => void;
  handleRemoveFilter: (type: FilterType, value: string) => void;
  handleClearAllFilters: () => void;
}

const INITIAL_FILTERS: SearchFilters = {
  priceRange: [],
  brands: [],
  categories: [],
};

export function useSearchFilters(): UseSearchFiltersReturn {
  const [filters, setFilters] = useState<SearchFilters>(INITIAL_FILTERS);

  // Update filters with new values
  const handleFiltersChange = useCallback((newFilters: SearchFilters) => {
    setFilters(newFilters);
  }, []);

  // Remove individual filter by type and value
  const handleRemoveFilter = useCallback(
    (type: FilterType, value: string) => {
      const newFilters = { ...filters };

      switch (type) {
        case FilterType.PriceRange:
          newFilters.priceRange = filters.priceRange?.filter(
            (r) => r !== value,
          );
          break;
        case FilterType.Brand:
          newFilters.brands = filters.brands?.filter((b) => b !== value);
          break;
        case FilterType.Category:
          newFilters.categories = filters.categories?.filter(
            (c) => c !== value,
          );
          break;
      }

      setFilters(newFilters);
    },
    [filters],
  );

  // Clear all filters and reset to initial state
  const handleClearAllFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  return {
    filters,
    setFilters,
    handleFiltersChange,
    handleRemoveFilter,
    handleClearAllFilters,
  };
}
