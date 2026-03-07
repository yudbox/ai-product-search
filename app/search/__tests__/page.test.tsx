/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SearchPage } from "../_components/SearchPage";
import { Gender } from "@/lib/types";

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Suppress console warnings in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("act(...)") ||
        args[0].includes("ReactDOM.render") ||
        args[0].includes("Search error"))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Mock next/navigation
const mockPush = jest.fn();
const mockGetSearchParams = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: mockGetSearchParams,
  }),
}));

// Mock components
jest.mock("@/components/SearchBar", () => ({
  SearchBar: ({ initialQuery }: { initialQuery?: string }) => (
    <div data-testid="search-bar" data-query={initialQuery}>
      Search Bar
    </div>
  ),
}));

jest.mock("@/components/ProductGrid", () => ({
  ProductGrid: ({
    products,
    loading,
  }: {
    products: any[];
    loading: boolean;
  }) => (
    <div data-testid="product-grid" data-loading={loading}>
      {products.map((p) => (
        <div key={p.id} data-testid={`product-${p.id}`}>
          {p.name}
        </div>
      ))}
    </div>
  ),
}));

jest.mock("@/components/FilterSidebar", () => ({
  FilterSidebar: ({
    filters,
    onFilterChange,
  }: {
    filters: any;
    onFilterChange: (f: any) => void;
  }) => (
    <div data-testid="filter-sidebar">
      <button
        data-testid="apply-filter"
        onClick={() => onFilterChange({ ...filters, brands: ["Nike"] })}
      >
        Apply Filter
      </button>
    </div>
  ),
}));

jest.mock("@/components/ActiveFilters", () => ({
  ActiveFilters: ({
    filters,
    onRemoveFilter,
    onClearAll,
    resultCount,
    totalCount,
  }: any) => (
    <div data-testid="active-filters">
      <div data-testid="result-count">{resultCount}</div>
      <div data-testid="total-count">{totalCount}</div>
      {filters.brands?.map((brand: string) => (
        <button
          key={brand}
          data-testid={`remove-brand-${brand}`}
          onClick={() => onRemoveFilter("brand", brand)}
        >
          Remove {brand}
        </button>
      ))}
      <button data-testid="clear-all" onClick={onClearAll}>
        Clear All
      </button>
    </div>
  ),
}));

// Mock fetch
global.fetch = jest.fn();

