export const BUSINESS = {
  name: "De Young Musical and City Spot",
  phoneDisplay: "08100090843",
  email: "ogidithomasiji43@gmail.com",
};

// VITE_API_URL=same-origin means "call /api on the same address as the website" (used with the free-hosting proxy setup).
const rawApi: string = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
export const API_URL: string = rawApi === "same-origin" ? "" : rawApi.replace(/\/$/, "");
export const USE_DEMO_FALLBACK: boolean = import.meta.env.VITE_USE_DEMO_FALLBACK !== "false";
// Public address of the website, used for canonical links. Set VITE_SITE_URL in production.
export const SITE_URL: string = ((import.meta.env.VITE_SITE_URL as string | undefined) ?? "").replace(/\/$/, "") || (typeof window !== "undefined" ? window.location.origin : "");

// Accepts 08100090843, +2348100090843 or 2348100090843 and returns international digits, or "" if unset.
export function normalizeNumber(raw: string | undefined): string {
  const d = (raw ?? "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("234")) return d;
  if (d.startsWith("0")) return "234" + d.slice(1);
  return d;
}
export const WHATSAPP_NUMBER = normalizeNumber(import.meta.env.VITE_WHATSAPP_NUMBER);

// Details the business edits in the admin dashboard (such as the WhatsApp number) are loaded at start-up and kept here.
export const runtime = { whatsapp: WHATSAPP_NUMBER };
