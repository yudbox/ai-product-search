import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { FeatureCard } from "../FeatureCard";

describe("FeatureCard Component", () => {
  it("renders with all props", () => {
    render(
      <FeatureCard
        icon="🚀"
        title="Test Feature"
        description="This is a test description"
      />
    );

    expect(screen.getByText("🚀")).toBeInTheDocument();
    expect(screen.getByText("Test Feature")).toBeInTheDocument();
    expect(screen.getByText("This is a test description")).toBeInTheDocument();
  });

  it("renders icon in large text", () => {
    render(
      <FeatureCard
        icon="⭐"
        title="Star Feature"
        description="Star description"
      />
    );

    const icon = screen.getByText("⭐");
    expect(icon).toHaveClass("text-3xl");
  });

  it("renders title with correct styling", () => {
    render(
      <FeatureCard
        icon="💡"
        title="Bright Idea"
        description="Innovative solution"
      />
    );

    const title = screen.getByText("Bright Idea");
    expect(title.tagName).toBe("H3");
    expect(title).toHaveClass("font-semibold", "text-gray-900");
  });

  it("renders description with correct styling", () => {
    render(
      <FeatureCard
        icon="📝"
        title="Documentation"
        description="Complete guide"
      />
    );

    const description = screen.getByText("Complete guide");
    expect(description.tagName).toBe("P");
    expect(description).toHaveClass("text-sm", "text-gray-600");
  });

  it("applies card styling", () => {
    const { container } = render(
      <FeatureCard
        icon="🎨"
        title="Design"
        description="Beautiful UI"
      />
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass(
      "rounded-lg",
      "border",
      "border-gray-200",
      "bg-white",
      "p-6"
    );
  });

  it("renders different icons correctly", () => {
    const { rerender } = render(
      <FeatureCard icon="🔥" title="Hot" description="Trending" />
    );
    expect(screen.getByText("🔥")).toBeInTheDocument();

    rerender(<FeatureCard icon="❄️" title="Cool" description="Chill" />);
    expect(screen.getByText("❄️")).toBeInTheDocument();
  });
});
