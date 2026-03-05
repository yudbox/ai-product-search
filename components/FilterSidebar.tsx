"use client";

import { SearchFilters } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";

interface FilterSidebarProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
}

export function FilterSidebar({ filters, onFilterChange }: FilterSidebarProps) {
  const priceRanges = [
    { label: "$0 - $80", value: "0-80" },
    { label: "$80 - $150", value: "80-150" },
    { label: "$150+", value: "150+" },
  ];

  const brands = [
    "Nike",
    "Adidas",
    "Brooks",
    "Asics",
    "New Balance",
    "Salomon",
  ];

  const categories = [
    "Running Shoes",
    "Training Shoes",
    "Casual Sneakers",
    "Basketball Shoes",
    "Hiking Boots",
  ];

  const togglePriceRange = (value: string) => {
    const currentRanges = filters.priceRange || [];
    const newRanges = currentRanges.includes(value)
      ? currentRanges.filter((r) => r !== value)
      : [...currentRanges, value];
    onFilterChange({ ...filters, priceRange: newRanges });
  };

  const toggleBrand = (brand: string) => {
    const currentBrands = filters.brands || [];
    const newBrands = currentBrands.includes(brand)
      ? currentBrands.filter((b) => b !== brand)
      : [...currentBrands, brand];
    onFilterChange({ ...filters, brands: newBrands });
  };

  const toggleCategory = (category: string) => {
    const currentCategories = filters.categories || [];
    const newCategories = currentCategories.includes(category)
      ? currentCategories.filter((c) => c !== category)
      : [...currentCategories, category];
    onFilterChange({ ...filters, categories: newCategories });
  };

  const clearAllFilters = () => {
    onFilterChange({ priceRange: [], brands: [], categories: [] });
  };

  const hasActiveFilters =
    (filters.priceRange?.length || 0) > 0 ||
    (filters.brands?.length || 0) > 0 ||
    (filters.categories?.length || 0) > 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        {hasActiveFilters && (
          <Button
            onClick={clearAllFilters}
            variant="ghost"
            size="sm"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h3 className="mb-3 font-medium text-gray-900">Price</h3>
        <div className="space-y-2">
          {priceRanges.map((range) => (
            <Checkbox
              key={range.value}
              label={range.label}
              checked={filters.priceRange?.includes(range.value) || false}
              onChange={() => togglePriceRange(range.value)}
            />
          ))}
        </div>
      </div>

      {/* Brands */}
      <div className="mb-6">
        <h3 className="mb-3 font-medium text-gray-900">Brand</h3>
        <div className="space-y-2">
          {brands.map((brand, index) => (
            <Checkbox
              key={brand}
              label={brand}
              checked={filters.brands?.includes(brand) || false}
              onChange={() => toggleBrand(brand)}
              data-testid={index === 0 ? "apply-filter" : undefined}
            />
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="mb-3 font-medium text-gray-900">Category</h3>
        <div className="space-y-2">
          {categories.map((category) => (
            <Checkbox
              key={category}
              label={category}
              checked={filters.categories?.includes(category) || false}
              onChange={() => toggleCategory(category)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
