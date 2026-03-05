import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ProductGrid } from "@/components/ProductGrid";
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

describe("ProductGrid", () => {
  const mockProducts: Product[] = [
    {
      id: "1",
      name: "Nike Air Max",
      brand: "Nike",
      price: 120,
      category: "Running",
      rating: 4.5,
      description: "Test description",
      features: ["Feature 1"],
      image: "https://example.com/image1.jpg",
      color: "Black",
      sizes: [8, 9, 10],
      gender: Gender.Men,
      inStock: true,
    },
    {
      id: "2",
      name: "Adidas Ultraboost",
      brand: "Adidas",
      price: 150,
      category: "Running",
      rating: 4.8,
      description: "Test description 2",
      features: ["Feature 2"],
      image: "https://example.com/image2.jpg",
      color: "White",
      sizes: [9, 10, 11],
      gender: Gender.Women,
      inStock: true,
    },
  ];

  it("renders products grid", () => {
    render(<ProductGrid products={mockProducts} />);
    expect(screen.getByText("Nike Air Max")).toBeInTheDocument();
    expect(screen.getByText("Adidas Ultraboost")).toBeInTheDocument();
  });

  it("renders loading skeleton when loading", () => {
    const { container } = render(<ProductGrid products={[]} loading={true} />);
    const skeletons = container.querySelectorAll(".animate-shimmer");
    expect(skeletons.length).toBeGreaterThan(0); // Should have shimmer animations

    // Verify ProductCardSkeleton components are rendered
    const skeletonCards = container.querySelectorAll(
      "[class*='rounded-lg border border-gray-200']",
    );
    expect(skeletonCards.length).toBe(12);
  });

  it("renders empty state when no products", () => {
    render(<ProductGrid products={[]} />);
    expect(screen.getByText("No products found")).toBeInTheDocument();
    expect(
      screen.getByText("Try adjusting your search or filters"),
    ).toBeInTheDocument();
  });

  it("renders empty state suggestions", () => {
    render(<ProductGrid products={[]} />);
    expect(screen.getByText("• Use different keywords")).toBeInTheDocument();
    expect(screen.getByText("• Remove some filters")).toBeInTheDocument();
    expect(screen.getByText("• Try broader search terms")).toBeInTheDocument();
  });

  it("renders correct number of products", () => {
    render(<ProductGrid products={mockProducts} />);
    const productCards = screen.getAllByText(/Nike|Adidas/);
    expect(productCards.length).toBeGreaterThanOrEqual(2);
  });

  it("does not render empty state when products exist", () => {
    render(<ProductGrid products={mockProducts} />);
    expect(screen.queryByText("No products found")).not.toBeInTheDocument();
  });
});
