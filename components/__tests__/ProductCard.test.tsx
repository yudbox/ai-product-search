/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ProductCard } from "@/components/ProductCard";
import { Product, Gender } from "@/lib/types";

// Suppress console warnings in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes("non-boolean attribute")
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

describe("ProductCard", () => {
  const mockProduct: Product = {
    id: "1",
    name: "Test Shoe",
    brand: "Nike",
    price: 120,
    category: "Running",
    rating: 4.5,
    description: "Test description",
    features: ["Feature 1", "Feature 2"],
    image: "https://example.com/image.jpg",
    color: "Black",
    sizes: [8, 9, 10, 11],
    gender: Gender.Unisex,
    inStock: true,
  };

  it("renders product name", () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText("Test Shoe")).toBeInTheDocument();
  });

  it("renders product price", () => {
    render(<ProductCard product={mockProduct} />);
    expect(screen.getByText("$120")).toBeInTheDocument();
  });
});
