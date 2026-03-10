/**
 * L1 Cache Normalization Helpers
 * Production-ready text normalization for query caching
 * Multiple normalization strategies to maximize cache hit rate
 */

import { SYNONYM_MAP } from "../mappings/synonyms";
import { BRAND_MAP } from "../mappings/brands";
import { COLOR_MAP } from "../mappings/colors";

// Regular expression constants
const EXTRA_WHITESPACE_REGEX = /\s+/g;
const NON_ALPHANUMERIC_REGEX = /[^\p{L}\p{N}\s]/gu;
const REGEX_SPECIAL_CHARS = /[.*+?^${}()|[\]\\]/g;

/**
 * Creates a word boundary regex for matching variants
 * (?<=^|\s) = start of string or whitespace before
 * (?=\s|$) = whitespace or end of string after
 */
function createWordBoundaryRegex(escapedWord: string): RegExp {
  return new RegExp(`(?<=^|\\s)${escapedWord}(?=\\s|$)`, "giu");
}

/**
 * L1 Normalization Step 1: Basic text cleanup
 * Removes noise and standardizes formatting
 * Unicode-safe for multi-language support (English, Russian, Chinese, etc.)
 */
export function normalizeBasic(query: string): string {
  return (
    query
      .toLowerCase()
      .trim()
      // Replace dashes with spaces (nike-running → nike running)
      .replace(/-/g, " ")
      // Remove extra whitespace
      .replace(EXTRA_WHITESPACE_REGEX, " ")
      // Remove punctuation/special chars but keep Unicode letters, numbers, spaces
      // \p{L} = any Unicode letter (Cyrillic, Latin, Chinese, etc.)
      // \p{N} = any Unicode number
      .replace(NON_ALPHANUMERIC_REGEX, "")
      .trim()
  );
}

/**
 * L1 Normalization Step 2: Apply synonym mapping
 * Converts variations to canonical forms
 * Unicode-safe word boundaries for multi-language support
 */
export function normalizeSynonyms(query: string): string {
  let normalized = query;

  // Replace synonyms (order matters - longer phrases first)
  Object.entries(SYNONYM_MAP)
    .sort((a, b) => b[0].length - a[0].length)
    .forEach(([variant, canonical]) => {
      // Escape special regex chars and use Unicode word boundaries
      const escapedVariant = variant.replace(REGEX_SPECIAL_CHARS, "\\$&");
      const regex = createWordBoundaryRegex(escapedVariant);
      normalized = normalized.replace(regex, canonical);
    });

  return normalized;
}

/**
 * L1 Normalization Step 3: Normalize brand names
 * Standardizes brand name capitalization and variations
 * Unicode-safe word boundaries for multi-language support
 */
export function normalizeBrands(query: string): string {
  let normalized = query;

  // Replace brand variations (case-insensitive)
  Object.entries(BRAND_MAP)
    .sort((a, b) => b[0].length - a[0].length)
    .forEach(([variant, canonical]) => {
      // Escape special regex chars and use Unicode word boundaries
      const escapedVariant = variant.replace(REGEX_SPECIAL_CHARS, "\\$&");
      const regex = createWordBoundaryRegex(escapedVariant);
      normalized = normalized.replace(regex, canonical);
    });

  return normalized;
}

/**
 * L1 Normalization Step 4: Normalize color names
 * Maps color variations to standard names
 * Unicode-safe word boundaries for multi-language support
 */
export function normalizeColors(query: string): string {
  let normalized = query;

  // Replace color variations (case-insensitive)
  Object.entries(COLOR_MAP)
    .sort((a, b) => b[0].length - a[0].length)
    .forEach(([variant, canonical]) => {
      // Escape special regex chars and use Unicode word boundaries
      const escapedVariant = variant.replace(REGEX_SPECIAL_CHARS, "\\$&");
      const regex = createWordBoundaryRegex(escapedVariant);
      normalized = normalized.replace(regex, canonical);
    });

  return normalized;
}

/**
 * Complete L1 Normalization Pipeline
 * Applies all normalization strategies in sequence
 * This creates the L1 cache key
 */
export function normalizeQueryL1(query: string): string {
  let normalized = query;

  // Step 1: Basic cleanup
  normalized = normalizeBasic(normalized);

  // Step 2: Synonym mapping
  normalized = normalizeSynonyms(normalized);

  // Step 3: Brand normalization
  normalized = normalizeBrands(normalized);

  // Step 4: Color normalization
  normalized = normalizeColors(normalized);

  // Final cleanup
  normalized = normalized.trim();

  return normalized;
}

/**
 * Check if two queries are similar after L1 normalization
 * Useful for cache hit validation
 */
export function areQueriesSimilar(query1: string, query2: string): boolean {
  return normalizeQueryL1(query1) === normalizeQueryL1(query2);
}

/**
 * Get normalization metadata for debugging
 * Shows how query was transformed through pipeline
 */
export function getNormalizationSteps(query: string): {
  original: string;
  basic: string;
  synonyms: string;
  brands: string;
  colors: string;
  final: string;
} {
  const basic = normalizeBasic(query);
  const synonyms = normalizeSynonyms(basic);
  const brands = normalizeBrands(synonyms);
  const colors = normalizeColors(brands);

  return {
    original: query,
    basic,
    synonyms,
    brands,
    colors,
    final: colors.trim(),
  };
}
