import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Input } from "../Input";

describe("Input Component", () => {
  it("renders input field", () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toBeInTheDocument();
  });

  it("handles value changes", () => {
    const handleChange = jest.fn();
    render(<Input value="" onChange={handleChange} />);

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "test" } });

    expect(handleChange).toHaveBeenCalled();
  });

  it("renders with placeholder", () => {
    render(<Input placeholder="Search..." />);
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("renders with custom type", () => {
    render(<Input type="email" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("type", "email");
  });

  it("displays error message when error prop is provided", () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText("This field is required")).toBeInTheDocument();
  });

  it("applies error styles when error is present", () => {
    render(<Input error="Error message" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("border-red-500");
  });

  it("does not display error when error prop is not provided", () => {
    const { container } = render(<Input />);
    const errorText = container.querySelector(".text-red-600");
    expect(errorText).not.toBeInTheDocument();
  });

  it("respects disabled prop", () => {
    render(<Input disabled />);
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
    expect(input).toHaveClass("disabled:bg-gray-100");
  });

  it("applies custom className", () => {
    render(<Input className="custom-input" />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveClass("custom-input");
  });

  it("supports autoFocus", () => {
    render(<Input autoFocus />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveFocus();
  });

  it("passes through HTML input attributes", () => {
    render(
      <Input
        name="email"
        id="email-input"
        maxLength={50}
        aria-label="Email input"
      />,
    );
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("name", "email");
    expect(input).toHaveAttribute("id", "email-input");
    expect(input).toHaveAttribute("maxLength", "50");
    expect(input).toHaveAttribute("aria-label", "Email input");
  });

  it("works with controlled value", () => {
    const { rerender } = render(<Input value="initial" onChange={() => {}} />);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input.value).toBe("initial");

    rerender(<Input value="updated" onChange={() => {}} />);
    expect(input.value).toBe("updated");
  });
});
