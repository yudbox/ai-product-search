/* eslint-disable @typescript-eslint/no-explicit-any */ import {
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import SearchPageRoute from "../page";

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

// Mock fetch
global.fetch = jest.fn();

describe("SearchPageRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSearchParams.mockReturnValue("");
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        products: [],
        count: 0,
        totalBeforeFilters: 0,
        explanation: "No products found",
      }),
    });
  });

  it("renders without crashing", () => {
    render(<SearchPageRoute />);
    expect(screen.getByText("🔍 AI Product Search")).toBeInTheDocument();
  });

  it("renders SearchPage component", () => {
    render(<SearchPageRoute />);

    // SearchPage should render with its header
    expect(screen.getByText("🔍 AI Product Search")).toBeInTheDocument();
  });

  it("renders with Suspense wrapper", async () => {
    render(<SearchPageRoute />);

    await waitFor(() => {
      // Should eventually show the main content
      expect(screen.getByText("🔍 AI Product Search")).toBeInTheDocument();
    });
  });

  it("contains Home button from SearchPage", () => {
    render(<SearchPageRoute />);

    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("contains search functionality", async () => {
    mockGetSearchParams.mockReturnValue("test query");

    render(<SearchPageRoute />);

    await waitFor(() => {
      // SearchPage should display results header when query exists
      expect(
        screen.getByText("Search Results for 'test query'"),
      ).toBeInTheDocument();
    });
  });
});
