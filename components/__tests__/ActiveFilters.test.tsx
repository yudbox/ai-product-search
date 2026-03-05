import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ActiveFilters } from "@/components/ActiveFilters";
import { SearchFilters } from "@/lib/types";

describe("ActiveFilters", () => {
  const mockOnRemoveFilter = jest.fn();
  const mockOnClearAll = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when no filters are active", () => {
    const filters: SearchFilters = {};
    const { container } = render(
      <ActiveFilters
        filters={filters}
        onRemoveFilter={mockOnRemoveFilter}
        onClearAll={mockOnClearAll}
        resultCount={10}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders active price filters", () => {
    const filters: SearchFilters = {
      priceRange: ["0-80"],
    };
    render(
      <ActiveFilters
        filters={filters}
        onRemoveFilter={mockOnRemoveFilter}
        onClearAll={mockOnClearAll}
        resultCount={10}
      />,
    );

    expect(screen.getByText("$0 - $80")).toBeInTheDocument();
  });

  it("renders active brand filters", () => {
    const filters: SearchFilters = {
      brands: ["Nike", "Adidas"],
    };
    render(
      <ActiveFilters
        filters={filters}
        onRemoveFilter={mockOnRemoveFilter}
        onClearAll={mockOnClearAll}
        resultCount={10}
      />,
    );

    expect(screen.getByText("Nike")).toBeInTheDocument();
    expect(screen.getByText("Adidas")).toBeInTheDocument();
  });

  it("renders active category filters", () => {
    const filters: SearchFilters = {
      categories: ["Running Shoes"],
    };
    render(
      <ActiveFilters
        filters={filters}
        onRemoveFilter={mockOnRemoveFilter}
        onClearAll={mockOnClearAll}
        resultCount={10}
      />,
    );

    expect(screen.getByText("Running Shoes")).toBeInTheDocument();
  });

  it("displays result count", () => {
    const filters: SearchFilters = {
      brands: ["Nike"],
    };
    const { container } = render(
      <ActiveFilters
        filters={filters}
        onRemoveFilter={mockOnRemoveFilter}
        onClearAll={mockOnClearAll}
        resultCount={5}
      />,
    );

    expect(container.textContent).toContain("5 products found");
  });

  it("renders clear all button", () => {
    const filters: SearchFilters = {
      brands: ["Nike"],
    };
    render(
      <ActiveFilters
        filters={filters}
        onRemoveFilter={mockOnRemoveFilter}
        onClearAll={mockOnClearAll}
        resultCount={10}
      />,
    );

    expect(screen.getByText("Clear all filters")).toBeInTheDocument();
  });

  it("calls onClearAll when clear all is clicked", () => {
    const filters: SearchFilters = {
      brands: ["Nike"],
    };
    render(
      <ActiveFilters
        filters={filters}
        onRemoveFilter={mockOnRemoveFilter}
        onClearAll={mockOnClearAll}
        resultCount={10}
      />,
    );

    const clearButton = screen.getByText("Clear all filters");
    fireEvent.click(clearButton);

    expect(mockOnClearAll).toHaveBeenCalled();
  });

  it("calls onRemoveFilter when filter tag is clicked", () => {
    const filters: SearchFilters = {
      brands: ["Nike"],
    };
    render(
      <ActiveFilters
        filters={filters}
        onRemoveFilter={mockOnRemoveFilter}
        onClearAll={mockOnClearAll}
        resultCount={10}
      />,
    );

    const removeButtons = screen.getAllByText("✕");
    fireEvent.click(removeButtons[0]);

    expect(mockOnRemoveFilter).toHaveBeenCalledWith("brand", "Nike");
  });

  it("shows brand conflict warning", () => {
    const filters: SearchFilters = {
      brands: ["Adidas"],
    };
    const { container } = render(
      <ActiveFilters
        filters={filters}
        onRemoveFilter={mockOnRemoveFilter}
        onClearAll={mockOnClearAll}
        resultCount={10}
        searchQuery="Nike shoes"
      />,
    );

    expect(screen.getByText(/You searched for/)).toBeInTheDocument();
    expect(container.textContent).toContain("Nike");
    expect(container.textContent).toContain("Adidas");
  });

  it("does not show conflict warning when brands match", () => {
    const filters: SearchFilters = {
      brands: ["Nike"],
    };
    render(
      <ActiveFilters
        filters={filters}
        onRemoveFilter={mockOnRemoveFilter}
        onClearAll={mockOnClearAll}
        resultCount={10}
        searchQuery="Nike shoes"
      />,
    );

    expect(screen.queryByText(/You searched for/)).not.toBeInTheDocument();
  });

  it("shows low results warning", () => {
    const filters: SearchFilters = {
      brands: ["Nike"],
    };
    const { container } = render(
      <ActiveFilters
        filters={filters}
        onRemoveFilter={mockOnRemoveFilter}
        onClearAll={mockOnClearAll}
        resultCount={2}
        totalCount={50}
      />,
    );

    // Check if the component renders and contains the warning text
    expect(container.textContent).toContain(
      "Only 2 products match your filters",
    );
  });

  it("shows no results warning", () => {
    const filters: SearchFilters = {
      brands: ["Nike"],
    };
    render(
      <ActiveFilters
        filters={filters}
        onRemoveFilter={mockOnRemoveFilter}
        onClearAll={mockOnClearAll}
        resultCount={0}
      />,
    );

    expect(
      screen.getByText(/No products match your current filters/),
    ).toBeInTheDocument();
  });

  it("displays filter count", () => {
    const filters: SearchFilters = {
      brands: ["Nike", "Adidas"],
      priceRange: ["0-80"],
    };
    const { container } = render(
      <ActiveFilters
        filters={filters}
        onRemoveFilter={mockOnRemoveFilter}
        onClearAll={mockOnClearAll}
        resultCount={10}
      />,
    );

    expect(container.textContent).toContain("Active Filters");
    expect(container.textContent).toContain("3");
  });
});
