import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Rating } from "../Rating";

describe("Rating Component", () => {
  describe("Basic Rendering", () => {
    it("should render rating with 5 stars by default", () => {
      const { container } = render(<Rating rating={4.5} />);
      const stars = container.querySelectorAll("span[aria-hidden='true']");
      expect(stars).toHaveLength(5);
    });

    it("should render with accessible label", () => {
      render(<Rating rating={4.5} />);
      expect(screen.getByRole("img")).toHaveAccessibleName(
        "Rating: 4.5 out of 5 stars",
      );
    });

    it("should render without numeric rating by default", () => {
      render(<Rating rating={4.5} />);
      expect(screen.queryByText("(4.5)")).not.toBeInTheDocument();
    });
  });

  describe("Star Display Logic", () => {
    it("should display correct number of full stars for whole number rating", () => {
      const { container } = render(<Rating rating={4.0} />);
      const yellowStars = container.querySelectorAll(".text-yellow-400");
      expect(yellowStars).toHaveLength(4);
    });

    it("should display full and half stars for .5 rating", () => {
      const { container } = render(<Rating rating={4.5} />);
      const yellowStars = container.querySelectorAll(".text-yellow-400");
      expect(yellowStars).toHaveLength(5); // 4 full + 1 half
    });

    it("should display full stars without half for .4 rating", () => {
      const { container } = render(<Rating rating={4.4} />);
      const yellowStars = container.querySelectorAll(".text-yellow-400");
      expect(yellowStars).toHaveLength(4); // Only 4 full, no half
    });

    it("should display correct empty stars", () => {
      const { container } = render(<Rating rating={3.0} />);
      const emptyStars = container.querySelectorAll(".text-gray-300");
      expect(emptyStars).toHaveLength(2); // 5 - 3 = 2 empty
    });

    it("should handle 0 rating", () => {
      const { container } = render(<Rating rating={0} />);
      const yellowStars = container.querySelectorAll(".text-yellow-400");
      const emptyStars = container.querySelectorAll(".text-gray-300");
      expect(yellowStars).toHaveLength(0);
      expect(emptyStars).toHaveLength(5);
    });

    it("should handle 5.0 rating", () => {
      const { container } = render(<Rating rating={5.0} />);
      const yellowStars = container.querySelectorAll(".text-yellow-400");
      const emptyStars = container.querySelectorAll(".text-gray-300");
      expect(yellowStars).toHaveLength(5);
      expect(emptyStars).toHaveLength(0);
    });

    it("should round .6 rating to full star", () => {
      const { container } = render(<Rating rating={4.6} />);
      const yellowStars = container.querySelectorAll(".text-yellow-400");
      expect(yellowStars).toHaveLength(5); // 4 full + 1 half (0.6 >= 0.5)
    });

    it("should not add half star for .3 rating", () => {
      const { container } = render(<Rating rating={4.3} />);
      const yellowStars = container.querySelectorAll(".text-yellow-400");
      expect(yellowStars).toHaveLength(4); // Only 4 full
    });
  });

  describe("Numeric Display", () => {
    it("should show numeric rating when showNumeric is true", () => {
      render(<Rating rating={4.5} showNumeric />);
      expect(screen.getByText("(4.5)")).toBeInTheDocument();
    });

    it("should not show numeric rating when showNumeric is false", () => {
      render(<Rating rating={4.5} showNumeric={false} />);
      expect(screen.queryByText("(4.5)")).not.toBeInTheDocument();
    });

    it("should display correct numeric value", () => {
      render(<Rating rating={3.7} showNumeric />);
      expect(screen.getByText("(3.7)")).toBeInTheDocument();
    });
  });

  describe("Custom Max Stars", () => {
    it("should render custom number of stars", () => {
      const { container } = render(<Rating rating={3} maxStars={10} />);
      const stars = container.querySelectorAll("span[aria-hidden='true']");
      expect(stars).toHaveLength(10);
    });

    it("should update accessible label with custom max", () => {
      render(<Rating rating={7} maxStars={10} />);
      expect(screen.getByRole("img")).toHaveAccessibleName(
        "Rating: 7 out of 10 stars",
      );
    });

    it("should correctly calculate empty stars with custom max", () => {
      const { container } = render(<Rating rating={3} maxStars={10} />);
      const yellowStars = container.querySelectorAll(".text-yellow-400");
      const emptyStars = container.querySelectorAll(".text-gray-300");
      expect(yellowStars).toHaveLength(3);
      expect(emptyStars).toHaveLength(7);
    });
  });

  describe("Size Variants", () => {
    it("should apply small size class", () => {
      const { container } = render(<Rating rating={4.5} size="sm" />);
      const ratingDiv = container.querySelector("div[role='img']");
      expect(ratingDiv).toHaveClass("text-sm");
    });

    it("should apply medium size class by default", () => {
      const { container } = render(<Rating rating={4.5} />);
      const ratingDiv = container.querySelector("div[role='img']");
      expect(ratingDiv).toHaveClass("text-base");
    });

    it("should apply large size class", () => {
      const { container } = render(<Rating rating={4.5} size="lg" />);
      const ratingDiv = container.querySelector("div[role='img']");
      expect(ratingDiv).toHaveClass("text-lg");
    });
  });

  describe("Custom Styling", () => {
    it("should apply custom className", () => {
      const { container } = render(
        <Rating rating={4.5} className="custom-class" />,
      );
      const ratingDiv = container.querySelector("div[role='img']");
      expect(ratingDiv).toHaveClass("custom-class");
    });

    it("should preserve default classes with custom className", () => {
      const { container } = render(
        <Rating rating={4.5} className="custom-class" />,
      );
      const ratingDiv = container.querySelector("div[role='img']");
      expect(ratingDiv).toHaveClass("flex", "items-center", "gap-1");
    });
  });

  describe("Edge Cases", () => {
    it("should handle negative rating as 0", () => {
      const { container } = render(<Rating rating={-1} />);
      const yellowStars = container.querySelectorAll(".text-yellow-400");
      expect(yellowStars).toHaveLength(0);
    });

    it("should handle rating greater than maxStars", () => {
      const { container } = render(<Rating rating={10} maxStars={5} />);
      const yellowStars = container.querySelectorAll(".text-yellow-400");
      // Should show 5 full stars (capped at max)
      expect(yellowStars).toHaveLength(5);
    });

    it("should handle decimal ratings correctly", () => {
      const { container } = render(<Rating rating={3.14159} />);
      const yellowStars = container.querySelectorAll(".text-yellow-400");
      expect(yellowStars).toHaveLength(3); // floor(3.14) = 3, no half star
    });

    it("should handle very small decimal (.01)", () => {
      const { container } = render(<Rating rating={4.01} />);
      const yellowStars = container.querySelectorAll(".text-yellow-400");
      expect(yellowStars).toHaveLength(4); // No half star
    });

    it("should handle .49 rating without half star", () => {
      const { container } = render(<Rating rating={3.49} />);
      const yellowStars = container.querySelectorAll(".text-yellow-400");
      expect(yellowStars).toHaveLength(3); // 0.49 < 0.5, no half star
    });

    it("should handle exactly .5 rating with half star", () => {
      const { container } = render(<Rating rating={3.5} />);
      const yellowStars = container.querySelectorAll(".text-yellow-400");
      expect(yellowStars).toHaveLength(4); // 3 full + 1 half
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA role", () => {
      render(<Rating rating={4.5} />);
      expect(screen.getByRole("img")).toBeInTheDocument();
    });

    it("should have aria-hidden on star spans", () => {
      const { container } = render(<Rating rating={4.5} />);
      const stars = container.querySelectorAll("span[aria-hidden='true']");
      expect(stars.length).toBeGreaterThan(0);
    });

    it("should provide meaningful aria-label", () => {
      render(<Rating rating={4.7} maxStars={5} />);
      const ratingElement = screen.getByRole("img");
      expect(ratingElement).toHaveAttribute(
        "aria-label",
        "Rating: 4.7 out of 5 stars",
      );
    });
  });

  describe("Combined Props", () => {
    it("should work with all props combined", () => {
      const { container } = render(
        <Rating
          rating={7.8}
          maxStars={10}
          showNumeric
          size="lg"
          className="my-rating"
        />,
      );

      const ratingDiv = container.querySelector("div[role='img']");
      expect(ratingDiv).toHaveClass("text-lg", "my-rating");
      expect(screen.getByText("(7.8)")).toBeInTheDocument();
      expect(screen.getByRole("img")).toHaveAccessibleName(
        "Rating: 7.8 out of 10 stars",
      );
    });
  });
});
