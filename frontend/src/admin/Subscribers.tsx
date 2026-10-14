import { useEffect, useState } from "react";
import Pagination from "../components/Pagination";
import { readError } from "../utils/forms";
import { admin, downloadCsv, Pager } from "./adminApi";

export default function Subscribers() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ subscribers: { id: number; email: string; subscribedAt: string }[]; pagination: Pager } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { admin.subscribers(page).then(setData).catch((e: Error) => setErr(e.message)); }, [page]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-extrabold">Newsletter subscribers</h1>
        <button className="btn border border-slate-300 bg-white" onClick={async () => { try { await downloadCsv("/admin/newsletter/export.csv", `subscribers-${new Date().toISOString().slice(0, 10)}.csv`); } catch (e) { setErr(readError(e).message); } }}>Export to CSV</button></div>
      <p className="text-sm text-slate-600">These people agreed to receive emails and can unsubscribe with the link in the welcome email. Only email people who are on this list, and respect unsubscribes.</p>
      {err && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">{err}</p>}
      {data && (data.subscribers.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">No subscribers yet.</p> : <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white text-sm">{data.subscribers.map((s) => <li key={s.id} className="flex justify-between p-3"><span>{s.email}</span><span className="text-slate-500">{new Date(s.subscribedAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}</span></li>)}</ul>)}
      {data && <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={setPage} />}
    </div>
  );
}
