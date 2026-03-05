import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SearchBar } from "@/components/SearchBar";
import { useRouter } from "next/navigation";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

describe("SearchBar", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  it("renders search input and button", () => {
    render(<SearchBar />);
    expect(
      screen.getByPlaceholderText("Search for shoes..."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Search" })).toBeInTheDocument();
  });

  it("renders with custom placeholder", () => {
    render(<SearchBar placeholder="Custom placeholder" />);
    expect(
      screen.getByPlaceholderText("Custom placeholder"),
    ).toBeInTheDocument();
  });

  it("renders with initial query", () => {
    render(<SearchBar initialQuery="Nike shoes" />);
    const input = screen.getByPlaceholderText(
      "Search for shoes...",
    ) as HTMLInputElement;
    expect(input.value).toBe("Nike shoes");
  });

  it("updates input value on change", () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText(
      "Search for shoes...",
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: "Running shoes" } });
    expect(input.value).toBe("Running shoes");
  });

  it("navigates to search page on button click", () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText("Search for shoes...");
    const button = screen.getByRole("button", { name: "Search" });

    fireEvent.change(input, { target: { value: "Nike" } });
    fireEvent.click(button);

    expect(mockPush).toHaveBeenCalledWith("/search?q=Nike");
  });

  it("navigates to search page on Enter key", () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText("Search for shoes...");

    fireEvent.change(input, { target: { value: "Adidas" } });
    fireEvent.keyPress(input, { key: "Enter", code: "Enter", charCode: 13 });

    expect(mockPush).toHaveBeenCalledWith("/search?q=Adidas");
  });

  it("does not navigate on other key press", () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText("Search for shoes...");

    fireEvent.change(input, { target: { value: "Test" } });
    fireEvent.keyPress(input, { key: "a", code: "KeyA", charCode: 97 });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("trims whitespace from query", () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText("Search for shoes...");
    const button = screen.getByRole("button", { name: "Search" });

    fireEvent.change(input, { target: { value: "  Nike  " } });
    fireEvent.click(button);

    expect(mockPush).toHaveBeenCalledWith("/search?q=Nike");
  });

  it("does not navigate with empty query", () => {
    render(<SearchBar />);
    const button = screen.getByRole("button", { name: "Search" });

    fireEvent.click(button);

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("disables button when query is empty", () => {
    render(<SearchBar />);
    const button = screen.getByRole("button", {
      name: "Search",
    }) as HTMLButtonElement;

    expect(button.disabled).toBe(true);
  });

  it("enables button when query is not empty", () => {
    render(<SearchBar />);
    const input = screen.getByPlaceholderText("Search for shoes...");
    const button = screen.getByRole("button", {
      name: "Search",
    }) as HTMLButtonElement;

    fireEvent.change(input, { target: { value: "Nike" } });

    expect(button.disabled).toBe(false);
  });
});
