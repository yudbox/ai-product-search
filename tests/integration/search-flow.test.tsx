import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchPage from "@/app/search/page";

// Mock next/navigation
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

describe("Integration: Search Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("user can search for products and see results", async () => {
    // Setup: User lands on search page with query
    mockGet.mockReturnValue("running shoes");

    render(<SearchPage />);

    // Assert: Search header is displayed
    expect(
      screen.getByText('Search Results for "running shoes"'),
    ).toBeInTheDocument();

    // Assert: Loading state is shown initially
    const productGrid = screen.getByTestId("product-grid");
    expect(productGrid).toHaveAttribute("data-loading", "true");

    // Wait for results to load
    await waitFor(() => {
      expect(productGrid).toHaveAttribute("data-loading", "false");
    });

    // Assert: Products are displayed
    await waitFor(() => {
      expect(screen.getByText("Nike Air Max 270")).toBeInTheDocument();
      expect(screen.getByText("Adidas Ultraboost 22")).toBeInTheDocument();
      expect(screen.getByText("Puma RS-X3")).toBeInTheDocument();
    });
  });

  it("shows empty query message when no query provided", () => {
    mockGet.mockReturnValue("");

    render(<SearchPage />);

    expect(
      screen.getByText("Enter a search query to find products"),
    ).toBeInTheDocument();
  });

  it("handles query with special characters", async () => {
    mockGet.mockReturnValue("shoes & sneakers");

    render(<SearchPage />);

    await waitFor(() => {
      expect(
        screen.getByText('Search Results for "shoes & sneakers"'),
      ).toBeInTheDocument();
    });
  });
});
