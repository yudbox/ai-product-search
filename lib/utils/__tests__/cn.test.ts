/**
 * Unit tests for cn utility function
 */

import { cn } from "../cn";

describe("cn", () => {
  it("should merge class names", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
  });

  it("should handle conditional classes", () => {
    expect(cn("base", { active: true, inactive: false })).toBe("base active");
  });

  it("should handle undefined and null", () => {
    expect(cn("base", undefined, null)).toBe("base");
  });

  it("should handle arrays", () => {
    expect(cn(["class1", "class2"])).toBe("class1 class2");
  });

  it("should merge tailwind classes correctly", () => {
    // twMerge should handle conflicting tailwind classes
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("should handle empty input", () => {
    expect(cn()).toBe("");
  });

  it("should handle complex combinations", () => {
    const result = cn(
      "base-class",
      { "conditional-class": true },
      ["array-class"],
      undefined,
      "final-class",
    );
    expect(result).toContain("base-class");
    expect(result).toContain("conditional-class");
    expect(result).toContain("array-class");
    expect(result).toContain("final-class");
  });

  it("should handle boolean false values", () => {
    expect(cn("base", false && "hidden")).toBe("base");
  });

  it("should not deduplicate non-Tailwind classes", () => {
    // clsx/twMerge only merge conflicting Tailwind classes, not regular duplicates
    expect(cn("class1 class2", "class1")).toBe("class1 class2 class1");
  });

  it("should handle nested conditionals", () => {
    const isActive = true;
    const isDisabled = false;
    expect(
      cn("button", {
        active: isActive,
        disabled: isDisabled,
      }),
    ).toBe("button active");
  });
});
