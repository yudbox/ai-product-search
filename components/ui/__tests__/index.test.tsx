import { Button, Input, Checkbox, FeatureCard } from "../index";

describe("UI Components Index", () => {
  it("exports Button component", () => {
    expect(Button).toBeDefined();
  });

  it("exports Input component", () => {
    expect(Input).toBeDefined();
  });

  it("exports Checkbox component", () => {
    expect(Checkbox).toBeDefined();
  });

  it("exports FeatureCard component", () => {
    expect(FeatureCard).toBeDefined();
  });
});
