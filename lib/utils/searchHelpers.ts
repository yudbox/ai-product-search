/**
 * Search Route Helper Functions
 * Extracted from route.ts for better maintainability
 */

import type { SearchRequest, Product, ParsedQuery } from "@/lib/types";

/**
 * Generate cache key including UI filters for proper cache isolation
 * Different filter combinations should have different cache keys
 */
export function generateCacheKey(
  normalizedQuery: string,
  filters?: SearchRequest["filters"],
): string {
  if (!filters || Object.keys(filters).length === 0) {
    return normalizedQuery;
  }

  // Sort and stringify filters for consistent cache keys
  const filterParts: string[] = [];

  if (filters.priceRange && filters.priceRange.length > 0) {
    filterParts.push(`pr:${filters.priceRange.sort().join(",")}`);
  }

  if (filters.brands && filters.brands.length > 0) {
    filterParts.push(`br:${filters.brands.sort().join(",")}`);
  }

  if (filters.categories && filters.categories.length > 0) {
    filterParts.push(`cat:${filters.categories.sort().join(",")}`);
  }

  return filterParts.length > 0
    ? `${normalizedQuery}|${filterParts.join("|")}`
    : normalizedQuery;
}

/**
 * Generate rejection message for non-relevant queries (TIER 1)
 */
export function generateRejectionMessage(
  reason: string | undefined,
  suggestion: string | undefined,
  originalQuery: string,
): string {
  const messages: Record<string, string> = {
    not_footwear: `We only sell footwear (shoes, sneakers, boots, sandals). "${originalQuery}" is not a shoe product.`,
    question_not_search: `Please search for products instead of asking questions. Try searching for specific shoes like "red running shoes" or "winter boots".`,
    nonsense: `We couldn't understand your search: "${originalQuery}". Please try a clear product name like "Nike sneakers" or "leather boots".`,
  };

  let message =
    messages[reason as keyof typeof messages] ||
    `No products found for "${originalQuery}".`;

  if (suggestion) {
    message += ` Try searching for: "${suggestion}"`;
  }

  return message;
}

/**
 * Generate AI explanation for empty results
 */
function generateEmptyExplanation(
  originalQuery: string,
  parsedQuery: ParsedQuery,
): string {
  let message = `No products found for "${originalQuery}".`;

  // Explain applied filters
  const filterParts: string[] = [];
  const suggestions: string[] = [];

  if (parsedQuery.gender) {
    filterParts.push(`gender: ${parsedQuery.gender}`);
  }
  if (parsedQuery.maxPrice) {
    filterParts.push(`max price: $${parsedQuery.maxPrice}`);
  }
  if (parsedQuery.minPrice) {
    filterParts.push(`min price: $${parsedQuery.minPrice}`);
  }
  if (parsedQuery.color) {
    filterParts.push(`color: ${parsedQuery.color}`);
    suggestions.push("try without color filter");
  }
  if (parsedQuery.brand) {
    filterParts.push(`brand: ${parsedQuery.brand}`);
    suggestions.push("try different brands");
  }

  if (filterParts.length > 0) {
    message += ` Applied filters: ${filterParts.join(", ")}.`;
  }

  if (suggestions.length > 0) {
    message += ` Try: ${suggestions.join(" or ")}.`;
  } else {
    message += " Try adjusting your search or removing filters.";
  }

  if (parsedQuery.suggestedQuery) {
    message += ` Or search: "${parsedQuery.suggestedQuery}"`;
  }

  return message;
}

/**
 * Generate AI explanation for successful results
 */
function generateSuccessExplanation(
  originalQuery: string,
  products: Product[],
  parsedQuery: ParsedQuery,
): string {
  const topProducts = products.slice(0, 3).map((p) => p.name);
  const brands = [...new Set(products.map((p) => p.brand))];
  const avgPrice = Math.round(
    products.reduce((sum, p) => sum + p.price, 0) / products.length,
  );

  let explanation = `Found ${products.length} products matching "${originalQuery}".`;

  if (parsedQuery.semanticQuery !== originalQuery) {
    explanation += ` Searching for: ${parsedQuery.semanticQuery}.`;
  }

  // Explain filters
  const filterParts: string[] = [];
  if (parsedQuery.gender) {
    filterParts.push(`${parsedQuery.gender}'s shoes`);
  }
  if (parsedQuery.maxPrice) {
    filterParts.push(`under $${parsedQuery.maxPrice}`);
  }
  if (parsedQuery.color) {
    filterParts.push(`${parsedQuery.color} color`);
  }

  if (filterParts.length > 0) {
    explanation += ` Filters: ${filterParts.join(", ")}.`;
  }

  explanation += ` Top results: ${topProducts.join(", ")}. Brands: ${brands.slice(0, 5).join(", ")}. Avg price: $${avgPrice}.`;

  if (parsedQuery.specialTerms && parsedQuery.specialTerms.length > 0) {
    explanation += ` [Understood: ${parsedQuery.specialTerms.join(", ")}]`;
  }

  return explanation;
}

/**
 * Generate AI explanation of search results
 */
export function generateExplanation(
  originalQuery: string,
  products: Product[],
  parsedQuery: ParsedQuery,
): string {
  if (products.length === 0) {
    return generateEmptyExplanation(originalQuery, parsedQuery);
  }

  return generateSuccessExplanation(originalQuery, products, parsedQuery);
}
