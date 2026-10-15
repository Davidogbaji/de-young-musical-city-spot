import { describe, expect, it } from "vitest";
import { csvCell, csvRow } from "../src/utils/csv";
import { sniffImage } from "../src/utils/image";
import { slugify } from "../src/utils/slug";
import { orderUpdateBody, productCreate, productPatch } from "../src/validators/admin.validators";

const base = { name: "Yamaha F310", price: 85000, stock: 4, categoryId: 1 };
describe("product validation", () => {
  it("applies defaults and accepts a valid product", () => {
    const p = productCreate.parse(base);
    expect(p).toMatchObject({ status: "ACTIVE", isFeatured: false, description: "", images: [] });
  });
  it("rejects a discount that is not lower than the price", () => {
    expect(() => productCreate.parse({ ...base, discountPrice: 85000 })).toThrow();
    expect(() => productCreate.parse({ ...base, discountPrice: 70000 })).not.toThrow();
  });
  it("rejects negative stock, fractional naira and unsafe image links", () => {
    expect(() => productCreate.parse({ ...base, stock: -1 })).toThrow();
    expect(() => productCreate.parse({ ...base, price: 10.5 })).toThrow();
    expect(() => productCreate.parse({ ...base, images: [{ url: "javascript:alert(1)" }] })).toThrow();
  });
  it("lets a patch change just one field", () => {
    expect(productPatch.parse({ stock: 9 })).toEqual({ stock: 9 });
  });
});
describe("order updates", () => {
  it("cannot set PAID directly, only through markPaid", () => {
    expect(() => orderUpdateBody.parse({ status: "PAID" })).toThrow();
    expect(orderUpdateBody.parse({ markPaid: true }).markPaid).toBe(true);
    expect(() => orderUpdateBody.parse({})).toThrow();
  });
});
describe("sniffImage", () => {
  it("recognises real image bytes and rejects other files", () => {
    expect(sniffImage(Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(20)]))?.ext).toBe("jpg");
    expect(sniffImage(Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(20)]))?.ext).toBe("png");
    expect(sniffImage(Buffer.from("RIFF1234WEBPxxxx"))?.ext).toBe("webp");
    expect(sniffImage(Buffer.from("<?php echo 1; ?> not an image"))).toBeNull();
    expect(sniffImage(Buffer.from("tiny"))).toBeNull();
  });
});
describe("csv", () => {
  it("quotes cells and defuses formulas", () => {
    expect(csvCell('say "hi", ok')).toBe('"say ""hi"", ok"');
    expect(csvCell("=HYPERLINK(\"x\")")).toBe("\"'=HYPERLINK(\"\"x\"\")\"");
    expect(csvRow(["a", 5, null])).toBe("a,5,");
  });
  it("makes clean slugs", () => { expect(slugify("Yamaha F310 (Acoustic)!")).toBe("yamaha-f310-acoustic"); });
});
