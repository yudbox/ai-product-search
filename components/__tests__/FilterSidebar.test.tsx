import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { FilterSidebar } from "@/components/FilterSidebar";
import { SearchFilters } from "@/lib/types";

describe("FilterSidebar", () => {
  const mockOnFilterChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all filter sections", () => {
    const filters: SearchFilters = {};
    render(
      <FilterSidebar filters={filters} onFilterChange={mockOnFilterChange} />,
    );

    expect(screen.getByText("Filters")).toBeInTheDocument();
    expect(screen.getByText("Price")).toBeInTheDocument();
    expect(screen.getByText("Brand")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
  });

  it("renders price range options", () => {
    const filters: SearchFilters = {};
    render(
      <FilterSidebar filters={filters} onFilterChange={mockOnFilterChange} />,
    );

    expect(screen.getByText("$0 - $80")).toBeInTheDocument();
    expect(screen.getByText("$80 - $150")).toBeInTheDocument();
    expect(screen.getByText("$150+")).toBeInTheDocument();
  });

  it("renders brand options", () => {
    const filters: SearchFilters = {};
    render(
      <FilterSidebar filters={filters} onFilterChange={mockOnFilterChange} />,
    );

    expect(screen.getByText("Nike")).toBeInTheDocument();
    expect(screen.getByText("Adidas")).toBeInTheDocument();
    expect(screen.getByText("Brooks")).toBeInTheDocument();
  });

  it("renders category options", () => {
    const filters: SearchFilters = {};
    render(
      <FilterSidebar filters={filters} onFilterChange={mockOnFilterChange} />,
    );

    expect(screen.getByText("Running Shoes")).toBeInTheDocument();
    expect(screen.getByText("Training Shoes")).toBeInTheDocument();
  });

  it("calls onFilterChange when price range is toggled", () => {
    const filters: SearchFilters = {};
    render(
      <FilterSidebar filters={filters} onFilterChange={mockOnFilterChange} />,
    );

    const priceCheckbox = screen.getByLabelText("$0 - $80");
    fireEvent.click(priceCheckbox);

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      priceRange: ["0-80"],
    });
  });

  it("calls onFilterChange when brand is toggled", () => {
    const filters: SearchFilters = {};
    render(
      <FilterSidebar filters={filters} onFilterChange={mockOnFilterChange} />,
    );

    const brandCheckbox = screen.getByLabelText("Nike");
    fireEvent.click(brandCheckbox);

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      brands: ["Nike"],
    });
  });

  it("calls onFilterChange when category is toggled", () => {
    const filters: SearchFilters = {};
    render(
      <FilterSidebar filters={filters} onFilterChange={mockOnFilterChange} />,
    );

    const categoryCheckbox = screen.getByLabelText("Running Shoes");
    fireEvent.click(categoryCheckbox);

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      categories: ["Running Shoes"],
    });
  });

  it("shows clear all button when filters are active", () => {
    const filters: SearchFilters = {
      brands: ["Nike"],
    };
    render(
      <FilterSidebar filters={filters} onFilterChange={mockOnFilterChange} />,
    );

    expect(screen.getByText("Clear all")).toBeInTheDocument();
  });

  it("does not show clear all button when no filters are active", () => {
    const filters: SearchFilters = {};
    render(
      <FilterSidebar filters={filters} onFilterChange={mockOnFilterChange} />,
    );

    expect(screen.queryByText("Clear all")).not.toBeInTheDocument();
  });

  it("clears all filters when clear all is clicked", () => {
    const filters: SearchFilters = {
      brands: ["Nike"],
      priceRange: ["0-80"],
    };
    render(
      <FilterSidebar filters={filters} onFilterChange={mockOnFilterChange} />,
    );

    const clearButton = screen.getByText("Clear all");
    fireEvent.click(clearButton);

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      priceRange: [],
      brands: [],
      categories: [],
    });
  });

  it("checks selected filters", () => {
    const filters: SearchFilters = {
      brands: ["Nike"],
      priceRange: ["0-80"],
    };
    render(
      <FilterSidebar filters={filters} onFilterChange={mockOnFilterChange} />,
    );

    const nikeCheckbox = screen.getByLabelText("Nike") as HTMLInputElement;
    const priceCheckbox = screen.getByLabelText("$0 - $80") as HTMLInputElement;

    expect(nikeCheckbox.checked).toBe(true);
    expect(priceCheckbox.checked).toBe(true);
  });

  it("unchecks filter when toggled off", () => {
    const filters: SearchFilters = {
      brands: ["Nike", "Adidas"],
    };
    render(
      <FilterSidebar filters={filters} onFilterChange={mockOnFilterChange} />,
    );

    const nikeCheckbox = screen.getByLabelText("Nike");
    fireEvent.click(nikeCheckbox);

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      brands: ["Adidas"],
    });
  });
});
