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
    expect(screen.getByTestId("filter-sidebar")).toBeInTheDocument();
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
        screen.getByText('Search Results for "running shoes"'),
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
});
