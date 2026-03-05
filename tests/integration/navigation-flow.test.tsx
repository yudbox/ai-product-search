import { render, screen, fireEvent } from "@testing-library/react";
import SearchPage from "@/app/search/page";
import Home from "@/app/page";

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

// Mock next/link
jest.mock("next/link", () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return (
      <a
        href={href}
        onClick={(e) => {
          e.preventDefault();
          mockPush(href);
        }}
      >
        {children}
      </a>
    );
  };
});

describe("Integration: Navigation Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("user can navigate from home to search page via example query", () => {
    render(<Home />);

    // Find and click example query button
    const exampleButton = screen.getByText("comfortable running shoes");
    fireEvent.click(exampleButton);

    // Router should be called with correct URL
    expect(mockPush).toHaveBeenCalledWith(
      "/search?q=comfortable%20running%20shoes",
    );
  });

  it("user can navigate back to home from search page", () => {
    mockGet.mockReturnValue("shoes");

    render(<SearchPage />);

    // Find and click home button
    const homeButton = screen.getByText("Home");
    fireEvent.click(homeButton);

    // Router should navigate to home
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("all example queries on home page are clickable", () => {
    render(<Home />);

    const exampleQueries = [
      "comfortable running shoes",
      "basketball shoes under $150",
      "waterproof hiking boots",
      "lightweight training shoes",
      "casual sneakers for daily wear",
    ];

    exampleQueries.forEach((query) => {
      const button = screen.getByText(query);
      expect(button).toBeInTheDocument();

      fireEvent.click(button);
      expect(mockPush).toHaveBeenCalledWith(
        `/search?q=${encodeURIComponent(query)}`,
      );
    });
  });

  it("search page displays correct query from URL params", () => {
    const testQuery = "running shoes";
    mockGet.mockReturnValue(testQuery);

    render(<SearchPage />);

    expect(
      screen.getByText(`Search Results for "${testQuery}"`),
    ).toBeInTheDocument();
  });
});
