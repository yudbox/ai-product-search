import { getErrorResponse } from "../errorHelpers";

describe("errorHelpers", () => {
  describe("getErrorResponse", () => {
    it("should return embedding error message", () => {
      const result = getErrorResponse("Failed to generate embedding");

      expect(result).toEqual({
        userMessage:
          "AI embedding service temporarily unavailable. Please try again in a moment.",
        statusCode: 503,
      });
    });

    it("should return pinecone error message", () => {
      const result = getErrorResponse("Pinecone connection failed");

      expect(result).toEqual({
        userMessage:
          "Search database temporarily unavailable. Please try again in a moment.",
        statusCode: 503,
      });
    });

    it("should return openai error message", () => {
      const result = getErrorResponse("OpenAI API rate limit exceeded");

      expect(result).toEqual({
        userMessage:
          "AI service temporarily unavailable. Please try again in a moment.",
        statusCode: 503,
      });
    });

    it("should return llm error message", () => {
      const result = getErrorResponse("LLM parsing failed");

      expect(result).toEqual({
        userMessage:
          "Query parsing service temporarily unavailable. Please try again.",
        statusCode: 503,
      });
    });

    it("should return default error message for unknown errors", () => {
      const result = getErrorResponse("Unknown network error");

      expect(result).toEqual({
        userMessage: "Search failed. Please try again.",
        statusCode: 503,
      });
    });

    it("should handle case-insensitive error messages", () => {
      const result = getErrorResponse("EMBEDDING service error");

      expect(result).toEqual({
        userMessage:
          "AI embedding service temporarily unavailable. Please try again in a moment.",
        statusCode: 503,
      });
    });

    it("should prioritize embedding over openai if both keywords present", () => {
      const result = getErrorResponse("OpenAI embedding service failed");

      expect(result).toEqual({
        userMessage:
          "AI embedding service temporarily unavailable. Please try again in a moment.",
        statusCode: 503,
      });
    });

    it("should handle empty error message", () => {
      const result = getErrorResponse("");

      expect(result).toEqual({
        userMessage: "Search failed. Please try again.",
        statusCode: 503,
      });
    });

    it("should handle error message with multiple keywords", () => {
      const result = getErrorResponse(
        "Failed to search Pinecone database connection timeout",
      );

      expect(result).toEqual({
        userMessage:
          "Search database temporarily unavailable. Please try again in a moment.",
        statusCode: 503,
      });
    });
  });
});
