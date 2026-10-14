import { FormEvent, useState } from "react";
import { api } from "../services/api";
import { readError } from "../utils/forms";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setMsg(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setMsg({ ok: false, text: "Enter a valid email address." });
    if (!consent) return setMsg({ ok: false, text: "Please tick the box to agree to receive emails." });
    setBusy(true);
    try { setMsg({ ok: true, text: (await api.subscribe(email.trim(), true)).message }); setEmail(""); setConsent(false); }
    catch (err) { setMsg({ ok: false, text: readError(err).message }); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} noValidate className="max-w-md">
      <h4 className="mb-2 font-extrabold text-white">Newsletter</h4>
      <div className="flex gap-2">
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" aria-label="Email address for newsletter" className="min-w-0 flex-1 rounded-lg px-3 py-2 text-ink" />
        <button className="btn btn-gold !py-2" disabled={busy}>{busy ? "…" : "Subscribe"}</button>
      </div>
      <label className="mt-2 flex items-start gap-2 text-xs"><input type="checkbox" className="mt-0.5" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> I agree to receive emails from De Young Musical and City Spot. I can unsubscribe at any time.</label>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`mt-2 text-sm ${msg.ok ? "text-emerald-300" : "text-red-300"}`}>{msg.text}</p>}
    </form>
  );
}
