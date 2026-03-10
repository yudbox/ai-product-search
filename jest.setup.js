import "@testing-library/jest-dom";

// Set environment variables for tests
process.env.OPENAI_API_KEY = "test-openai-api-key";
process.env.OPENAI_EMBEDDING_MODEL = "test-embedding-model";
process.env.PINECONE_API_KEY = "test-pinecone-api-key";
process.env.PINECONE_INDEX_NAME = "test-index";
process.env.PINECONE_NAMESPACE = "test-namespace";
process.env.KV_REST_API_URL = "test-kv-url";
process.env.KV_REST_API_TOKEN = "test-kv-token";

// Mock Next.js Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));
