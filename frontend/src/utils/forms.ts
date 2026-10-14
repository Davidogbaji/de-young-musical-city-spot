import { ApiRequestError } from "../services/api";

// Turns a server error into field messages plus one general message.
export function readError(err: unknown): { fields: Record<string, string>; message: string } {
  if (err instanceof ApiRequestError) {
    const fields = err.details ? Object.fromEntries(Object.entries(err.details).map(([k, v]) => [k, v[0]])) : {};
    return { fields, message: err.message };
  }
  return { fields: {}, message: "Something went wrong. Please try again." };
}
// Only allow redirects to pages on this site.
export const safeNext = (n: string | null) => (n && n.startsWith("/") && !n.startsWith("//") ? n : "/account");
export const input = "w-full rounded-lg border border-slate-300 px-3 py-2.5";
