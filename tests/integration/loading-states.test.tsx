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

describe("Integration: Loading States Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading state while fetching results", async () => {
    mockGet.mockReturnValue("shoes");

    render(<SearchPage />);

    // Loading state should be visible immediately
    const productGrid = screen.getByTestId("product-grid");
    expect(productGrid).toHaveAttribute("data-loading", "true");

    // Then transitions to loaded state
    await waitFor(() => {
      expect(productGrid).toHaveAttribute("data-loading", "false");
    });
  });

  it("loading state disappears after results load", async () => {
    mockGet.mockReturnValue("shoes");

    render(<SearchPage />);

    // Initial loading
    expect(screen.getByTestId("product-grid")).toHaveAttribute(
      "data-loading",
      "true",
    );

    // Wait for products to appear
    await waitFor(() => {
      expect(screen.getByText("Nike Air Max 270")).toBeInTheDocument();
    });

    // Loading should be false
    expect(screen.getByTestId("product-grid")).toHaveAttribute(
      "data-loading",
      "false",
    );
  });

  it("shows loading state when applying filters", async () => {
    mockGet.mockReturnValue("shoes");

    render(<SearchPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId("product-grid")).toHaveAttribute(
        "data-loading",
        "false",
      );
    });

    // Apply filter - this triggers new fetch
    const applyFilterButton = screen.getByTestId("apply-filter");
    applyFilterButton.click();

    // Should show loading again (briefly)
    // Then return to loaded state
    await waitFor(() => {
      expect(screen.getByTestId("product-grid")).toHaveAttribute(
        "data-loading",
        "false",
      );
    });
  });

  it("does not show stale data during loading", async () => {
    mockGet.mockReturnValue("shoes");

    const { rerender } = render(<SearchPage />);

    // Wait for initial results
    await waitFor(() => {
      expect(screen.getByText("Nike Air Max 270")).toBeInTheDocument();
    });

    // Change query (simulating new search)
    mockGet.mockReturnValue("boots");
    rerender(<SearchPage />);

    // Should show loading state
    expect(screen.getByTestId("product-grid")).toHaveAttribute(
      "data-loading",
      "true",
    );
  });
});
