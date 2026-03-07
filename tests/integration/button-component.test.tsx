import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Button } from "@/components/ui/Button";

describe("Button Component Integration", () => {
  it("renders with default variant (primary) and size (md)", () => {
    render(<Button>Default Button</Button>);

    const button = screen.getByRole("button", { name: /Default Button/i });
    expect(button).toBeInTheDocument();

    // Should have primary variant classes
    expect(button).toHaveClass("bg-blue-600");
    expect(button).toHaveClass("text-white");

    // Should have md size classes
    expect(button).toHaveClass("px-4");
    expect(button).toHaveClass("py-2");
    expect(button).toHaveClass("text-sm");
  });

  it("renders with only variant specified, using default size (md)", () => {
    render(<Button variant="secondary">Secondary Default Size</Button>);

    const button = screen.getByRole("button", {
      name: /Secondary Default Size/i,
    });
    expect(button).toBeInTheDocument();

    // Should have secondary variant classes
    expect(button).toHaveClass("bg-white");
    expect(button).toHaveClass("border");

    // Should have md size classes (default)
    expect(button).toHaveClass("px-4");
    expect(button).toHaveClass("py-2");
  });

  it("renders with only size specified, using default variant (primary)", () => {
    render(<Button size="lg">Primary Large</Button>);

    const button = screen.getByRole("button", { name: /Primary Large/i });
    expect(button).toBeInTheDocument();

    // Should have primary variant classes (default)
    expect(button).toHaveClass("bg-blue-600");
    expect(button).toHaveClass("text-white");

    // Should have lg size classes
    expect(button).toHaveClass("px-8");
    expect(button).toHaveClass("py-3");
    expect(button).toHaveClass("text-base");
  });

  it("handles click events with default props", () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);

    const button = screen.getByRole("button", { name: /Click Me/i });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("renders ghost variant button with default size", () => {
    render(<Button variant="ghost">Ghost Button</Button>);

    const button = screen.getByRole("button", { name: /Ghost Button/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("bg-transparent");

    // Should have md size classes (default)
    expect(button).toHaveClass("px-4");
    expect(button).toHaveClass("py-2");
  });

  it("renders small size button with default variant", () => {
    render(<Button size="sm">Small Button</Button>);

    const button = screen.getByRole("button", { name: /Small Button/i });
    expect(button).toBeInTheDocument();

    // Should have primary variant classes (default)
    expect(button).toHaveClass("bg-blue-600");

    // Should have sm size classes
    expect(button).toHaveClass("px-3");
    expect(button).toHaveClass("py-1.5");
  });

  it("applies custom className along with default styles", () => {
    render(<Button className="custom-class">Custom Button</Button>);

    const button = screen.getByRole("button", { name: /Custom Button/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("custom-class");

    // Should still have default styles
    expect(button).toHaveClass("bg-blue-600");
    expect(button).toHaveClass("px-4");
  });

  it("disables button when disabled prop is true", () => {
    render(<Button disabled>Disabled Button</Button>);

    const button = screen.getByRole("button", { name: /Disabled Button/i });
    expect(button).toBeDisabled();
    expect(button).toHaveClass("disabled:cursor-not-allowed");
  });
});
