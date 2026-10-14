import { FormEvent, useEffect, useState } from "react";
import { api } from "../services/api";
import { input, readError } from "../utils/forms";
import { admin } from "./adminApi";

type Field = { key: string; label: string; hint?: string; area?: boolean };
const GROUPS: { title: string; fields: Field[] }[] = [
  { title: "Contact details", fields: [
    { key: "whatsapp_number", label: "WhatsApp number", hint: "Customers' WhatsApp messages and orders go to this number, for example 08100090843." },
    { key: "contact_phone", label: "Phone number shown on the site" }, { key: "contact_email", label: "Email address" },
    { key: "address", label: "Shop address", hint: "Leave blank if you do not want an address shown." }, { key: "opening_hours", label: "Opening hours", hint: "For example: Mon to Sat, 9am to 6pm." } ] },
  { title: "Social media (full https:// links)", fields: [
    { key: "facebook_url", label: "Facebook" }, { key: "instagram_url", label: "Instagram" }, { key: "tiktok_url", label: "TikTok" }, { key: "x_url", label: "X (Twitter)" }, { key: "youtube_url", label: "YouTube" } ] },
  { title: "Shop information", fields: [
    { key: "delivery_info", label: "Delivery summary", hint: "One short line shown at the top of every page and on product pages.", area: true },
    { key: "warranty_info", label: "Warranty and returns summary", hint: "Shown on product pages that have no warranty of their own.", area: true },
    { key: "about_text", label: "About us text", area: true } ] },
  { title: "Policy pages", fields: [
    { key: "policy_delivery", label: "Delivery and returns policy", area: true }, { key: "policy_privacy", label: "Privacy policy", area: true }, { key: "policy_terms", label: "Terms and conditions", area: true } ] },
];

export default function Settings() {
  const [v, setV] = useState<Record<string, string> | null>(null);
  const [n, setN] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.settings().then((r) => setV(r.settings)).catch((e: Error) => setN({ ok: false, text: e.message })); }, []);
  const save = async (e: FormEvent) => {
    e.preventDefault(); if (!v) return; setBusy(true); setN(null);
    const body = Object.fromEntries(GROUPS.flatMap((g) => g.fields).map((f) => [f.key, v[f.key] ?? ""]));
    try { setV((await admin.saveSettings(body)).settings); setN({ ok: true, text: "Saved. Visitors see the new details within a minute." }); }
    catch (er) { setN({ ok: false, text: readError(er).message }); } finally { setBusy(false); }
  };
  if (!v) return <p className="text-slate-500" role="status">Loading…</p>;
  return (
    <form onSubmit={save} className="space-y-6">
      <h1 className="text-2xl font-extrabold">Settings</h1>
      <p className="text-sm text-slate-600">Only the shop administrator can save changes. Blank fields are not shown on the website. Only write things that are true: delivery times, warranties and policies are promises to customers.</p>
      {GROUPS.map((g) => (
        <fieldset key={g.title} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4"><legend className="px-1 font-extrabold">{g.title}</legend>
          {g.fields.map((f) => (
            <div key={f.key}><label htmlFor={f.key} className="mb-1 block text-sm font-bold">{f.label}</label>
              {f.area ? <textarea id={f.key} rows={f.key.startsWith("policy") || f.key === "about_text" ? 8 : 2} className={input} value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />
                : <input id={f.key} className={input} value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />}
              {f.hint && <p className="mt-1 text-xs text-slate-500">{f.hint}</p>}</div>))}
        </fieldset>))}
      {n && <p role={n.ok ? "status" : "alert"} className={`rounded-lg border p-3 ${n.ok ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-red-300 bg-red-50 text-red-800"}`}>{n.text}</p>}
      <button className="btn btn-blue" disabled={busy}>{busy ? "Saving…" : "Save settings"}</button>
    </form>
  );
}
