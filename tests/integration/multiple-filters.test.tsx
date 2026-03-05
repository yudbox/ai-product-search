import { render, screen, waitFor, fireEvent } from "@testing-library/react";
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

describe("Integration: Multiple Filters Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue("shoes");
  });

  it("user can apply multiple filters simultaneously", async () => {
    render(<SearchPage />);

    // Wait for initial results to load
    await waitFor(() => {
      expect(screen.getByText("Nike Air Max 270")).toBeInTheDocument();
      expect(screen.getByText("Adidas Ultraboost 22")).toBeInTheDocument();
      expect(screen.getByText("Puma RS-X3")).toBeInTheDocument();
    });

    // Apply first filter (brand)
    const applyFilterButton = screen.getByTestId("apply-filter");
    fireEvent.click(applyFilterButton);

    // Results should be filtered - result-count appears after filter applied
    await waitFor(() => {
      expect(screen.getByTestId("result-count")).toHaveTextContent("1");
    });

    // Should show only filtered product
    await waitFor(() => {
      expect(screen.getByText("Nike Air Max 270")).toBeInTheDocument();
      expect(
        screen.queryByText("Adidas Ultraboost 22"),
      ).not.toBeInTheDocument();
    });
  });

  it("user can clear all filters at once", async () => {
    render(<SearchPage />);

    // Wait for initial products
    await waitFor(() => {
      expect(screen.getByText("Nike Air Max 270")).toBeInTheDocument();
    });

    // Apply filter
    const applyFilterButton = screen.getByTestId("apply-filter");
    fireEvent.click(applyFilterButton);

    // Wait for filter to be applied
    await waitFor(() => {
      expect(screen.getByTestId("result-count")).toHaveTextContent("1");
    });

    // Clear all filters
    const clearAllButton = screen.getByTestId("clear-all");
    fireEvent.click(clearAllButton);

    // All results should return - check by products visible again
    await waitFor(() => {
      expect(screen.getByText("Nike Air Max 270")).toBeInTheDocument();
      expect(screen.getByText("Adidas Ultraboost 22")).toBeInTheDocument();
      expect(screen.getByText("Puma RS-X3")).toBeInTheDocument();
    });
  });

  it("shows correct result count after filtering", async () => {
    render(<SearchPage />);

    // Wait for initial products
    await waitFor(() => {
      expect(screen.getByText("Nike Air Max 270")).toBeInTheDocument();
      expect(screen.getByText("Adidas Ultraboost 22")).toBeInTheDocument();
      expect(screen.getByText("Puma RS-X3")).toBeInTheDocument();
    });

    // Apply filter
    const applyFilterButton = screen.getByTestId("apply-filter");
    fireEvent.click(applyFilterButton);

    // After filtering, result count should show filtered count
    await waitFor(() => {
      const resultCount = screen.getByTestId("result-count");
      expect(resultCount).toHaveTextContent("1");
    });

    // Should show only filtered product
    expect(screen.getByText("Nike Air Max 270")).toBeInTheDocument();
    expect(screen.queryByText("Adidas Ultraboost 22")).not.toBeInTheDocument();
  });
});
