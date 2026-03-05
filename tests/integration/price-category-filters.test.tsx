import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import SearchPage from "@/app/search/page";

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

describe("Integration: Price and Category Filters", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGet.mockReturnValue("shoes");
  });

  it("user can apply and remove price range filter", async () => {
    render(<SearchPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Nike Air Max 270")).toBeInTheDocument();
    });

    // Find and click price range checkbox ($0 - $80)
    const priceCheckbox = screen.getByLabelText("$0 - $80");
    fireEvent.click(priceCheckbox);

    // Checkbox should be checked
    expect(priceCheckbox).toBeChecked();

    // Uncheck it
    fireEvent.click(priceCheckbox);
    expect(priceCheckbox).not.toBeChecked();
  });

  it("user can apply and remove category filter", async () => {
    render(<SearchPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Nike Air Max 270")).toBeInTheDocument();
    });

    // Find and click category checkbox (Running Shoes)
    const categoryCheckbox = screen.getByLabelText("Running Shoes");
    fireEvent.click(categoryCheckbox);

    // Checkbox should be checked
    expect(categoryCheckbox).toBeChecked();

    // Uncheck it
    fireEvent.click(categoryCheckbox);
    expect(categoryCheckbox).not.toBeChecked();
  });

  it("user can apply multiple filter types (price + brand + category)", async () => {
    render(<SearchPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Nike Air Max 270")).toBeInTheDocument();
    });

    // Apply price filter
    const priceCheckbox = screen.getByLabelText("$80 - $150");
    fireEvent.click(priceCheckbox);
    expect(priceCheckbox).toBeChecked();

    // Apply brand filter (Nike)
    const brandCheckbox = screen.getByTestId("apply-filter");
    fireEvent.click(brandCheckbox);
    expect(brandCheckbox).toBeChecked();

    // Apply category filter
    const categoryCheckbox = screen.getByLabelText("Running Shoes");
    fireEvent.click(categoryCheckbox);
    expect(categoryCheckbox).toBeChecked();

    // All checkboxes should be checked
    expect(priceCheckbox).toBeChecked();
    expect(brandCheckbox).toBeChecked();
    expect(categoryCheckbox).toBeChecked();
  });

  it("all price range options are available and clickable", async () => {
    render(<SearchPage />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText("Nike Air Max 270")).toBeInTheDocument();
    });

    // Test all price range checkboxes exist and are clickable
    const price1Checkbox = screen.getByLabelText("$0 - $80");
    const price2Checkbox = screen.getByLabelText("$80 - $150");
    const price3Checkbox = screen.getByLabelText("$150+");

    // All should be initially unchecked
    expect(price1Checkbox).not.toBeChecked();
    expect(price2Checkbox).not.toBeChecked();
    expect(price3Checkbox).not.toBeChecked();

    // Click each one and verify they get checked
    fireEvent.click(price1Checkbox);
    expect(price1Checkbox).toBeChecked();

    fireEvent.click(price2Checkbox);
    expect(price2Checkbox).toBeChecked();

    fireEvent.click(price3Checkbox);
    expect(price3Checkbox).toBeChecked();
  });
});
