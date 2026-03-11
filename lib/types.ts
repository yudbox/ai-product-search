// Product Types for AI Product Search

export enum FilterType {
  PriceRange = "priceRange",
  Brand = "brand",
  Category = "category",
}

export enum Gender {
  Men = "men",
  Women = "women",
  Unisex = "unisex",
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  brand: string;
  category: string;
  color: string;
  sizes: number[];
  inStock: boolean;
  rating: number;
  features: string[];
  gender: Gender;
}

export interface SearchFilters {
  priceRange?: string[];
  brands?: string[];
  categories?: string[];
}

export interface SearchRequest {
  query: string;
  filters?: SearchFilters;
  excludedIds?: string[];
}

export interface SearchResponse {
  success: boolean;
  query: string;
  count: number;
  totalBeforeFilters?: number;
  products: Product[];
  explanation?: string;
  cached?: boolean;
  rejected?: boolean;
  rejectionReason?: string;
  suggestedQuery?: string;
  hasMoreResults?: boolean;
  cacheMetadata?: CacheMetadata;
  performance?: {
    embedding: string;
    search: string;
    total?: string;
    parsing?: string;
    cache?: string;
  };
}

// Parsed query structure from LLM
export interface ParsedQuery {
  // Semantic query for embedding (cleaned from filters)
  semanticQuery: string;

  // Extracted filters
  gender?: Gender;
  color?: string;
  brand?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;

  // Validation fields (TIER 1)
  isRelevant?: boolean;
  rejectionReason?: string;
  suggestedQuery?: string;
  confidence?: number;

  // Original query and metadata
  originalQuery: string;
  detectedLanguage?: string;
  specialTerms?: string[]; // e.g., "пятихатка", "герла"
}

// Cache-related types
export interface CachedSearchResult {
  products: Product[];
  explanation: string;
  count: number;
  parsedQuery?: ParsedQuery;
  timestamp: number; // When cached
  filters?: SearchFilters; // UI filters used
}

export interface CacheMetadata {
  l1Hit: boolean; // L1 cache (normalized text) hit
  l2Hit: boolean; // L2 cache (semanticQuery) hit
  cacheKey?: string; // Cache key used
  normalizedQuery?: string; // L1 normalized version
  ttl?: number; // TTL applied (seconds)
  frequency?: number; // Query hit count
}