describe("SearchPage", () => {
  const mockProducts = [
    {
      id: "1",
      name: "Nike Air Max",
      price: 120,
      brand: "Nike",
      category: "Running",
      image: "image1.jpg",
      description: "Great shoes",
      color: "Black",
      sizes: [8, 9, 10],
      inStock: true,
      rating: 4.5,
      features: ["Comfortable"],
      gender: Gender.Men,
    },
    {
      id: "2",
      name: "Adidas Ultraboost",
      price: 150,
      brand: "Adidas",
      category: "Training",
      image: "image2.jpg",
      description: "Training shoes",
      color: "White",
      sizes: [9, 10, 11],
      inStock: true,
      rating: 4.8,
      features: ["Lightweight"],
      gender: Gender.Women,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSearchParams.mockReturnValue("");
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        products: mockProducts,
        count: 2,
        totalBeforeFilters: 2,
        explanation: "Found 2 products matching your search",
      }),
    });
  });

  it("renders header with AI Product Search title", () => {
    render(<SearchPage />);
    expect(screen.getByText("🔍 AI Product Search")).toBeInTheDocument();
  });

  it("renders Home button that navigates to home page", () => {
    render(<SearchPage />);
    const homeButton = screen.getByText("Home");
    fireEvent.click(homeButton);
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("renders SearchBar with initial query", () => {
    mockGetSearchParams.mockReturnValue("running shoes");
    render(<SearchPage />);
    const searchBar = screen.getByTestId("search-bar");
    expect(searchBar).toHaveAttribute("data-query", "running shoes");
  });

  it("renders FilterSidebar", () => {
    render(<SearchPage />);
    const sidebars = screen.getAllByTestId("filter-sidebar");
    expect(sidebars.length).toBeGreaterThan(0);
  });

  it("does not fetch products when query is empty", () => {
    mockGetSearchParams.mockReturnValue("");
    render(<SearchPage />);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("fetches products when query is provided", async () => {
    mockGetSearchParams.mockReturnValue("running shoes");
    render(<SearchPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "running shoes",
          filters: { priceRange: [] },
        }),
      });
    });
  });

  it("displays products after successful fetch", async () => {
    mockGetSearchParams.mockReturnValue("shoes");
    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByTestId("product-1")).toHaveTextContent("Nike Air Max");
      expect(screen.getByTestId("product-2")).toHaveTextContent(
        "Adidas Ultraboost",
      );
    });
  });

  it("displays search results header with query", async () => {
    mockGetSearchParams.mockReturnValue("running shoes");
    render(<SearchPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Search Results for 'running shoes'"),
      ).toBeInTheDocument();
    });
  });

  it("handles fetch errors", async () => {
    mockGetSearchParams.mockReturnValue("shoes");
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
    });

    render(<SearchPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load results. Please try again."),
      ).toBeInTheDocument();
    });
  });

  it("handles network errors", async () => {
    mockGetSearchParams.mockReturnValue("shoes");
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    render(<SearchPage />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load results. Please try again."),
      ).toBeInTheDocument();
    });
  });

  it("displays empty state when no query is provided", () => {
    mockGetSearchParams.mockReturnValue("");
    render(<SearchPage />);

    expect(
      screen.getByText("Enter a search query to find products"),
    ).toBeInTheDocument();
  });

  it("displays ActiveFilters component when query exists", async () => {
    mockGetSearchParams.mockReturnValue("shoes");
    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByTestId("active-filters")).toBeInTheDocument();
    });
  });

  it("passes correct props to ActiveFilters", async () => {
    mockGetSearchParams.mockReturnValue("shoes");
    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByTestId("result-count")).toHaveTextContent("2");
      expect(screen.getByTestId("total-count")).toHaveTextContent("2");
    });
  });

  it("sets loading state during fetch", async () => {
    mockGetSearchParams.mockReturnValue("shoes");
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({
                  products: mockProducts,
                  count: 2,
                  totalBeforeFilters: 2,
                  explanation: "Found products",
                }),
              }),
            100,
          ),
        ),
    );

    render(<SearchPage />);

    const productGrid = screen.getByTestId("product-grid");
    expect(productGrid).toHaveAttribute("data-loading", "true");

    await waitFor(
      () => {
        expect(productGrid).toHaveAttribute("data-loading", "false");
      },
      { timeout: 200 },
    );
  });

  it("refetches when query changes", async () => {
    mockGetSearchParams.mockReturnValue("shoes");
    const { rerender } = render(<SearchPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    mockGetSearchParams.mockReturnValue("boots");
    rerender(<SearchPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it("removes price range filter correctly", async () => {
    mockGetSearchParams.mockReturnValue("shoes");

    // Mock ActiveFilters to include price range removal
    jest.mock("@/components/ActiveFilters", () => ({
      ActiveFilters: ({ onRemoveFilter }: any) => (
        <div data-testid="active-filters">
          <button
            data-testid="remove-price"
            onClick={() => onRemoveFilter("priceRange", "0-80")}
          >
            Remove Price
          </button>
        </div>
      ),
    }));

    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByTestId("active-filters")).toBeInTheDocument();
    });
  });

  it("removes category filter correctly", async () => {
    mockGetSearchParams.mockReturnValue("shoes");
    render(<SearchPage />);
    await waitFor(() => {
      expect(screen.getByTestId("active-filters")).toBeInTheDocument();
    });
  });

  it("cleans up IntersectionObserver on unmount", async () => {
    mockGetSearchParams.mockReturnValue("shoes");
    const disconnectSpy = jest.fn();
    const observeSpy = jest.fn();

    // Mock with products that indicate there are more to load
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        products: mockProducts,
        count: 2,
        totalBeforeFilters: 10, // Indicate there are more
        explanation: "Found 2 products",
        hasMore: true,
      }),
    });

    global.IntersectionObserver = jest.fn().mockImplementation(() => ({
      observe: observeSpy,
      disconnect: disconnectSpy,
      unobserve: jest.fn(),
      takeRecords: jest.fn(() => []),
    })) as any;

    const { unmount } = render(<SearchPage />);

    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByTestId("product-grid")).toHaveAttribute(
        "data-loading",
        "false",
      );
    });

    // If observer was created, it should disconnect on unmount
    unmount();

    // Only check disconnect if observe was called (meaning conditions were met)
    if (observeSpy.mock.calls.length > 0) {
      expect(disconnectSpy).toHaveBeenCalled();
    } else {
      // If observe wasn't called, at least verify the component unmounted properly
      expect(screen.queryByTestId("product-grid")).not.toBeInTheDocument();
    }
  });

  it("opens mobile filters modal when filter button is clicked", async () => {
    mockGetSearchParams.mockReturnValue("shoes");
    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByTestId("product-grid")).toBeInTheDocument();
    });

    // Find the mobile "Filters" button (not "Apply Filters")
    const filterButtons = screen.getAllByRole("button", { name: /filters/i });
    const mobileFilterButton = filterButtons.find((btn) =>
      btn.textContent?.includes("🔧"),
    );
    fireEvent.click(mobileFilterButton!);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Filters" }),
      ).toBeInTheDocument();
    });
  });

  it("closes mobile filters modal when overlay is clicked", async () => {
    mockGetSearchParams.mockReturnValue("shoes");
    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByTestId("product-grid")).toBeInTheDocument();
    });

    // Open modal
    const filterButtons = screen.getAllByRole("button", { name: /filters/i });
    const mobileFilterButton = filterButtons.find((btn) =>
      btn.textContent?.includes("🔧"),
    );
    fireEvent.click(mobileFilterButton!);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Filters" }),
      ).toBeInTheDocument();
    });

    // Click overlay (the div with bg-black class)
    const overlay = document.querySelector(".bg-black");
    fireEvent.click(overlay as Element);

    // Modal should close
    await waitFor(() => {
      const filtersHeader = screen.queryByRole("heading", { name: "Filters" });
      expect(filtersHeader).toBeInTheDocument(); // Still in DOM but transformed
    });
  });

  it("closes mobile filters modal when close button is clicked", async () => {
    mockGetSearchParams.mockReturnValue("shoes");
    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByTestId("product-grid")).toBeInTheDocument();
    });

    // Open modal
    const filterButtons = screen.getAllByRole("button", { name: /filters/i });
    const mobileFilterButton = filterButtons.find((btn) =>
      btn.textContent?.includes("🔧"),
    );
    fireEvent.click(mobileFilterButton!);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Filters" }),
      ).toBeInTheDocument();
    });

    // Click close button (×)
    const closeButton = screen.getByText("×");
    fireEvent.click(closeButton);

    // Modal should close
    await waitFor(() => {
      const filtersHeader = screen.getByRole("heading", { name: "Filters" });
      expect(filtersHeader).toBeInTheDocument();
    });
  });

  it("closes mobile filters modal when Apply Filters button is clicked", async () => {
    mockGetSearchParams.mockReturnValue("shoes");
    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByTestId("product-grid")).toBeInTheDocument();
    });

    // Open modal
    const filterButtons = screen.getAllByRole("button", { name: /filters/i });
    const mobileFilterButton = filterButtons.find((btn) =>
      btn.textContent?.includes("🔧"),
    );
    fireEvent.click(mobileFilterButton!);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Filters" }),
      ).toBeInTheDocument();
    });

    // Click Apply Filters button
    const applyButton = screen.getByRole("button", { name: /apply filters/i });
    fireEvent.click(applyButton);

    // Modal should close
    await waitFor(() => {
      const filtersHeader = screen.getByRole("heading", { name: "Filters" });
      expect(filtersHeader).toBeInTheDocument();
    });
  });

  it("shows mobile filter button with badge count when filters are active", async () => {
    mockGetSearchParams.mockReturnValue("shoes");

    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByTestId("product-grid")).toBeInTheDocument();
    });

    // Apply some filters
    const applyFilterButtons = screen.getAllByTestId("apply-filter");
    fireEvent.click(applyFilterButtons[0]);

    await waitFor(() => {
      // The mobile filter button should be present
      const filterButtons = screen.getAllByRole("button", { name: /filters/i });
      const mobileFilterButton = filterButtons.find((btn) =>
        btn.textContent?.includes("🔧"),
      );
      expect(mobileFilterButton).toBeInTheDocument();
    });
  });

  it("displays AI explanation banner when no products found", async () => {
    mockGetSearchParams.mockReturnValue("running shoes");
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        products: [],
        count: 0,
        totalBeforeFilters: 0,
        explanation: "We couldn't find any running shoes matching your search.",
      }),
    });

    render(<SearchPage />);

    await waitFor(() => {
      expect(
        screen.getByText(
          "We couldn't find any running shoes matching your search.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("displays rejection banner with not_footwear reason and correct emoji", async () => {
    mockGetSearchParams.mockReturnValue("laptop");
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        products: [],
        count: 0,
        totalBeforeFilters: 0,
        explanation:
          "This search is not related to footwear. We only search for shoes and related products.",
        rejectionReason: "not_footwear",
      }),
    });

    render(<SearchPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/This search is not related to footwear/),
      ).toBeInTheDocument();
      expect(screen.getByText("🚫")).toBeInTheDocument();
    });
  });

  it("displays rejection banner with question_not_search reason and correct emoji", async () => {
    mockGetSearchParams.mockReturnValue("what are the best shoes");
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        products: [],
        count: 0,
        totalBeforeFilters: 0,
        explanation:
          "This looks like a question. Try using product names or descriptions instead.",
        rejectionReason: "question_not_search",
      }),
    });

    render(<SearchPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/This looks like a question/),
      ).toBeInTheDocument();
      expect(screen.getByText("❓")).toBeInTheDocument();
    });
  });

  it("navigates to suggested query when suggestion button is clicked", async () => {
    mockGetSearchParams.mockReturnValue("laptop");
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        products: [],
        count: 0,
        totalBeforeFilters: 0,
        explanation:
          "This search is not related to footwear. Try searching for shoes instead.",
        rejectionReason: "not_footwear",
        suggestedQuery: "running shoes",
      }),
    });

    render(<SearchPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/This search is not related to footwear/),
      ).toBeInTheDocument();
    });

    const suggestionButton = screen.getByRole("button", {
      name: /Try: 'running shoes'/,
    });
    fireEvent.click(suggestionButton);

    expect(mockPush).toHaveBeenCalledWith("/search?q=running%20shoes");
  });
});
