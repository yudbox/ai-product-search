/**
 * Integration Tests: errorHelpers
 * Tests the getErrorResponse function in real-world scenarios
 */

import { getErrorResponse } from "@/lib/utils/errorHelpers";

describe("Integration: lib/utils/errorHelpers", () => {
  describe("getErrorResponse", () => {
    it("should handle OpenAI embedding errors", () => {
      const errorMessage = "Failed to generate embedding: Service timeout";
      const result = getErrorResponse(errorMessage);

      expect(result).toEqual({
        userMessage:
          "AI embedding service temporarily unavailable. Please try again in a moment.",
        statusCode: 503,
      });
    });

    it("should handle Pinecone search errors", () => {
      const errorMessage = "Pinecone index query failed";
      const result = getErrorResponse(errorMessage);

      expect(result).toEqual({
        userMessage:
          "Search database temporarily unavailable. Please try again in a moment.",
        statusCode: 503,
      });
    });

    it("should handle OpenAI API errors", () => {
      const errorMessage = "OpenAI API rate limit exceeded";
      const result = getErrorResponse(errorMessage);

      expect(result).toEqual({
        userMessage:
          "AI service temporarily unavailable. Please try again in a moment.",
        statusCode: 503,
      });
    });

    it("should handle LLM parsing errors", () => {
      const errorMessage = "LLM response parsing failed";
      const result = getErrorResponse(errorMessage);

      expect(result).toEqual({
        userMessage:
          "Query parsing service temporarily unavailable. Please try again.",
        statusCode: 503,
      });
    });

    it("should handle generic network errors", () => {
      const errorMessage = "Network connection timeout";
      const result = getErrorResponse(errorMessage);

      expect(result).toEqual({
        userMessage: "Search failed. Please try again.",
        statusCode: 503,
      });
    });

    it("should prioritize embedding over openai keyword", () => {
      const errorMessage = "OpenAI embedding service failed";
      const result = getErrorResponse(errorMessage);

      expect(result.userMessage).toContain("embedding service");
    });

    it("should handle case-insensitive error messages", () => {
      const errorMessage = "PINECONE DATABASE ERROR";
      const result = getErrorResponse(errorMessage);

      expect(result.userMessage).toContain("Search database");
    });

    it("should handle empty error message", () => {
      const errorMessage = "";
      const result = getErrorResponse(errorMessage);

      expect(result).toEqual({
        userMessage: "Search failed. Please try again.",
        statusCode: 503,
      });
    });

    it("should return consistent status code for all service errors", () => {
      const errors = [
        "Embedding service failed",
        "Pinecone connection error",
        "OpenAI timeout",
        "LLM error",
        "Unknown error",
      ];

      errors.forEach((errorMessage) => {
        const result = getErrorResponse(errorMessage);
        expect(result.statusCode).toBe(503);
      });
    });
  });
});
