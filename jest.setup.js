import "@testing-library/jest-dom";

// Set environment variables for tests
process.env.OPENAI_EMBEDDING_MODEL = "test-embedding-model";
process.env.PINECONE_NAMESPACE = "test-namespace";

// Mock Next.js Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />;
  },
}));
