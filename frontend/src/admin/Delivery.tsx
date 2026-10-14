import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { NIGERIAN_STATES } from "../utils/constants";
import { input, readError } from "../utils/forms";
import { naira } from "../utils/format";
import { admin } from "./adminApi";

export default function Delivery() {
  const { user } = useAuth();
  const canEdit = user?.role === "ADMIN";
  const [fees, setFees] = useState<Record<string, number>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const load = () => admin.zones().then((r) => setFees(Object.fromEntries(r.zones.map((z) => [z.state, z.fee])))).catch((e: Error) => setNotice({ text: e.message, ok: false }));
  useEffect(() => { load(); }, []);

  const save = async (state: string) => {
    const raw = (draft[state] ?? "").trim();
    try {
      if (raw === "") await admin.deleteZone(state);
      else if (/^\d+$/.test(raw)) await admin.saveZone(state, Number(raw));
      else return setNotice({ text: "Enter the fee in whole naira, for example 5000.", ok: false });
      setDraft((d) => { const c = { ...d }; delete c[state]; return c; });
      setNotice({ text: raw === "" ? `${state}: fee removed (customers will see "to be confirmed").` : `${state}: fee saved.`, ok: true });
      load();
    } catch (e) { setNotice({ text: readError(e).message, ok: false }); }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Delivery fees</h1>
      <p className="text-slate-600">Set the delivery fee for each state. Leave a state blank and customers see "to be confirmed". Store pickup is always free.</p>
      {!canEdit && <p className="rounded-lg bg-white p-3 text-sm">Only the shop administrator can change delivery fees.</p>}
      {notice && <p role={notice.ok ? "status" : "alert"} className={`rounded-lg border p-3 ${notice.ok ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-red-300 bg-red-50 text-red-800"}`}>{notice.text}</p>}
      <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {NIGERIAN_STATES.map((s) => {
          const shown = draft[s] ?? (fees[s] !== undefined ? String(fees[s]) : "");
          const changed = draft[s] !== undefined && draft[s] !== (fees[s] !== undefined ? String(fees[s]) : "");
          return (
            <li key={s} className="flex flex-wrap items-center gap-3 p-3 text-sm">
              <span className="w-40 font-bold">{s}</span>
              <input aria-label={`Delivery fee for ${s}`} inputMode="numeric" placeholder="Not set" disabled={!canEdit} className={`${input} !w-32`} value={shown} onChange={(e) => setDraft((d) => ({ ...d, [s]: e.target.value }))} />
              {fees[s] !== undefined && !changed && <span className="text-slate-500">{naira(fees[s])}</span>}
              {changed && <button className="font-bold text-electric" onClick={() => save(s)}>Save</button>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
