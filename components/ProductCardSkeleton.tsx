/**
 * Skeleton loader for ProductCard
 * Maintains exact same dimensions to prevent layout shift (CLS)
 */
export function ProductCardSkeleton() {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Image skeleton - maintains aspect-square */}
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        <div className="absolute inset-0 animate-shimmer" />
      </div>

      {/* Product Info skeleton - matches ProductCard padding */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="space-y-2">
          <div className="h-5 animate-shimmer rounded w-4/5" />
          <div className="h-5 animate-shimmer rounded w-3/5" />
        </div>

        {/* Brand */}
        <div className="h-4 animate-shimmer rounded w-1/3" />

        {/* Rating */}
        <div className="flex items-center gap-1">
          <div className="h-4 w-24 animate-shimmer rounded" />
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-1">
          <div className="h-6 w-20 animate-shimmer rounded-full" />
          <div className="h-6 w-24 animate-shimmer rounded-full" />
          <div className="h-6 w-16 animate-shimmer rounded-full" />
        </div>

        {/* Price and Gender */}
        <div className="flex items-center justify-between">
          <div className="h-8 w-16 animate-shimmer rounded" />
          <div className="h-4 w-12 animate-shimmer rounded" />
        </div>

        {/* Category */}
        <div className="h-3 w-24 animate-shimmer rounded" />
      </div>
    </div>
  );
}
