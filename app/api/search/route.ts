import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { index } from "@/lib/pinecone";
import { SearchRequest, SearchResponse, Product, Gender } from "@/lib/types";

// Configuration from environment variables
if (!process.env.OPENAI_EMBEDDING_MODEL) {
  throw new Error("OPENAI_EMBEDDING_MODEL is not configured");
}

if (!process.env.PINECONE_NAMESPACE) {
  throw new Error("PINECONE_NAMESPACE is not configured");
}

const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL;
const PRODUCTS_NAMESPACE = process.env.PINECONE_NAMESPACE;

// Extract price constraints from query text
function extractPriceConstraints(query: string): {
  maxPrice?: number;
  minPrice?: number;
} {
  const lowerQuery = query.toLowerCase();

  // Patterns for maximum price (under, below, less than, max, cheaper than)
  const maxPricePatterns = [
    /(?:under|below|less than|max|maximum|cheaper than)\s*\$?\s*(\d+)/i,
    /\$?\s*(\d+)\s*(?:or less|or under|or below|max)/i,
  ];

  // Patterns for minimum price (over, above, more than, min, at least)
  const minPricePatterns = [
    /(?:over|above|more than|min|minimum|at least)\s*\$?\s*(\d+)/i,
    /\$?\s*(\d+)\s*(?:or more|or above|minimum)/i,
  ];

  let maxPrice: number | undefined;
  let minPrice: number | undefined;

  // Check for max price
  for (const pattern of maxPricePatterns) {
    const match = lowerQuery.match(pattern);
    if (match && match[1]) {
      maxPrice = parseInt(match[1], 10);
      break;
    }
  }

  // Check for min price
  for (const pattern of minPricePatterns) {
    const match = lowerQuery.match(pattern);
    if (match && match[1]) {
      minPrice = parseInt(match[1], 10);
      break;
    }
  }

  return { maxPrice, minPrice };
}

export async function POST(req: Request) {
  try {
    const body: SearchRequest = await req.json();
    const { query, filters, excludedIds } = body;

    // Validate input
    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // 1. Generate embedding for user query
    const startEmbedding = Date.now();
    const embeddingResponse = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: query.toLowerCase().trim(),
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;
    const embeddingTime = Date.now() - startEmbedding;

    // 2. Query Pinecone
    const startSearch = Date.now();
    const namespace = index.namespace(PRODUCTS_NAMESPACE);

    // Calculate topK with buffer for excluded IDs
    // Request more vectors if we need to exclude some
    const topKWithBuffer =
      excludedIds && excludedIds.length > 0
        ? Math.min(50 + excludedIds.length, 100)
        : 50;

    const searchResults = await namespace.query({
      vector: queryEmbedding,
      topK: topKWithBuffer,
      includeMetadata: true,
    });
    const searchTime = Date.now() - startSearch;

    // 3. Convert to Product objects and filter out excluded IDs
    const excludedSet = new Set(excludedIds || []);
    let products: Product[] = searchResults.matches
      .filter((match) => !excludedSet.has(match.id)) // Filter out excluded products
      .slice(0, 50) // Limit to 50 after filtering
      .map((match) => {
        const metadata = match.metadata as any;
        return {
          id: match.id,
          name: metadata.name || "",
          description: metadata.description || "",
          price: metadata.price || 0,
          image: metadata.image || "",
          brand: metadata.brand || "",
          category: metadata.category || "",
          color: metadata.color || "",
          sizes: metadata.sizes || [],
          inStock: metadata.inStock !== false,
          rating: metadata.rating || 0,
          features: metadata.features || [],
          gender: (metadata.gender as Gender) || Gender.Unisex,
        };
      });

    // Save count before filtering
    const totalBeforeFilters = products.length;

    // 4. Extract price constraints from query
    const priceConstraints = extractPriceConstraints(query);

    // 5. Apply filters
    if (filters) {
      // Filter by price range
      if (filters.priceRange && filters.priceRange.length > 0) {
        products = products.filter((p) => {
          return filters.priceRange!.some((range: string) => {
            if (range === "0-80") return p.price >= 0 && p.price <= 80;
            if (range === "80-150") return p.price > 80 && p.price <= 150;
            if (range === "150+") return p.price > 150;
            return true;
          });
        });
      }

      // Filter by brands
      if (filters.brands && filters.brands.length > 0) {
        products = products.filter((p) => filters.brands!.includes(p.brand));
      }

      // Filter by categories
      if (filters.categories && filters.categories.length > 0) {
        products = products.filter((p) =>
          filters.categories!.includes(p.category),
        );
      }
    }

    // 6. Apply price constraints from query text
    if (priceConstraints.maxPrice !== undefined) {
      products = products.filter((p) => p.price <= priceConstraints.maxPrice!);
    }
    if (priceConstraints.minPrice !== undefined) {
      products = products.filter((p) => p.price >= priceConstraints.minPrice!);
    }

    // Return all topK results (batching handled on client)
    // Client will show 12 at a time with infinite scroll

    // 7. Generate AI explanation
    const explanation = generateExplanation(query, products, priceConstraints);

    const totalTime = Date.now() - startEmbedding;

    const response: SearchResponse = {
      success: true,
      query,
      count: products.length,
      totalBeforeFilters,
      products,
      explanation,
      performance: {
        embedding: `${embeddingTime}ms`,
        search: `${searchTime}ms`,
        total: `${totalTime}ms`,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("❌ Search error:", error);
    return NextResponse.json(
      {
        error: "Search failed",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

// Generate AI explanation of search results
function generateExplanation(
  query: string,
  products: Product[],
  priceConstraints?: { maxPrice?: number; minPrice?: number },
): string {
  if (products.length === 0) {
    let message = `No products found for "${query}".`;
    if (priceConstraints?.maxPrice) {
      message += ` (max price: $${priceConstraints.maxPrice})`;
    }
    if (priceConstraints?.minPrice) {
      message += ` (min price: $${priceConstraints.minPrice})`;
    }
    message += " Try adjusting your search or removing filters.";
    return message;
  }

  const topProducts = products.slice(0, 3).map((p) => p.name);
  const brands = [...new Set(products.map((p) => p.brand))];
  const avgPrice = Math.round(
    products.reduce((sum, p) => sum + p.price, 0) / products.length,
  );

  let explanation = `Found ${products.length} products matching "${query}".`;

  if (priceConstraints?.maxPrice) {
    explanation += ` All products are under $${priceConstraints.maxPrice}.`;
  }
  if (priceConstraints?.minPrice) {
    explanation += ` All products are over $${priceConstraints.minPrice}.`;
  }

  explanation += ` Top results include ${topProducts.join(", ")}. Brands: ${brands.join(", ")}. Average price: $${avgPrice}.`;

  return explanation;
}
