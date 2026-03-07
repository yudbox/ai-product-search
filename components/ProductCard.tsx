"use client";

import { Product } from "@/lib/types";
import Image from "next/image";
import { Rating } from "@/components/ui";

interface ProductCardProps {
  product: Product;
}

// Color mapping for visual badges
const colorMap: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  red: { bg: "bg-red-100", text: "text-red-800", dot: "#ef4444" },
  blue: { bg: "bg-blue-100", text: "text-blue-800", dot: "#3b82f6" },
  green: { bg: "bg-green-100", text: "text-green-800", dot: "#22c55e" },
  yellow: { bg: "bg-yellow-100", text: "text-yellow-800", dot: "#eab308" },
  orange: { bg: "bg-orange-100", text: "text-orange-800", dot: "#f97316" },
  purple: { bg: "bg-purple-100", text: "text-purple-800", dot: "#a855f7" },
  pink: { bg: "bg-pink-100", text: "text-pink-800", dot: "#ec4899" },
  brown: { bg: "bg-amber-100", text: "text-amber-800", dot: "#92400e" },
  black: { bg: "bg-gray-100", text: "text-gray-800", dot: "#000000" },
  white: { bg: "bg-gray-50", text: "text-gray-600", dot: "#ffffff" },
  grey: { bg: "bg-gray-100", text: "text-gray-800", dot: "#6b7280" },
  gray: { bg: "bg-gray-100", text: "text-gray-800", dot: "#6b7280" },
  beige: { bg: "bg-stone-100", text: "text-stone-800", dot: "#d6ccc2" },
  navy: { bg: "bg-indigo-100", text: "text-indigo-800", dot: "#1e3a8a" },
  gold: { bg: "bg-yellow-100", text: "text-yellow-900", dot: "#ffd700" },
  silver: { bg: "bg-gray-100", text: "text-gray-700", dot: "#c0c0c0" },
};

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

        {/* Color and Gender Badges */}
        <div className="mb-3 flex flex-wrap gap-2">
          {product.color && colorMap[product.color.toLowerCase()] && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                colorMap[product.color.toLowerCase()].bg
              } ${colorMap[product.color.toLowerCase()].text}`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full border border-gray-300"
                style={{
                  backgroundColor:
                    colorMap[product.color.toLowerCase()].dot,
                }}
              />
              {product.color}
            </span>
          )}
          {product.gender && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                product.gender === "men"
                  ? "bg-blue-100 text-blue-800"
                  : product.gender === "women"
                    ? "bg-pink-100 text-pink-800"
                    : "bg-purple-100 text-purple-800"
              }`}
            >
              {product.gender === "men"
                ? "♂ Men"
                : product.gender === "women"
                  ? "♀ Women"
                  : "⚥ Unisex"}
            </span>
          )}
        </div>

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
        </div>

        {/* Category */}
        <p className="mt-2 text-xs text-gray-500">{product.category}</p>
      </div>
    </div>
  );
}
