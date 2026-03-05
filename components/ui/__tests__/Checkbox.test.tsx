import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Checkbox } from "../Checkbox";

describe("Checkbox Component", () => {
  it("renders checkbox without label", () => {
    render(<Checkbox />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeInTheDocument();
  });

  it("renders checkbox with string label", () => {
    render(<Checkbox label="Accept terms" />);
    expect(screen.getByText("Accept terms")).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("renders checkbox with JSX label", () => {
    render(<Checkbox label={<span className="font-bold">Bold Label</span>} />);
    expect(screen.getByText("Bold Label")).toBeInTheDocument();
  });

  it("handles checked state", () => {
    render(<Checkbox checked={true} onChange={() => {}} />);
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it("handles unchecked state", () => {
    render(<Checkbox checked={false} onChange={() => {}} />);
    const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it("calls onChange when clicked", () => {
    const handleChange = jest.fn();
    render(<Checkbox onChange={handleChange} />);

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("respects disabled prop", () => {
    const handleChange = jest.fn();
    render(<Checkbox disabled onChange={handleChange} />);

    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toBeDisabled();
    expect(checkbox).toHaveClass("disabled:cursor-not-allowed");
  });

  it("applies custom className", () => {
    render(<Checkbox className="custom-checkbox" />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveClass("custom-checkbox");
  });

  it("uses custom id when provided", () => {
    render(<Checkbox id="my-checkbox" label="Custom ID" />);
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("id", "my-checkbox");
  });

  it("generates unique id when not provided", () => {
    render(<Checkbox label="Auto ID" />);
    const checkbox = screen.getByRole("checkbox");
    const id = checkbox.getAttribute("id");
    expect(id).toBeTruthy();
    expect(id).not.toBe("");
  });

  it("links label to checkbox via htmlFor", () => {
    render(<Checkbox label="Linked label" />);
    const checkbox = screen.getByRole("checkbox");
    const label = screen.getByText("Linked label").parentElement;

    expect(label?.tagName).toBe("LABEL");
    expect(label).toHaveAttribute("for", checkbox.getAttribute("id"));
  });

  it("toggles checkbox when label is clicked", () => {
    const handleChange = jest.fn();
    render(<Checkbox label="Click label" onChange={handleChange} />);

    const labelText = screen.getByText("Click label");
    const label = labelText.parentElement;

    if (label) {
      fireEvent.click(label);
    }

    expect(handleChange).toHaveBeenCalled();
  });

  it("passes through HTML input attributes", () => {
    render(
      <Checkbox
        name="agree"
        value="yes"
        aria-label="Agreement checkbox"
        data-testid="custom-checkbox"
      />,
    );
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveAttribute("name", "agree");
    expect(checkbox).toHaveAttribute("value", "yes");
    expect(checkbox).toHaveAttribute("aria-label", "Agreement checkbox");
    expect(checkbox).toHaveAttribute("data-testid", "custom-checkbox");
  });

  it("renders without label wrapper when no label provided", () => {
    const { container } = render(<Checkbox />);
    const label = container.querySelector("label");
    expect(label).not.toBeInTheDocument();
  });
});
