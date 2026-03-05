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

describe("Integration: Filter Application Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue("shoes");
  });

  it("user can apply brand filter and see filtered results", async () => {
    render(<SearchPage />);

    // Wait for initial results (3 products should be visible)
    await waitFor(() => {
      expect(screen.getByText("Nike Air Max 270")).toBeInTheDocument();
      expect(screen.getByText("Adidas Ultraboost 22")).toBeInTheDocument();
      expect(screen.getByText("Puma RS-X3")).toBeInTheDocument();
    });

    // Apply Nike filter
    const applyFilterButton = screen.getByTestId("apply-filter");
    fireEvent.click(applyFilterButton);

    // Wait for filtered results - result-count appears after filter applied
    await waitFor(() => {
      const updatedCount = screen.getByTestId("result-count");
      expect(updatedCount).toHaveTextContent("1");
    });

    // Should show only Nike product
    await waitFor(() => {
      expect(screen.getByText("Nike Air Max 270")).toBeInTheDocument();
    });

    // Other products should not be visible
    expect(screen.queryByText("Puma RS-X3")).not.toBeInTheDocument();
  });

  it("user can remove filter and see all results again", async () => {
    render(<SearchPage />);

    // Wait for initial results (3 products)
    await waitFor(() => {
      expect(screen.getByText("Nike Air Max 270")).toBeInTheDocument();
      expect(screen.getByText("Adidas Ultraboost 22")).toBeInTheDocument();
      expect(screen.getByText("Puma RS-X3")).toBeInTheDocument();
    });

    // Apply filter
    const applyFilterButton = screen.getByTestId("apply-filter");
    fireEvent.click(applyFilterButton);

    // After applying filter - result-count appears and shows 1
    await waitFor(() => {
      expect(screen.getByTestId("result-count")).toHaveTextContent("1");
    });

    // Remove filter by clicking badge
    await waitFor(() => {
      const removeButton = screen.getByTestId("remove-brand-Nike");
      expect(removeButton).toBeInTheDocument();
      fireEvent.click(removeButton);
    });

    // After removing filter - all 3 products should be visible again
    await waitFor(() => {
      expect(screen.getByText("Nike Air Max 270")).toBeInTheDocument();
      expect(screen.getByText("Adidas Ultraboost 22")).toBeInTheDocument();
      expect(screen.getByText("Puma RS-X3")).toBeInTheDocument();
    });
  });

  it("shows active filter badges", async () => {
    render(<SearchPage />);

    // Wait for initial products to load
    await waitFor(() => {
      expect(screen.getByText("Nike Air Max 270")).toBeInTheDocument();
    });

    // Apply filter
    const applyFilterButton = screen.getByTestId("apply-filter");
    fireEvent.click(applyFilterButton);

    // Active filter badge should appear after applying filter
    await waitFor(() => {
      expect(screen.getByTestId("remove-brand-Nike")).toBeInTheDocument();
    });
  });
});
