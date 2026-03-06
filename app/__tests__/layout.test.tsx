import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import RootLayout, { metadata } from "../layout";

// Suppress console warnings for layout tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: Parameters<typeof console.error>) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("cannot be a child of")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

describe("RootLayout", () => {
  it("renders child components correctly", () => {
    const { getByTestId } = render(
      <RootLayout>
        <div data-testid="test-child">Child Component</div>
      </RootLayout>,
    );

    expect(getByTestId("test-child")).toHaveTextContent("Child Component");
  });

  it("renders multiple children correctly", () => {
    const { getByTestId } = render(
      <RootLayout>
        <div data-testid="child-1">First Child</div>
        <div data-testid="child-2">Second Child</div>
      </RootLayout>,
    );

    expect(getByTestId("child-1")).toBeInTheDocument();
    expect(getByTestId("child-2")).toBeInTheDocument();
  });

  it("renders children with proper structure", () => {
    const { container } = render(
      <RootLayout>
        <main data-testid="main-content">Main Content</main>
      </RootLayout>,
    );

    const mainContent = container.querySelector('[data-testid="main-content"]');
    expect(mainContent).toBeInTheDocument();
  });

  it("has correct metadata title", () => {
    expect(metadata.title).toBe("AI Product Search - Find Your Perfect Shoes");
  });

  it("has correct metadata description", () => {
    expect(metadata.description).toContain(
      "AI-powered semantic search for athletic footwear",
    );
  });
});
