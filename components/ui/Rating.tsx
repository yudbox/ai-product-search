import React from "react";

export interface RatingProps {
  /**
   * Rating value (0-5)
   */
  rating: number;
  /**
   * Maximum number of stars (default: 5)
   */
  maxStars?: number;
  /**
   * Show numeric rating next to stars (default: false)
   */
  showNumeric?: boolean;
  /**
   * Size of stars - affects text size
   */
  size?: "sm" | "md" | "lg";
  /**
   * Custom className for the container
   */
  className?: string;
}

/**
 * Rating component that displays star ratings
 * Supports full, half, and empty stars
 */
export function Rating({
  rating,
  maxStars = 5,
  showNumeric = false,
  size = "md",
  className = "",
}: RatingProps) {
  // Clamp rating between 0 and maxStars
  const clampedRating = Math.max(0, Math.min(rating, maxStars));

  const fullStars = Math.floor(clampedRating);
  const hasHalfStar = clampedRating % 1 >= 0.5;
  const stars = [];

  // Size classes mapping
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  // Generate full stars
  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <span key={`full-${i}`} className="text-yellow-400" aria-hidden="true">
        ★
      </span>,
    );
  }

  // Add half star if needed
  if (hasHalfStar && fullStars < maxStars) {
    stars.push(
      <span key="half" className="text-yellow-400" aria-hidden="true">
        ★
      </span>,
    );
  }

  // Fill remaining with empty stars
  const remaining = maxStars - stars.length;
  for (let i = 0; i < remaining; i++) {
    stars.push(
      <span key={`empty-${i}`} className="text-gray-300" aria-hidden="true">
        ★
      </span>,
    );
  }

  return (
    <div
      className={`flex items-center gap-1 ${sizeClasses[size]} ${className}`}
      role="img"
      aria-label={`Rating: ${rating} out of ${maxStars} stars`}
    >
      {stars}
      {showNumeric && <span className="ml-1 text-gray-600">({rating})</span>}
    </div>
  );
}
