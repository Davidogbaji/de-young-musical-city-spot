import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Pagination from "../components/Pagination";
import { input, readError } from "../utils/forms";
import { admin, Enquiry, Pager } from "./adminApi";

const STATUSES = ["NEW", "CONTACTED", "QUOTED", "CLOSED"];
const waNumber = (p: string) => { const d = p.replace(/\D/g, ""); return d.startsWith("234") ? d : d.startsWith("0") ? "234" + d.slice(1) : d; };

export default function Enquiries() {
  const [sp, setSp] = useSearchParams();
  const [data, setData] = useState<{ enquiries: Enquiry[]; pagination: Pager } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const key = sp.toString();
  useEffect(() => { admin.enquiries({ status: sp.get("status") ?? undefined, page: Number(sp.get("page")) || 1 }).then(setData).catch((e: Error) => setErr(e.message)); }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const param = (k: string, v: string | null) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); if (k !== "page") n.delete("page"); setSp(n); };
  const setStatus = async (id: number, status: string) => {
    try { await admin.updateEnquiry(id, status); setData((d) => d && { ...d, enquiries: d.enquiries.map((e) => (e.id === id ? { ...e, status: status as Enquiry["status"] } : e)) }); }
    catch (e) { setErr(readError(e).message); }
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-extrabold">Studio enquiries</h1>
        <select aria-label="Filter by status" className={`${input} !w-44`} value={sp.get("status") ?? ""} onChange={(e) => param("status", e.target.value || null)}><option value="">All</option>{STATUSES.map((s) => <option key={s} value={s}>{s.toLowerCase()}</option>)}</select></div>
      {err && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">{err}</p>}
      {!data ? <p className="text-slate-500" role="status">Loading…</p> : data.enquiries.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">No enquiries yet.</p> : (
        <ul className="space-y-3">{data.enquiries.map((e) => (
          <li key={e.id} className={`rounded-xl border bg-white p-4 ${e.status === "NEW" ? "border-electric" : "border-slate-200"}`}>
            <div className="flex flex-wrap items-start justify-between gap-2"><div><b>{e.fullName}</b> · {e.studioType}<br /><span className="text-xs text-slate-500">{new Date(e.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</span></div>
              <select aria-label={`Status for ${e.fullName}`} className={`${input} !w-40`} value={e.status} onChange={(ev) => setStatus(e.id, ev.target.value)}>{STATUSES.map((s) => <option key={s} value={s}>{s.toLowerCase()}</option>)}</select></div>
            <p className="mt-2 whitespace-pre-line text-sm">{e.requirements}</p>
            <p className="mt-2 text-sm text-slate-600">Budget: {e.budgetRange || "not given"} · Location: {e.location || "not given"} · Prefers: {e.contactMethod}</p>
            <p className="mt-2 flex flex-wrap gap-3 text-sm font-bold"><a className="text-electric hover:underline" href={`tel:${e.phone}`}>Call {e.phone}</a>
              <a className="text-[#188a45] hover:underline" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${waNumber(e.phone)}?text=${encodeURIComponent(`Hello ${e.fullName}, this is De Young Musical and City Spot about your ${e.studioType} enquiry.`)}`}>WhatsApp</a>
              {e.email && <a className="text-electric hover:underline" href={`mailto:${e.email}`}>Email</a>}</p>
          </li>))}</ul>
      )}
      {data && <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={(p) => param("page", p === 1 ? null : String(p))} />}
    </div>
  );
}
