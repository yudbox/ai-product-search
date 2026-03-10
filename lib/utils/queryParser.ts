import { openai } from "../openai";
import { ParsedQuery, Gender } from "../types";

// Price validation constants
const MIN_VALID_PRICE = 0;
const MAX_VALID_PRICE = 100000; // Upper limit for price validation
const DEFAULT_MAX_PRICE = 10000; // Default max price for filtering

// Valid gender values from enum
const VALID_GENDERS = Object.values(Gender);

/**
 * Parse user query with LLM to extract structured filters
 * Handles slang, math, currency conversion, context understanding
 */
export async function parseQueryWithLLM(query: string): Promise<ParsedQuery> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Fast and cheap for parsing
      temperature: 0, // Deterministic parsing
      messages: [
        {
          role: "system",
          content: `You are a multilingual query parser for a FOOTWEAR e-commerce store.
Parse user queries in ANY language into structured filters.

⚠️ CRITICAL: We ONLY sell footwear (shoes, sneakers, boots, sandals, slippers, athletic shoes, etc.)

VALIDATION RULES:
1. Set isRelevant = false if query is about:
   - Electronics (phones, laptops, headphones)
   - Clothing (jackets, pants, shirts, accessories)
   - Tools or equipment (hammers, bags, watches)
   - Services or questions ("как выбрать?", "где купить?")
   - Random words or nonsense
   
2. Set isRelevant = true ONLY if query is clearly about:
   - Searching for footwear products
   - Specific shoe types, brands, colors, purposes
   - Footwear-related search intents

3. For rejections:
   - rejectionReason: "not_footwear" (not about shoes)
   - rejectionReason: "question_not_search" (question instead of search)
   - rejectionReason: "nonsense" (gibberish)
   - suggestedQuery: provide helpful footwear alternative if possible

OUTPUT FORMAT (JSON):
{
  "isRelevant": true | false,
  "rejectionReason": "not_footwear" | "question_not_search" | "nonsense" | null,
  "suggestedQuery": "helpful alternative" | null,
  "confidence": 0.0-1.0,
  "semanticQuery": "cleaned search terms in English for vector search",
  "gender": "men" | "women" | "unisex" (only if clearly mentioned or inferred),
  "color": "red" | "blue" | etc. (only if mentioned),
  "brand": "Nike" | "Adidas" | etc. (only if mentioned),
  "category": "sneakers" | "boots" | etc. (only if mentioned),
  "minPrice": number in USD (only if mentioned),
  "maxPrice": number in USD (only if mentioned),
  "detectedLanguage": "en" | "ru" | "ro" | etc.,
  "specialTerms": ["term1", "term2"] (any interesting slang/colloquial terms)
}

NOTES:
- Convert prices to USD (1 USD = 90 RUB, "пятихатка" = 500 RUB)
- Return names in English for vector search
- Understand slang: "тапки"=shoes, "качалка"=gym, "кроссы"=sneakers`,
        },
        {
          role: "user",
          content: query,
        },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from LLM");
    }

    const parsed = JSON.parse(content);

    // Validate and normalize the response
    const result: ParsedQuery = {
      semanticQuery: parsed.semanticQuery || query,
      originalQuery: query,
      detectedLanguage: parsed.detectedLanguage,
      specialTerms: parsed.specialTerms,
    };

    // Add optional fields only if present
    if (parsed.gender && VALID_GENDERS.includes(parsed.gender)) {
      result.gender = parsed.gender as Gender;
    }

    if (parsed.color && typeof parsed.color === "string") {
      result.color = parsed.color.toLowerCase();
    }

    if (parsed.brand && typeof parsed.brand === "string") {
      result.brand = parsed.brand;
    }

    if (parsed.category && typeof parsed.category === "string") {
      result.category = parsed.category.toLowerCase();
    }

    if (
      typeof parsed.minPrice === "number" &&
      parsed.minPrice >= MIN_VALID_PRICE &&
      parsed.minPrice <= MAX_VALID_PRICE
    ) {
      result.minPrice = Math.round(parsed.minPrice);
    }

    if (
      typeof parsed.maxPrice === "number" &&
      parsed.maxPrice >= MIN_VALID_PRICE &&
      parsed.maxPrice <= MAX_VALID_PRICE
    ) {
      result.maxPrice = Math.round(parsed.maxPrice);
    }

    // TIER 1 Validation fields
    if (typeof parsed.isRelevant === "boolean") {
      result.isRelevant = parsed.isRelevant;
    }

    if (parsed.rejectionReason && typeof parsed.rejectionReason === "string") {
      result.rejectionReason = parsed.rejectionReason;
    }

    if (parsed.suggestedQuery && typeof parsed.suggestedQuery === "string") {
      result.suggestedQuery = parsed.suggestedQuery;
    }

    if (typeof parsed.confidence === "number") {
      result.confidence = parsed.confidence;
    }

    return result;
  } catch (error) {
    console.error("❌ LLM query parsing error:", error);

    // Fallback: return original query as semantic query
    return {
      semanticQuery: query,
      originalQuery: query,
    };
  }
}

