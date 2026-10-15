import { describe, expect, it } from "vitest";
import { calculateTotals, mergeItems, unitPrice } from "../src/utils/pricing";

describe("pricing", () => {
  it("uses discount only when lower than price", () => {
    expect(unitPrice({ price: 1000, discountPrice: 800 })).toBe(800);
    expect(unitPrice({ price: 1000, discountPrice: 1200 })).toBe(1000);
    expect(unitPrice({ price: 1000, discountPrice: null })).toBe(1000);
  });
  it("merges duplicate products", () => {
    expect(mergeItems([{ productId: 1, quantity: 2 }, { productId: 2, quantity: 1 }, { productId: 1, quantity: 3 }]))
      .toEqual([{ productId: 1, quantity: 5 }, { productId: 2, quantity: 1 }]);
  });
  it("adds subtotal and delivery", () => {
    expect(calculateTotals([{ unitPrice: 85000, quantity: 2 }, { unitPrice: 5000, quantity: 1 }], 3000))
      .toEqual({ subtotal: 175000, deliveryFee: 3000, total: 178000 });
  });
});
