import { describe, expect, it } from "vitest";
import { listProductsQuery } from "../src/validators/product.validators";

describe("listProductsQuery", () => {
  it("applies defaults", () => {
    expect(listProductsQuery.parse({})).toMatchObject({ sort: "newest", page: 1, limit: 12 });
  });
  it("coerces numbers and inStock", () => {
    const q = listProductsQuery.parse({ minPrice: "1000", inStock: "true", page: "2" });
    expect(q.minPrice).toBe(1000);
    expect(q.inStock).toBe(true);
    expect(q.page).toBe(2);
  });
  it("reads the featured filter", () => {
    expect(listProductsQuery.parse({ featured: "true" }).featured).toBe(true);
    expect(listProductsQuery.parse({}).featured).toBeUndefined();
  });
  it("rejects bad sort and oversize limit", () => {
    expect(() => listProductsQuery.parse({ sort: "random" })).toThrow();
    expect(() => listProductsQuery.parse({ limit: "500" })).toThrow();
  });
});
