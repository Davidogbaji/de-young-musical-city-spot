import { ApiError } from "./apiError";

type Kind = "url" | "email" | "phone" | "text";
// The only settings staff can edit, with the longest value allowed for each.
export const SETTINGS: Record<string, { max: number; kind: Kind }> = {
  whatsapp_number: { max: 20, kind: "phone" },
  contact_phone: { max: 30, kind: "text" },
  contact_email: { max: 200, kind: "email" },
  address: { max: 300, kind: "text" },
  opening_hours: { max: 300, kind: "text" },
  facebook_url: { max: 300, kind: "url" }, instagram_url: { max: 300, kind: "url" }, tiktok_url: { max: 300, kind: "url" },
  x_url: { max: 300, kind: "url" }, youtube_url: { max: 300, kind: "url" },
  delivery_info: { max: 500, kind: "text" }, warranty_info: { max: 500, kind: "text" },
  about_text: { max: 5000, kind: "text" },
  policy_delivery: { max: 8000, kind: "text" }, policy_privacy: { max: 8000, kind: "text" }, policy_terms: { max: 8000, kind: "text" },
};

// Returns the cleaned value, or null when the value is empty (meaning "remove this setting").
export function normalizeSetting(key: string, raw: string): string | null {
  const spec = SETTINGS[key];
  if (!spec) throw new ApiError(400, `Unknown setting: ${key}`);
  const v = raw.trim();
  if (v === "") return null;
  if (v.length > spec.max) throw new ApiError(400, `${key} is too long (maximum ${spec.max} characters).`);
  if (spec.kind === "url" && !/^https:\/\/\S+$/i.test(v)) throw new ApiError(400, `${key} must be a full web address starting with https://`);
  if (spec.kind === "email" && !/^\S+@\S+\.\S+$/.test(v)) throw new ApiError(400, "Enter a valid email address.");
  if (spec.kind === "phone") {
    const d = v.replace(/\D/g, "");
    const intl = d.startsWith("234") ? d : d.startsWith("0") ? "234" + d.slice(1) : d;
    if (!/^\d{10,15}$/.test(intl)) throw new ApiError(400, "Enter a valid WhatsApp number, for example 08100090843.");
    return intl;
  }
  return v;
}
