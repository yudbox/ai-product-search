/**
 * Error Helpers - User-friendly error message generation
 * Maps technical errors to user-friendly messages with appropriate status codes
 */

export interface ErrorResponse {
  userMessage: string;
  statusCode: number;
}

/**
 * Determine error type and provide appropriate user-friendly message
 * @param errorMessage - The technical error message
 * @returns Object with user-friendly message and appropriate HTTP status code
 */
export function getErrorResponse(errorMessage: string): ErrorResponse {
  const lowercaseMessage = errorMessage.toLowerCase();

  // Check for specific error types and return appropriate response
  if (lowercaseMessage.includes("embedding")) {
    return {
      userMessage:
        "AI embedding service temporarily unavailable. Please try again in a moment.",
      statusCode: 503,
    };
  }

  if (lowercaseMessage.includes("pinecone")) {
    return {
      userMessage:
        "Search database temporarily unavailable. Please try again in a moment.",
      statusCode: 503,
    };
  }

  if (lowercaseMessage.includes("openai")) {
    return {
      userMessage:
        "AI service temporarily unavailable. Please try again in a moment.",
      statusCode: 503,
    };
  }

  if (lowercaseMessage.includes("llm")) {
    return {
      userMessage:
        "Query parsing service temporarily unavailable. Please try again.",
      statusCode: 503,
    };
  }

  // Default error response
  return {
    userMessage: "Search failed. Please try again.",
    statusCode: 503,
  };
}
