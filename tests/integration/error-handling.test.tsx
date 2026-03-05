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

describe("Integration: Error Handling Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("displays error message when API fails", async () => {
    // Use special query that triggers error in MSW handler
    mockGet.mockReturnValue("trigger-error");

    render(<SearchPage />);

    // Wait for error message to appear
    await waitFor(() => {
      expect(
        screen.getByText("Failed to load results. Please try again."),
      ).toBeInTheDocument();
    });

    // Should not show results
    expect(screen.queryByText("Nike Air Max 270")).not.toBeInTheDocument();
  });

  it("page remains functional after error", async () => {
    mockGet.mockReturnValue("trigger-error");

    render(<SearchPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load results. Please try again."),
      ).toBeInTheDocument();
    });

    // UI should still be rendered
    expect(screen.getByText("🔍 AI Product Search")).toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("does not crash when API returns unexpected response", async () => {
    mockGet.mockReturnValue("shoes");

    render(<SearchPage />);

    // Component should render without crashing
    expect(screen.getByText("🔍 AI Product Search")).toBeInTheDocument();

    // Should eventually show results or error, not crash
    await waitFor(
      () => {
        const hasResults = screen.queryByText("Nike Air Max 270");
        const hasError = screen.queryByText(
          "Failed to load results. Please try again.",
        );
        expect(hasResults || hasError).toBeTruthy();
      },
      { timeout: 5000 },
    );
  });

  it("shows appropriate UI state during error", async () => {
    mockGet.mockReturnValue("trigger-error");

    render(<SearchPage />);

    // Loading state should appear first
    const productGrid = screen.getByTestId("product-grid");
    expect(productGrid).toHaveAttribute("data-loading", "true");

    // Then error state
    await waitFor(() => {
      expect(productGrid).toHaveAttribute("data-loading", "false");
      expect(
        screen.getByText("Failed to load results. Please try again."),
      ).toBeInTheDocument();
    });
  });
});
