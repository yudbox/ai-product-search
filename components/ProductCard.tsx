"use client";

import { Product } from "@/lib/types";
import Image from "next/image";
import { Rating } from "@/components/ui";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-lg">
      {/* Product Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded bg-red-600 px-3 py-1 text-sm font-semibold text-white">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="mb-1 line-clamp-2 font-semibold text-gray-900">
          {product.name}
        </h3>
        <p className="mb-2 text-sm text-gray-600">{product.brand}</p>

        <Rating rating={product.rating} showNumeric className="mb-3" />

        {/* Features */}
        {product.features && product.features.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {product.features.slice(0, 3).map((feature, idx) => (
              <span
                key={idx}
                className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700"
              >
                {feature}
              </span>
            ))}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-gray-900">
            ${product.price}
          </span>
          <span className="text-sm text-gray-500">{product.gender}</span>
        </div>

        {/* Category */}
        <p className="mt-2 text-xs text-gray-500">{product.category}</p>
      </div>
    </div>
  );
}
