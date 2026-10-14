import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Pagination from "../components/Pagination";
import { input, readError } from "../utils/forms";
import { naira } from "../utils/format";
import { admin, AdminOrder, downloadOrdersCsv, Pager } from "./adminApi";

const STATUSES = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];
const SETTABLE = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];
const label = (s: string) => s.replace(/_/g, " ").toLowerCase();
const waNumber = (p: string) => { const d = p.replace(/\D/g, ""); return d.startsWith("234") ? d : d.startsWith("0") ? "234" + d.slice(1) : d; };

function OrderCard({ o, onChange }: { o: AdminOrder; onChange: (o: AdminOrder, msg: string) => void }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(o.status);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const locked = o.status === "CANCELLED";
  const run = async (body: { status?: string; markPaid?: boolean }, ok: string) => {
    setBusy(true); setErr(null);
    try { const r = await admin.updateOrder(o.id, body); onChange(r.order, ok); } catch (e) { setErr(readError(e).message); } finally { setBusy(false); }
  };
  const wa = `https://wa.me/${waNumber(o.phone)}?text=${encodeURIComponent(`Hello ${o.fullName}, this is De Young Musical and City Spot about your order ${o.reference} (${naira(o.total)}).`)}`;
  return (
    <li className="rounded-xl border border-slate-200 bg-white p-4">
      <button className="flex w-full flex-wrap items-center justify-between gap-2 text-left" onClick={() => setOpen((x) => !x)} aria-expanded={open}>
        <span><span className="font-mono font-bold">{o.reference}</span> · {o.fullName}</span>
        <span className="text-sm"><b>{naira(o.total)}</b> · {label(o.status)} · <span className={o.paymentStatus === "PAID" ? "font-bold text-emerald-700" : "font-bold text-amber-700"}>{o.paymentStatus === "PAID" ? "paid" : "not paid"}</span> · {new Date(o.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}</span>
      </button>
      {open && (
        <div className="mt-4 grid gap-4 border-t border-slate-200 pt-4 text-sm md:grid-cols-2">
          <div>
            <p><b>Customer:</b> {o.fullName}</p>
            <p><a className="text-electric hover:underline" href={`tel:${o.phone}`}>{o.phone}</a> · <a className="text-electric hover:underline" href={`mailto:${o.email}`}>{o.email}</a></p>
            <p className="mt-1">{o.deliveryMethod === "pickup" ? "Store pickup" : `${o.addressLine}, ${o.city}, ${o.state}`}</p>
            {o.notes && <p className="mt-1"><b>Notes:</b> {o.notes}</p>}
            <a className="btn mt-3 bg-[#1fa855] !py-2 text-white hover:bg-[#188a45]" href={wa} target="_blank" rel="noopener noreferrer">Message customer on WhatsApp</a>
          </div>
          <div>
            <ul className="divide-y divide-slate-200">{o.items.map((i) => <li key={i.name} className="flex justify-between py-1"><span>{i.quantity} × {i.name}</span><b>{naira(i.unitPrice * i.quantity)}</b></li>)}</ul>
            <p className="mt-2 flex justify-between">Delivery <span>{o.feeToBeConfirmed ? "to be confirmed" : naira(o.deliveryFee)}</span></p>
            <p className="flex justify-between font-extrabold">Total <span>{naira(o.total)}</span></p>
            <p className="mt-1 text-xs text-slate-500">Payment option chosen: {label(o.paymentMethod)}</p>
          </div>
          <div className="space-y-2 md:col-span-2">
            {err && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-2 text-red-800">{err}</p>}
            {locked ? <p className="text-slate-600">This order was cancelled and can no longer be changed.</p> : (
              <div className="flex flex-wrap items-center gap-2">
                {o.paymentStatus !== "PAID" && <button className="btn btn-gold !py-2" disabled={busy} onClick={() => window.confirm(`Mark ${o.reference} as paid (${naira(o.total)})? Only do this after you have received the money.`) && run({ markPaid: true }, "Marked as paid.")}>Mark as paid</button>}
                <select aria-label="Order status" className={`${input} !w-44`} value={status} onChange={(e) => setStatus(e.target.value)}>
                  {!SETTABLE.includes(o.status) && <option value={o.status}>{label(o.status)}</option>}{SETTABLE.map((s) => <option key={s} value={s}>{label(s)}</option>)}
                </select>
                <button className="btn btn-blue !py-2" disabled={busy || status === o.status || !SETTABLE.includes(status)} onClick={() => (status !== "CANCELLED" || window.confirm("Cancel this order? The items go back into stock and the order can no longer be changed.")) && run({ status }, "Order updated.")}>Update status</button>
              </div>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

export default function Orders() {
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [data, setData] = useState<{ orders: AdminOrder[]; pagination: Pager } | null>(null);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const key = sp.toString();
  useEffect(() => {
    admin.orders({ status: sp.get("status") ?? undefined, q: sp.get("q") ?? undefined, page: Number(sp.get("page")) || 1 })
      .then(setData).catch((e: Error) => setNotice({ text: e.message, ok: false }));
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const param = (k: string, v: string | null) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); if (k !== "page") n.delete("page"); setSp(n); };
  const exportCsv = async () => { try { await downloadOrdersCsv({ status: sp.get("status") ?? undefined, q: sp.get("q") ?? undefined }); } catch (e) { setNotice({ text: readError(e).message, ok: false }); } };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-extrabold">Orders</h1><button className="btn border border-slate-300 bg-white" onClick={exportCsv}>Export to spreadsheet (CSV)</button></div>
      <div className="flex flex-wrap gap-2">
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); param("q", q.trim() || null); }}><input className={`${input} !w-64`} placeholder="Reference, name, phone or email" aria-label="Search orders" value={q} onChange={(e) => setQ(e.target.value)} /><button className="btn btn-blue !px-4">Search</button></form>
        <select aria-label="Filter by status" className={`${input} !w-44`} value={sp.get("status") ?? ""} onChange={(e) => param("status", e.target.value || null)}><option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{label(s)}</option>)}</select>
      </div>
      {notice && <p role={notice.ok ? "status" : "alert"} className={`rounded-lg border p-3 ${notice.ok ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-red-300 bg-red-50 text-red-800"}`}>{notice.text}</p>}
      {!data ? <p className="text-slate-500" role="status">Loading…</p> : data.orders.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">No orders match.</p> : (
        <ul className="space-y-3">{data.orders.map((o) => <OrderCard key={o.id} o={o} onChange={(n, m) => { setData((d) => d && { ...d, orders: d.orders.map((x) => (x.id === n.id ? n : x)) }); setNotice({ text: m, ok: true }); }} />)}</ul>
      )}
      {data && <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={(p) => param("page", p === 1 ? null : String(p))} />}
    </div>
  );
}
