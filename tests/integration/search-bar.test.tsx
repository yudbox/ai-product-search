import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("Integration: SearchBar Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("user can type in search input and click search button", async () => {
    const user = userEvent.setup();
    render(<Home />);

    // Find search input
    const searchInput = screen.getByPlaceholderText("Search for shoes...");
    expect(searchInput).toBeInTheDocument();

    // Type query
    await user.type(searchInput, "running shoes");

    // Find and click search button
    const searchButton = screen.getByRole("button", { name: /search/i });
    await user.click(searchButton);

    // Router should be called with correct query
    expect(mockPush).toHaveBeenCalledWith("/search?q=running%20shoes");
  });

  it("user can press Enter to search", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const searchInput = screen.getByPlaceholderText("Search for shoes...");

    // Type query and press Enter
    await user.type(searchInput, "basketball shoes{Enter}");

    // Router should be called
    expect(mockPush).toHaveBeenCalledWith("/search?q=basketball%20shoes");
  });

  it("search button is disabled when input is empty", () => {
    render(<Home />);

    const searchButton = screen.getByRole("button", { name: /search/i });

    // Button should be disabled when empty
    expect(searchButton).toBeDisabled();
  });

  it("search button becomes enabled when text is entered", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const searchInput = screen.getByPlaceholderText("Search for shoes...");
    const searchButton = screen.getByRole("button", { name: /search/i });

    // Initially disabled
    expect(searchButton).toBeDisabled();

    // Type something
    await user.type(searchInput, "shoes");

    // Should become enabled
    expect(searchButton).toBeEnabled();
  });

  it("trims whitespace from query before searching", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const searchInput = screen.getByPlaceholderText("Search for shoes...");

    // Type query with extra spaces
    await user.type(searchInput, "  running shoes  {Enter}");

    // Should trim spaces
    expect(mockPush).toHaveBeenCalledWith("/search?q=running%20shoes");
  });

  it("does not search when only spaces are entered", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const searchInput = screen.getByPlaceholderText("Search for shoes...");
    const searchButton = screen.getByRole("button", { name: /search/i });

    // Type only spaces
    await user.type(searchInput, "   ");

    // Button should still be disabled
    expect(searchButton).toBeDisabled();

    // Pressing Enter should not trigger search
    fireEvent.keyPress(searchInput, { key: "Enter", code: "Enter" });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("updates input value when user types", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const searchInput = screen.getByPlaceholderText(
      "Search for shoes...",
    ) as HTMLInputElement;

    // Type query
    await user.type(searchInput, "nike");

    // Input value should be updated
    expect(searchInput.value).toBe("nike");
  });

  it("handles special characters in search query", async () => {
    const user = userEvent.setup();
    render(<Home />);

    const searchInput = screen.getByPlaceholderText("Search for shoes...");

    // Type query with special characters
    await user.type(searchInput, "shoes & boots{Enter}");

    // Should properly encode special characters
    expect(mockPush).toHaveBeenCalledWith("/search?q=shoes%20%26%20boots");
  });
});
