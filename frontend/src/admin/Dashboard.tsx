import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { naira } from "../utils/format";
import { admin, Dashboard as D } from "./adminApi";

const Card = ({ label, value, to }: { label: string; value: string | number; to?: string }) => {
  const inner = <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-sm text-slate-600">{label}</p><p className="text-2xl font-extrabold text-navy">{value}</p></div>;
  return to ? <Link to={to}>{inner}</Link> : inner;
};

export default function Dashboard() {
  const [d, setD] = useState<D | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { admin.dashboard().then(setD).catch((e: Error) => setErr(e.message)); }, []);
  if (err) return <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">{err}</p>;
  if (!d) return <p className="text-slate-500" role="status">Loading…</p>;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Dashboard</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card label="Orders waiting for action" value={d.awaitingAction} to="/admin/orders?status=PENDING" />
        <Card label="Orders, last 30 days" value={d.orders30} to="/admin/orders" />
        <Card label="Paid, last 30 days" value={naira(d.paidRevenue30)} />
        <Card label="Active products" value={d.activeProducts} to="/admin/products" />
      </div>
      {d.newEnquiries > 0 && <p className="rounded-lg bg-white p-3">New studio enquiries: <b>{d.newEnquiries}</b> - <Link to="/admin/enquiries" className="font-bold text-electric hover:underline">open the inbox</Link></p>}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 font-extrabold">Low stock (3 or fewer)</h2>
          {d.lowStock.length === 0 ? <p className="text-sm text-slate-600">Nothing running low.</p> : <ul className="divide-y divide-slate-200 text-sm">{d.lowStock.map((p) => <li key={p.id} className="flex justify-between py-2"><Link className="text-electric hover:underline" to={`/admin/products?q=${encodeURIComponent(p.name)}`}>{p.name}</Link><b className={p.stock === 0 ? "text-red-700" : ""}>{p.stock === 0 ? "Out of stock" : `${p.stock} left`}</b></li>)}</ul>}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-2 font-extrabold">Recent orders</h2>
          {d.recentOrders.length === 0 ? <p className="text-sm text-slate-600">No orders yet.</p> : <ul className="divide-y divide-slate-200 text-sm">{d.recentOrders.map((o) => <li key={o.id} className="flex flex-wrap justify-between gap-2 py-2"><span><Link to={`/admin/orders?q=${o.reference}`} className="font-mono text-electric hover:underline">{o.reference}</Link> · {o.fullName}</span><span><b>{naira(o.total)}</b> · {o.paymentStatus === "PAID" ? "paid" : "unpaid"}</span></li>)}</ul>}
        </section>
      </div>
    </div>
  );
}
