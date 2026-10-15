import { describe, expect, it } from "vitest";
import { createOrderBody } from "../src/validators/order.validators";

const base = {
  fullName: "Ada Obi", email: "ADA@Example.com", phone: "0810 009 0843", addressLine: "12 Example Street",
  city: "Gwarinpa", state: "FCT (Abuja)", deliveryMethod: "delivery", paymentMethod: "WHATSAPP_CONFIRM",
  items: [{ productId: 1, quantity: 2 }],
};
describe("createOrderBody", () => {
  it("accepts a valid order and normalises email and phone", () => {
    const o = createOrderBody.parse(base);
    expect(o.email).toBe("ada@example.com");
    expect(o.phone).toBe("08100090843");
  });
  it("requires an address for delivery but not for pickup", () => {
    expect(() => createOrderBody.parse({ ...base, addressLine: "" })).toThrow();
    expect(() => createOrderBody.parse({ ...base, addressLine: "", deliveryMethod: "pickup" })).not.toThrow();
  });
  it("rejects empty carts, bad states and silly quantities", () => {
    expect(() => createOrderBody.parse({ ...base, items: [] })).toThrow();
    expect(() => createOrderBody.parse({ ...base, state: "Atlantis" })).toThrow();
    expect(() => createOrderBody.parse({ ...base, items: [{ productId: 1, quantity: 0 }] })).toThrow();
    expect(() => createOrderBody.parse({ ...base, items: [{ productId: 1, quantity: 99 }] })).toThrow();
  });
  it("does not accept a client-supplied price", () => {
    const o = createOrderBody.parse({ ...base, items: [{ productId: 1, quantity: 1, price: 1 }] }) as any;
    expect(o.items[0].price).toBeUndefined();
  });
});
