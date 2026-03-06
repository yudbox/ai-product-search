import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import Home from "../page";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock next/link
jest.mock("next/link", () => {
  const MockLink = ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => {
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
  MockLink.displayName = "MockLink";
  return MockLink;
});

// Mock SearchBar component
jest.mock("@/components/SearchBar", () => ({
  SearchBar: ({ autoFocus }: { autoFocus?: boolean }) => (
    <div data-testid="search-bar" data-autofocus={autoFocus}>
      Search Bar
    </div>
  ),
}));

describe("Home Page", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders main heading", () => {
    render(<Home />);
    expect(screen.getByText("Find Your Perfect Shoes")).toBeInTheDocument();
  });

  it("renders AI Product Search title", () => {
    render(<Home />);
    expect(screen.getByText("🔍 AI Product Search")).toBeInTheDocument();
  });

  it("renders portfolio project label", () => {
    render(<Home />);
    expect(screen.getByText("Portfolio Project")).toBeInTheDocument();
  });

  it("renders subtitle", () => {
    render(<Home />);
    expect(
      screen.getByText("AI-powered semantic search for athletic footwear"),
    ).toBeInTheDocument();
  });

  it("renders SearchBar with autoFocus", () => {
    render(<Home />);
    const searchBar = screen.getByTestId("search-bar");
    expect(searchBar).toBeInTheDocument();
    expect(searchBar).toHaveAttribute("data-autofocus", "true");
  });

  it("renders all example queries", () => {
    render(<Home />);
    expect(screen.getByText("comfortable running shoes")).toBeInTheDocument();
    expect(screen.getByText("basketball shoes under $150")).toBeInTheDocument();
    expect(screen.getByText("waterproof hiking boots")).toBeInTheDocument();
    expect(screen.getByText("lightweight training shoes")).toBeInTheDocument();
    expect(
      screen.getByText("casual sneakers for daily wear"),
    ).toBeInTheDocument();
  });

  it("navigates to search page when example query is clicked", () => {
    render(<Home />);
    const exampleButton = screen.getByText("comfortable running shoes");
    fireEvent.click(exampleButton);

    expect(mockPush).toHaveBeenCalledWith(
      "/search?q=comfortable%20running%20shoes",
    );
  });

  it("encodes special characters in query URL", () => {
    render(<Home />);
    const exampleButton = screen.getByText("basketball shoes under $150");
    fireEvent.click(exampleButton);

    expect(mockPush).toHaveBeenCalledWith(
      "/search?q=basketball%20shoes%20under%20%24150",
    );
  });

  it("renders all three feature cards", () => {
    render(<Home />);
    expect(screen.getByText("Semantic Search")).toBeInTheDocument();
    expect(screen.getByText("200+ Products")).toBeInTheDocument();
    expect(screen.getByText("Smart Filters")).toBeInTheDocument();
  });

  it("renders feature card descriptions", () => {
    render(<Home />);
    expect(
      screen.getByText(
        "AI understands meaning, not just keywords. Search naturally.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Curated collection of athletic shoes from top brands."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Filter by price, brand, category, and more."),
    ).toBeInTheDocument();
  });

  it("renders feature emojis", () => {
    const { container } = render(<Home />);
    const emojiDivs = container.querySelectorAll(".text-3xl");
    expect(emojiDivs.length).toBeGreaterThanOrEqual(3);
  });

  it("renders try these searches section", () => {
    render(<Home />);
    expect(screen.getByText("💡 Try these searches:")).toBeInTheDocument();
  });
});
