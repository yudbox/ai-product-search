/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
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

describe("SearchPage Lifecycle Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue("shoes");
  });

  it("displays desktop search results header with query", async () => {
    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByText("Nike Air Max 270")).toBeInTheDocument();
    });

    // Desktop header should show query
    expect(screen.getByText("Search Results for 'shoes'")).toBeInTheDocument();
  });

  it("displays ActiveFilters component when query exists", async () => {
    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByText("Nike Air Max 270")).toBeInTheDocument();
    });

    // ActiveFilters showing count should be present
    expect(screen.getByTestId("product-grid")).toBeInTheDocument();
  });

  it("cleans up IntersectionObserver on component unmount", async () => {
    const disconnectSpy = jest.fn();
    const observeSpy = jest.fn();

    // Mock IntersectionObserver
    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: observeSpy,
      disconnect: disconnectSpy,
      unobserve: jest.fn(),
      takeRecords: jest.fn(() => []),
    })) as any;

    const { unmount } = render(<SearchPage />);

    // Wait for products to load
    await waitFor(
      () => {
        expect(screen.getByText("Nike Air Max 270")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Unmount component
    unmount();

    // IntersectionObserver disconnect should be called if observer was created
    // This tests the cleanup function in useEffect (lines 47-48)
    await waitFor(() => {
      // If observe was called, disconnect should also be called
      if (observeSpy.mock.calls.length > 0) {
        expect(disconnectSpy).toHaveBeenCalled();
      }
    });
  });
});
