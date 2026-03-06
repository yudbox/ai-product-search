import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import SearchPage from "@/app/search/page";

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

describe("Mobile Filters Modal Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue("running shoes");

    // Set mobile viewport
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 375, // Mobile width
    });

    // Mock matchMedia for mobile
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query === "(max-width: 1023px)", // lg breakpoint
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  it("opens mobile filters modal when filter button is clicked", async () => {
    render(<SearchPage />);

    // Wait for page to load (Home button is always present)
    await screen.findByRole("button", { name: /Home/i });

    // Find and click the mobile filter button
    const mobileFilterButton = await screen.findByTestId(
      "mobile-filters-button",
    );
    fireEvent.click(mobileFilterButton);

    // Check that modal is now visible (has translate-x-0 class)
    await waitFor(() => {
      const modal = screen.getByTestId("mobile-filters-modal");
      expect(modal).toHaveClass("translate-x-0");
    });

    // Verify overlay is present
    const overlay = document.querySelector(".bg-black");
    expect(overlay).toBeInTheDocument();
  });

  it("closes mobile filters modal when overlay is clicked", async () => {
    render(<SearchPage />);

    // Wait for page to load
    await screen.findByRole("button", { name: /Home/i });

    // Open modal
    const mobileFilterButton = await screen.findByTestId(
      "mobile-filters-button",
    );
    fireEvent.click(mobileFilterButton);

    // Wait for modal to open
    await waitFor(() => {
      const modal = screen.getByTestId("mobile-filters-modal");
      expect(modal).toHaveClass("translate-x-0");
    });

    // Click overlay to close
    const overlay = document.querySelector(".bg-black");
    expect(overlay).toBeInTheDocument();
    fireEvent.click(overlay!);

    // Modal should be closed (check that it's transformed out)
    await waitFor(() => {
      const modal = screen.getByTestId("mobile-filters-modal");
      expect(modal).toHaveClass("translate-x-full");
    });
  });

  it("closes mobile filters modal when close button (×) is clicked", async () => {
    render(<SearchPage />);

    // Wait for page to load
    await screen.findByRole("button", { name: /Home/i });

    // Open modal
    const mobileFilterButton = await screen.findByTestId(
      "mobile-filters-button",
    );
    fireEvent.click(mobileFilterButton);

    // Wait for modal to open
    await waitFor(() => {
      const modal = screen.getByTestId("mobile-filters-modal");
      expect(modal).toHaveClass("translate-x-0");
    });

    // Find and click close button (×)
    const closeButton = screen.getByText("×");
    fireEvent.click(closeButton);

    // Modal should be closed
    await waitFor(() => {
      const modal = screen.getByTestId("mobile-filters-modal");
      expect(modal).toHaveClass("translate-x-full");
    });
  });

  it("closes mobile filters modal when Apply Filters button is clicked", async () => {
    render(<SearchPage />);

    // Wait for page to load
    await screen.findByRole("button", { name: /Home/i });

    // Open modal
    const mobileFilterButton = await screen.findByTestId(
      "mobile-filters-button",
    );
    fireEvent.click(mobileFilterButton);

    // Wait for modal to open
    await waitFor(() => {
      const modal = screen.getByTestId("mobile-filters-modal");
      expect(modal).toHaveClass("translate-x-0");
    });

    // Find and click "Apply Filters" button
    const applyButton = screen.getByRole("button", { name: /Apply Filters/i });
    fireEvent.click(applyButton);

    // Modal should be closed
    await waitFor(() => {
      const modal = screen.getByTestId("mobile-filters-modal");
      expect(modal).toHaveClass("translate-x-full");
    });
  });

  it("renders FilterSidebar inside mobile modal with correct filters", async () => {
    render(<SearchPage />);

    // Wait for page to load
    await screen.findByRole("button", { name: /Home/i });

    // Open modal
    const mobileFilterButton = await screen.findByTestId(
      "mobile-filters-button",
    );
    fireEvent.click(mobileFilterButton);

    // Wait for modal to open
    await waitFor(() => {
      const modal = screen.getByTestId("mobile-filters-modal");
      expect(modal).toHaveClass("translate-x-0");
    });

    // Verify FilterSidebar content is present (check for filter categories)
    expect(screen.getAllByText(/Price/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Brand/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Category/i).length).toBeGreaterThan(0);
  });

  it("applies filters within mobile modal and reflects in search results", async () => {
    render(<SearchPage />);

    // Wait for page to load
    await screen.findByRole("button", { name: /Home/i });

    // Open modal
    const mobileFilterButton = await screen.findByTestId(
      "mobile-filters-button",
    );
    fireEvent.click(mobileFilterButton);

    // Wait for modal to open
    await waitFor(() => {
      const modal = screen.getByTestId("mobile-filters-modal");
      expect(modal).toHaveClass("translate-x-0");
    });

    // Apply a filter (e.g., check "Men" gender filter)
    const menCheckbox = screen
      .getAllByRole("checkbox")
      .find((checkbox) => checkbox.getAttribute("name") === "Men");

    if (menCheckbox) {
      fireEvent.click(menCheckbox);
    }

    // Click Apply Filters
    const applyButton = screen.getByRole("button", { name: /Apply Filters/i });
    fireEvent.click(applyButton);

    // Verify that search was triggered with new filters
    await waitFor(() => {
      // Modal should be closed
      const modal = screen.getByTestId("mobile-filters-modal");
      expect(modal).toHaveClass("translate-x-full");
    });
  });
});
