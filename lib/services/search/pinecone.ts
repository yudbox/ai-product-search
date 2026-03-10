/**
 * Search Service - Pinecone operations
 * Handles embedding generation, vector search, and result transformation
 */

import { openai } from "@/lib/openai";
import { index } from "@/lib/pinecone";
import type { Product, ParsedQuery, SearchRequest } from "@/lib/types";
import { Gender } from "@/lib/types";
import { buildPineconeFilter } from "@/lib/utils/queryParser";

const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL!;
const PRODUCTS_NAMESPACE = process.env.PINECONE_NAMESPACE!;

/**
 * Generate OpenAI embedding for search query
 * Throws error if OpenAI API is unavailable
 */
export async function generateEmbedding(
  semanticQuery: string,
): Promise<number[]> {
  try {
    const embeddingResponse = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: semanticQuery.toLowerCase().trim(),
    });
    return embeddingResponse.data[0].embedding;
  } catch (error) {
    console.error("❌ OpenAI Embeddings API error:", error);
    throw new Error(
      `Failed to generate embedding: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Search Pinecone with vector and metadata filters
 * Throws error if Pinecone API is unavailable
 */
export async function searchPinecone(
  embedding: number[],
  parsedQuery: ParsedQuery,
  filters?: SearchRequest["filters"],
  excludedIds?: string[],
) {
  try {
    const namespace = index.namespace(PRODUCTS_NAMESPACE);
    const pineconeFilter = buildPineconeFilter(parsedQuery, filters);

    const topKWithBuffer =
      excludedIds && excludedIds.length > 0
        ? Math.min(50 + excludedIds.length, 100)
        : 50;

    const searchResults = await namespace.query({
      vector: embedding,
      ...(pineconeFilter && { filter: pineconeFilter }),
      topK: topKWithBuffer,
      includeMetadata: true,
    });

    return { searchResults, pineconeFilter };
  } catch (error) {
    console.error("❌ Pinecone search error:", error);
    throw new Error(
      `Failed to search Pinecone: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Transform Pinecone matches to Product objects
 */
export function transformToProducts(
  matches: Array<{ id: string; metadata?: Record<string, unknown> }>,
  excludedIds?: string[],
): Product[] {
  const excludedSet = new Set(excludedIds || []);

  return matches
    .filter((match) => !excludedSet.has(match.id))
    .map((match) => {
      const metadata = match.metadata as Record<string, unknown>;
      return {
        id: match.id,
        name: (metadata.name as string) || "",
        description: (metadata.description as string) || "",
        price: (metadata.price as number) || 0,
        image: (metadata.image as string) || "",
        brand: (metadata.brand as string) || "",
        category: (metadata.category as string) || "",
        color: (metadata.color as string) || "",
        sizes: (metadata.sizes as number[]) || [],
        inStock: metadata.inStock !== false,
        rating: (metadata.rating as number) || 0,
        features: (metadata.features as string[]) || [],
        gender: (metadata.gender as Gender) || Gender.Unisex,
      };
    });
}
