import { NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { index } from "@/lib/pinecone";
import {
  SearchRequest,
  SearchResponse,
  Product,
  Gender,
  ParsedQuery,
} from "@/lib/types";
import { parseQueryWithLLM, buildPineconeFilter } from "@/lib/queryParser";

// Configuration from environment variables
if (!process.env.OPENAI_EMBEDDING_MODEL) {
  throw new Error("OPENAI_EMBEDDING_MODEL is not configured");
}

if (!process.env.PINECONE_NAMESPACE) {
  throw new Error("PINECONE_NAMESPACE is not configured");
}

const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL;
const PRODUCTS_NAMESPACE = process.env.PINECONE_NAMESPACE;

export async function POST(req: Request) {
  let query = ""; // Define outside try for error handling
  try {
    const body: SearchRequest = await req.json();
    query = body.query;
    const { filters, excludedIds } = body;

    // Validate input
    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const startTotal = Date.now();

    console.log("\n🎯 NEW SEARCH REQUEST:");
    console.log("  Query:", query);
    console.log("  UI Filters:", JSON.stringify(filters, null, 2));

    // 1. Parse query with LLM to extract structured filters + domain validation (TIER 1)
    const startParsing = Date.now();
    const parsedQuery = await parseQueryWithLLM(query);
    const parsingTime = Date.now() - startParsing;

    console.log("\n🔍 LLM PARSED QUERY:");
    console.log("  semanticQuery:", parsedQuery.semanticQuery);
    console.log("  gender:", parsedQuery.gender || "(not set)");
    console.log("  category:", parsedQuery.category || "(not set)");
    console.log("  brand:", parsedQuery.brand || "(not set)");
    console.log("  color:", parsedQuery.color || "(not set)");
    console.log(
      "  minPrice:",
      parsedQuery.minPrice !== undefined ? parsedQuery.minPrice : "(not set)",
    );
    console.log(
      "  maxPrice:",
      parsedQuery.maxPrice !== undefined ? parsedQuery.maxPrice : "(not set)",
    );
    console.log("  Full parsed:", JSON.stringify(parsedQuery, null, 2));

    // ❌ TIER 1: Early rejection for non-footwear queries
    // This saves money on embedding + Pinecone costs
    if (parsedQuery.isRelevant === false) {
      const helpMessage = generateRejectionMessage(
        parsedQuery.rejectionReason,
        parsedQuery.suggestedQuery,
        query,
      );

      return NextResponse.json({
        success: false,
        rejected: true,
        rejectionReason: parsedQuery.rejectionReason,
        query,
        count: 0,
        products: [],
        explanation: helpMessage,
        suggestedQuery: parsedQuery.suggestedQuery,
        performance: {
          parsing: `${parsingTime}ms`,
          embedding: "0ms",
          search: "0ms",
          total: `${Date.now() - startTotal}ms`,
        },
      });
    }

    // 2. Generate embedding for semantic query (cleaned from filters)
    const startEmbedding = Date.now();
    const embeddingResponse = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: parsedQuery.semanticQuery.toLowerCase().trim(),
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;
    const embeddingTime = Date.now() - startEmbedding;

    // 3. Build Pinecone filter from parsed query + UI filters
    const pineconeFilter = buildPineconeFilter(parsedQuery, filters);

    console.log("\n📊 PINECONE FILTER:");
    if (pineconeFilter) {
      console.log("  gender:", pineconeFilter.gender || "(not applied)");
      console.log(
        "  price:",
        pineconeFilter.price
          ? JSON.stringify(pineconeFilter.price)
          : "(not applied)",
      );
      console.log("  brand:", pineconeFilter.brand || "(not applied)");
      console.log("  category:", pineconeFilter.category || "(not applied)");
      console.log("  color:", pineconeFilter.color || "(not applied)");
      console.log("  Full filter:", JSON.stringify(pineconeFilter, null, 2));
    } else {
      console.log("  No filters applied - searching all products");
    }

    // 4. Query Pinecone with metadata filtering (TIER 2)
    const startSearch = Date.now();
    const namespace = index.namespace(PRODUCTS_NAMESPACE);

    // Request all matching products (up to database limit)
    // With smart filtering in Pinecone, we get only relevant results
    const topKWithBuffer =
      excludedIds && excludedIds.length > 0
        ? Math.min(50 + excludedIds.length, 100)
        : 50;

    const searchResults = await namespace.query({
      vector: queryEmbedding,
      ...(pineconeFilter && { filter: pineconeFilter }), // Apply filter only if exists
      topK: topKWithBuffer,
      includeMetadata: true,
    });
    const searchTime = Date.now() - startSearch;

    console.log(
      `\n🔎 PINECONE SEARCH RESULTS: ${searchResults.matches.length} matches found`,
    );
    if (searchResults.matches.length > 0) {
      const prices = searchResults.matches
        .map((m) => m.metadata?.price)
        .filter((p): p is number => typeof p === "number");
      console.log(
        "  Price range:",
        prices.length > 0 ? Math.min(...prices) : "N/A",
        "-",
        prices.length > 0 ? Math.max(...prices) : "N/A",
      );
      console.log(
        "  First 5 products:",
        searchResults.matches.slice(0, 5).map((m) => ({
          name: m.metadata?.name,
          price: m.metadata?.price,
          gender: m.metadata?.gender,
          category: m.metadata?.category,
          score: m.score?.toFixed(3),
        })),
      );
    } else {
      console.log("  ⚠️ No matches found - filter might be too restrictive!");
    }

    // 5. TIER 3: Filter by relevance score threshold (OPTIONAL)
    // For now, we disable strict filtering - vector search scores are naturally low
    // Pinecone already returns results sorted by relevance
    const relevantMatches = searchResults.matches; // No filtering

    // 6. Convert to Product objects and filter out excluded IDs only
    const excludedSet = new Set(excludedIds || []);
    const products: Product[] = relevantMatches
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

    // 7. Generate AI explanation (TIER 4)
    const explanation = generateExplanation(query, products, parsedQuery);

    const totalTime = Date.now() - startTotal;

    const response: SearchResponse = {
      success: true,
      query,
      count: products.length,
      products,
      explanation,
      suggestedQuery:
        products.length === 0 ? parsedQuery.suggestedQuery : undefined,
      performance: {
        parsing: `${parsingTime}ms`,
        embedding: `${embeddingTime}ms`,
        search: `${searchTime}ms`,
        total: `${totalTime}ms`,
      },
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error("❌ Search error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    if (errorStack) {
      console.error("Error stack:", errorStack);
    }
    return NextResponse.json(
      {
        success: false,
        error: "Search failed",
        details: errorMessage,
        query,
        count: 0,
        products: [],
      },
      { status: 500 },
    );
  }
}

// TIER 1: Generate rejection message for non-relevant queries
function generateRejectionMessage(
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

// Generate AI explanation of search results
function generateExplanation(
  originalQuery: string,
  products: Product[],
  parsedQuery: ParsedQuery,
): string {
  if (products.length === 0) {
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

    // Add helpful suggestions
    if (suggestions.length > 0) {
      message += ` Try: ${suggestions.join(" or ")}.`;
    } else {
      message += " Try adjusting your search or removing filters.";
    }

    // Suggest alternative query if available
    if (parsedQuery.suggestedQuery) {
      message += ` Or search: "${parsedQuery.suggestedQuery}"`;
    }

    return message;
  }

  const topProducts = products.slice(0, 3).map((p) => p.name);
  const brands = [...new Set(products.map((p) => p.brand))];
  const avgPrice = Math.round(
    products.reduce((sum, p) => sum + p.price, 0) / products.length,
  );

  let explanation = `Found ${products.length} products matching "${originalQuery}".`;

  // Add context about parsed understanding
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

  // Add special terms context if any
  if (parsedQuery.specialTerms && parsedQuery.specialTerms.length > 0) {
    explanation += ` [Understood: ${parsedQuery.specialTerms.join(", ")}]`;
  }

  return explanation;
}
