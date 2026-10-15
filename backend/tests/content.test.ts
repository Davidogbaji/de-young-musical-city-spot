import { describe, expect, it } from "vitest";
import { normalizeSetting } from "../src/utils/settings";
import { buildSitemap } from "../src/utils/sitemap";
import { bannerBody, newsletterBody, studioEnquiryBody, testimonialBody } from "../src/validators/content.validators";

const enquiry = { fullName: "Ada Obi", phone: "0810 009 0843", studioType: "Podcast studio", requirements: "A small room for two presenters." };
describe("studio enquiry", () => {
  it("accepts a valid enquiry, with email optional", () => {
    const e = studioEnquiryBody.parse({ ...enquiry, email: "" });
    expect(e.email).toBeNull();
    expect(e.phone).toBe("08100090843");
    expect(e.contactMethod).toBe("whatsapp");
  });
  it("rejects unknown studio types, bad email and too-short requirements", () => {
    expect(() => studioEnquiryBody.parse({ ...enquiry, studioType: "Spaceship" })).toThrow();
    expect(() => studioEnquiryBody.parse({ ...enquiry, email: "nope" })).toThrow();
    expect(() => studioEnquiryBody.parse({ ...enquiry, requirements: "short" })).toThrow();
  });
});
describe("newsletter", () => {
  it("requires explicit consent", () => {
    expect(() => newsletterBody.parse({ email: "a@b.com", consent: false })).toThrow();
    expect(newsletterBody.parse({ email: "A@B.com", consent: true }).email).toBe("a@b.com");
  });
});
describe("content", () => {
  it("testimonials start unpublished", () => { expect(testimonialBody.parse({ name: "Ada Obi", quote: "Great service, thank you." }).published).toBe(false); });
  it("banner links must stay on the site or use https", () => {
    const b = { title: "Sale" };
    expect(bannerBody.parse({ ...b, linkUrl: "/shop" }).linkUrl).toBe("/shop");
    expect(bannerBody.parse({ ...b, linkUrl: "" }).linkUrl).toBeNull();
    expect(() => bannerBody.parse({ ...b, linkUrl: "javascript:alert(1)" })).toThrow();
    expect(() => bannerBody.parse({ ...b, linkUrl: "//evil.example" })).toThrow();
  });
});
describe("settings", () => {
  it("normalises the WhatsApp number to international digits", () => {
    expect(normalizeSetting("whatsapp_number", "0810 009 0843")).toBe("2348100090843");
    expect(normalizeSetting("whatsapp_number", "+234 810 009 0843")).toBe("2348100090843");
    expect(() => normalizeSetting("whatsapp_number", "12")).toThrow();
  });
  it("accepts image addresses for studio photos and rejects anything else", () => {
    expect(normalizeSetting("studio_photo_home", "https://res.cloudinary.com/x/a.jpg")).toBe("https://res.cloudinary.com/x/a.jpg");
    expect(() => normalizeSetting("studio_photo_home", "javascript:alert(1)")).toThrow();
  });
  it("empties delete, unknown keys and bad links are rejected", () => {
    expect(normalizeSetting("address", "   ")).toBeNull();
    expect(() => normalizeSetting("jwt_secret", "x")).toThrow();
    expect(() => normalizeSetting("facebook_url", "http://insecure.example")).toThrow();
    expect(normalizeSetting("facebook_url", "https://facebook.com/x")).toBe("https://facebook.com/x");
  });
});
describe("sitemap", () => {
  it("escapes special characters", () => {
    const xml = buildSitemap([{ loc: "https://x.com/shop?a=1&b=2", lastmod: new Date("2026-01-02") }]);
    expect(xml).toContain("a=1&amp;b=2");
    expect(xml).toContain("<lastmod>2026-01-02</lastmod>");
  });
});
