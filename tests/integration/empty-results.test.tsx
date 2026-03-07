import { render, screen, waitFor } from "@testing-library/react";
import SearchPage from "@/app/search/page";

const mockPush = jest.fn();
const mockGet = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

describe("Integration: Empty Results Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays empty state when no products match search", async () => {
    // Use special query that returns no results
    mockGet.mockReturnValue("nonexistent product");

    render(<SearchPage />);

    // Wait for empty state message from ProductGrid
    await waitFor(() => {
      expect(screen.getByText("No products found")).toBeInTheDocument();
    });

    // Should also show helpful message
    expect(
      screen.getByText("Try adjusting your search or filters"),
    ).toBeInTheDocument();
  });

  it("displays search query in results header even when empty", async () => {
    mockGet.mockReturnValue("nonexistent product");

    render(<SearchPage />);

    expect(
      screen.getByText("Search Results for 'nonexistent product'"),
    ).toBeInTheDocument();
  });

  it("UI remains functional in empty state", async () => {
    mockGet.mockReturnValue("nonexistent product");

    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByText("No products found")).toBeInTheDocument();
    });

    // Navigation should still work
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("🔍 AI Product Search")).toBeInTheDocument();
  });
});