/**
 * Build Pinecone metadata filter from parsed query and UI filters
 * Combines LLM-extracted filters with user-selected UI filters
 */
export function buildPineconeFilter(
  parsed: ParsedQuery,
  uiFilters?: {
    priceRange?: string[];
    brands?: string[];
    categories?: string[];
  },
): Record<string, unknown> | undefined {
  const filter: Record<string, unknown> = {};

  // 1. Gender filter (from LLM)
  if (parsed.gender) {
    filter.gender = { $eq: parsed.gender };
  }

  // 2. Price filter (combine LLM + UI)
  const priceFilter: Record<string, number> = {};

  // From LLM parsed query
  if (parsed.minPrice !== undefined) {
    priceFilter.$gte = parsed.minPrice;
  }
  if (parsed.maxPrice !== undefined) {
    priceFilter.$lte = parsed.maxPrice;
  }

  // From UI price range filters
  if (uiFilters?.priceRange && uiFilters.priceRange.length > 0) {
    // Convert UI ranges to min/max
    const ranges = uiFilters.priceRange
      .map((range) => {
        if (range === "0-80") return { min: 0, max: 80 };
        if (range === "80-150") return { min: 80, max: 150 };
        if (range === "150+") return { min: 150, max: DEFAULT_MAX_PRICE };
        return null;
      })
      .filter(Boolean) as { min: number; max: number }[];

    if (ranges.length > 0) {
      // Find overall min and max from all selected ranges
      const uiMinPrice = Math.min(...ranges.map((r) => r.min));
      const uiMaxPrice = Math.max(...ranges.map((r) => r.max));

      // Combine with LLM-parsed price (use most restrictive)
      if (!priceFilter.$gte || uiMinPrice > priceFilter.$gte) {
        priceFilter.$gte = uiMinPrice;
      }
      if (!priceFilter.$lte || uiMaxPrice < priceFilter.$lte) {
        priceFilter.$lte = uiMaxPrice;
      }
    }
  }

  // Only add price filter if we have constraints
  if (Object.keys(priceFilter).length > 0) {
    // Ensure we always have both bounds
    if (!priceFilter.$gte) priceFilter.$gte = MIN_VALID_PRICE;
    if (!priceFilter.$lte) priceFilter.$lte = DEFAULT_MAX_PRICE;
    filter.price = priceFilter;
  }

  // 3. Brand filter (LLM single brand OR UI multiple brands)
  if (parsed.brand && (!uiFilters?.brands || uiFilters.brands.length === 0)) {
    // LLM extracted a specific brand
    filter.brand = { $eq: parsed.brand };
  } else if (uiFilters?.brands && uiFilters.brands.length > 0) {
    // UI filters take precedence if both exist
    filter.brand = { $in: uiFilters.brands };
  }

  // 4. Category filter - DISABLED
  // Intentionally not filtering by category - let vector search handle semantic matching
  // LLM parses "sneakers" but DB has "Running Shoes", "Casual Sneakers" etc.
  // Strict filtering blocks all results due to format mismatch

  // 5. Color filter (from LLM only, typically not in UI)
  if (parsed.color) {
    filter.color = { $eq: parsed.color };
  }

  // Pinecone doesn't accept empty filter objects
  // Return undefined if no filters applied
  return Object.keys(filter).length > 0 ? filter : undefined;
}
