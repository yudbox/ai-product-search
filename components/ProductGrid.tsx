"use client";

import { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "./ProductCardSkeleton";

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
}

export function ProductGrid({ products, loading = false }: ProductGridProps) {
  if (loading) {
    return (
      <div
        data-testid="product-grid"
        data-loading="true"
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {[...Array(12)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div
        data-testid="product-grid"
        data-loading="false"
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div className="mb-4 text-6xl">😕</div>
        <h3 className="mb-2 text-xl font-semibold text-gray-900">
          No products found
        </h3>
        <p className="mb-4 text-gray-600">
          Try adjusting your search or filters
        </p>
        <ul className="text-sm text-gray-500">
          <li>• Use different keywords</li>
          <li>• Remove some filters</li>
          <li>• Try broader search terms</li>
        </ul>
      </div>
    );
  }

  return (
    <div
      data-testid="product-grid"
      data-loading="false"
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
