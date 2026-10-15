import { describe, expect, it } from "vitest";
import { generateResetToken, hashToken } from "../src/utils/tokens";
import { addressBody, registerBody, resetBody } from "../src/validators/auth.validators";

describe("registerBody", () => {
  it("normalises email and accepts an empty phone", () => {
    const r = registerBody.parse({ fullName: "Ada Obi", email: " ADA@Example.COM ", phone: "", password: "longenough1" });
    expect(r.email).toBe("ada@example.com");
    expect(r.phone).toBe("");
  });
  it("rejects short and oversize passwords and bad emails", () => {
    const ok = { fullName: "Ada Obi", email: "a@b.com" };
    expect(() => registerBody.parse({ ...ok, password: "short" })).toThrow();
    expect(() => registerBody.parse({ ...ok, password: "x".repeat(73) })).toThrow();
    expect(() => registerBody.parse({ ...ok, email: "nope", password: "longenough1" })).toThrow();
  });
});
describe("reset tokens", () => {
  it("stores only a hash and the hash matches the token", () => {
    const { token, hash } = generateResetToken();
    expect(token).toHaveLength(64);
    expect(hash).not.toBe(token);
    expect(hashToken(token)).toBe(hash);
  });
  it("makes unique tokens", () => { expect(generateResetToken().token).not.toBe(generateResetToken().token); });
  it("requires a long token and valid password on reset", () => {
    expect(() => resetBody.parse({ token: "short", password: "longenough1" })).toThrow();
    expect(() => resetBody.parse({ token: "a".repeat(64), password: "longenough1" })).not.toThrow();
  });
});
describe("addressBody", () => {
  it("requires a real state", () => {
    expect(() => addressBody.parse({ line1: "12 Example Street", city: "Gwarinpa", state: "Lagos" })).not.toThrow();
    expect(() => addressBody.parse({ line1: "12 Example Street", city: "Gwarinpa", state: "Mars" })).toThrow();
  });
});
