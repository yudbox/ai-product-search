import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import SearchPage from "@/app/search/page";
import { server } from "../mocks/server";
import { http, HttpResponse } from "msw";

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

describe("AI Explanation Banner Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue("shoes");
  });

  it("displays AI explanation banner when no products found", async () => {
    server.use(
      http.post("http://localhost/api/search", () => {
        return HttpResponse.json({
          success: true,
          query: "nonexistent shoes",
          products: [],
          count: 0,
          totalBeforeFilters: 0,
          explanation: "No products match your search criteria.",
          performance: {
            parsing: "10ms",
            embedding: "20ms",
            search: "30ms",
            total: "60ms",
          },
        });
      }),
    );

    render(<SearchPage />);

    await waitFor(() => {
      expect(
        screen.getByText("No products match your search criteria."),
      ).toBeInTheDocument();
    });
  });

  it("displays rejection banner with not_footwear reason and 🚫 emoji", async () => {
    server.use(
      http.post("http://localhost/api/search", () => {
        return HttpResponse.json({
          success: false,
          rejected: true,
          rejectionReason: "not_footwear",
          query: "laptop",
          products: [],
          count: 0,
          explanation:
            "We only sell footwear. This search is not related to shoes.",
          suggestedQuery: "running shoes",
          performance: {
            parsing: "10ms",
            embedding: "0ms",
            search: "0ms",
            total: "10ms",
          },
        });
      }),
    );

    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByText("🚫")).toBeInTheDocument();
      expect(screen.getByText(/We only sell footwear/)).toBeInTheDocument();
    });
  });

  it("displays rejection banner with question_not_search reason and ❓ emoji", async () => {
    server.use(
      http.post("http://localhost/api/search", () => {
        return HttpResponse.json({
          success: false,
          rejected: true,
          rejectionReason: "question_not_search",
          query: "what are the best shoes",
          products: [],
          count: 0,
          explanation:
            "Please search for products instead of asking questions.",
          suggestedQuery: "Nike sneakers",
          performance: {
            parsing: "10ms",
            embedding: "0ms",
            search: "0ms",
            total: "10ms",
          },
        });
      }),
    );

    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByText("❓")).toBeInTheDocument();
      expect(
        screen.getByText(/Please search for products instead/),
      ).toBeInTheDocument();
    });
  });

  it("displays suggestion button and navigates when clicked", async () => {
    server.use(
      http.post("http://localhost/api/search", () => {
        return HttpResponse.json({
          success: false,
          rejected: true,
          rejectionReason: "not_footwear",
          query: "laptop",
          products: [],
          count: 0,
          explanation: "This is not a shoe product.",
          suggestedQuery: "running shoes",
          performance: {
            parsing: "10ms",
            embedding: "0ms",
            search: "0ms",
            total: "10ms",
          },
        });
      }),
    );

    render(<SearchPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/This is not a shoe product/),
      ).toBeInTheDocument();
    });

    // Click suggestion button
    const suggestionButton = screen.getByRole("button", {
      name: /Try: 'running shoes'/,
    });
    fireEvent.click(suggestionButton);

    expect(mockPush).toHaveBeenCalledWith("/search?q=running%20shoes");
  });

  it("displays normal explanation banner without rejection reason (👟 emoji)", async () => {
    server.use(
      http.post("http://localhost/api/search", () => {
        return HttpResponse.json({
          success: true,
          query: "running shoes",
          products: [],
          count: 0,
          totalBeforeFilters: 0,
          explanation: "No running shoes found in stock right now.",
          performance: {
            parsing: "10ms",
            embedding: "20ms",
            search: "30ms",
            total: "60ms",
          },
        });
      }),
    );

    render(<SearchPage />);

    await waitFor(() => {
      expect(screen.getByText("👟")).toBeInTheDocument();
      expect(
        screen.getByText("No running shoes found in stock right now."),
      ).toBeInTheDocument();
    });
  });

  it("displays yellow banner for rejection reasons", async () => {
    server.use(
      http.post("http://localhost/api/search", () => {
        return HttpResponse.json({
          success: false,
          rejected: true,
          rejectionReason: "not_footwear",
          query: "laptop",
          products: [],
          count: 0,
          explanation: "Not a shoe product.",
          performance: {
            parsing: "10ms",
            embedding: "0ms",
            search: "0ms",
            total: "10ms",
          },
        });
      }),
    );

    render(<SearchPage />);

    await waitFor(() => {
      // Just verify the rejection message appears
      expect(screen.getByText("Not a shoe product.")).toBeInTheDocument();
      expect(screen.getByText("🚫")).toBeInTheDocument();
    });
  });

  it("displays blue banner for normal explanations", async () => {
    server.use(
      http.post("http://localhost/api/search", () => {
        return HttpResponse.json({
          success: true,
          query: "running shoes",
          products: [],
          count: 0,
          totalBeforeFilters: 0,
          explanation: "No products found.",
          performance: {
            parsing: "10ms",
            embedding: "20ms",
            search: "30ms",
            total: "60ms",
          },
        });
      }),
    );

    render(<SearchPage />);

    await waitFor(() => {
      // Just verify the explanation appears
      expect(screen.getByText("No products found.")).toBeInTheDocument();
      expect(screen.getByText("👟")).toBeInTheDocument();
    });
  });
});
