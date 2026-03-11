import * as hooks from "../index";
import { useActiveFilters } from "../useActiveFilters";
import { useSearchFilters } from "../useSearchFilters";
import { useProductSearch } from "../useProductSearch";

describe("hooks barrel export", () => {
  it("should export useActiveFilters", () => {
    expect(hooks.useActiveFilters).toBe(useActiveFilters);
  });

  it("should export useSearchFilters", () => {
    expect(hooks.useSearchFilters).toBe(useSearchFilters);
  });

  it("should export useProductSearch", () => {
    expect(hooks.useProductSearch).toBe(useProductSearch);
  });

  it("should export all expected hooks", () => {
    const exportedKeys = Object.keys(hooks).sort();
    const expectedKeys = [
      "useActiveFilters",
      "useSearchFilters",
      "useProductSearch",
      "useThrottle",
    ].sort();

    expect(exportedKeys).toEqual(expectedKeys);
  });
});
