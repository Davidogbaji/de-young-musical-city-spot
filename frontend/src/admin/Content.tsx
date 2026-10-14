import { FormEvent, useEffect, useState } from "react";
import { input, readError } from "../utils/forms";
import { admin, AdminBanner, AdminTestimonial, uploadImage } from "./adminApi";

const Note = ({ n }: { n: { ok: boolean; text: string } | null }) => n ? <p role={n.ok ? "status" : "alert"} className={`rounded-lg border p-3 ${n.ok ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-red-300 bg-red-50 text-red-800"}`}>{n.text}</p> : null;

function Banners() {
  const [list, setList] = useState<AdminBanner[]>([]);
  const [f, setF] = useState({ title: "", linkUrl: "", imageUrl: "" });
  const [up, setUp] = useState(false);
  const [n, setN] = useState<{ ok: boolean; text: string } | null>(null);
  const load = () => admin.banners().then((r) => setList(r.banners)).catch((e: Error) => setN({ ok: false, text: e.message }));
  useEffect(() => { load(); }, []);
  const run = async (fn: () => Promise<unknown>, ok: string) => { try { await fn(); setN({ ok: true, text: ok }); load(); } catch (e) { setN({ ok: false, text: readError(e).message }); } };
  const add = (e: FormEvent) => { e.preventDefault(); run(async () => { await admin.addBanner({ title: f.title, linkUrl: f.linkUrl || null, imageUrl: f.imageUrl || null, active: true, position: list.length }); setF({ title: "", linkUrl: "", imageUrl: "" }); }, "Banner added."); };
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4"><h2 className="mb-1 text-lg font-extrabold">Promotional banners</h2>
      <p className="mb-3 text-sm text-slate-600">Shown under the homepage hero (up to 5). Only add offers that are real.</p>
      <Note n={n} />
      <ul className="my-3 divide-y divide-slate-200 text-sm">{list.length === 0 && <li className="py-3 text-slate-500">No banners yet.</li>}{list.map((b) => (
        <li key={b.id} className="flex flex-wrap items-center gap-3 py-2">{b.imageUrl ? <img src={b.imageUrl} alt="" className="h-10 w-20 rounded object-contain bg-white" /> : <span className="placeholder-box h-10 w-20 rounded !text-[9px]">No image</span>}
          <b className="flex-1">{b.title}{!b.active && <span className="ml-2 text-xs font-normal text-slate-500">(hidden)</span>}</b>
          <button className="font-bold text-electric" onClick={() => run(() => admin.editBanner(b.id, { active: !b.active }), "Banner updated.")}>{b.active ? "Hide" : "Show"}</button>
          <button className="font-bold text-red-700" onClick={() => window.confirm("Delete this banner?") && run(() => admin.removeBanner(b.id), "Banner deleted.")}>Delete</button></li>))}</ul>
      <form onSubmit={add} className="grid gap-2 md:grid-cols-2">
        <input aria-label="Banner title" placeholder="Title" className={input} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <input aria-label="Banner link" placeholder="Link, e.g. /shop (optional)" className={input} value={f.linkUrl} onChange={(e) => setF({ ...f, linkUrl: e.target.value })} />
        <div className="md:col-span-2 flex flex-wrap items-center gap-3"><input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Banner image" disabled={up} onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; setUp(true); try { setF((x) => ({ ...x, imageUrl: "" })); const url = await uploadImage(file); setF((x) => ({ ...x, imageUrl: url })); } catch (er) { setN({ ok: false, text: readError(er).message }); } finally { setUp(false); } }} className="text-sm" />{f.imageUrl && <img src={f.imageUrl} alt="" className="h-10 w-20 rounded object-contain bg-white" />}</div>
        <button className="btn btn-blue md:col-span-2" disabled={up}>Add banner</button>
      </form>
    </section>
  );
}

function Testimonials() {
  const [list, setList] = useState<AdminTestimonial[]>([]);
  const [f, setF] = useState({ name: "", quote: "", published: false });
  const [n, setN] = useState<{ ok: boolean; text: string } | null>(null);
  const load = () => admin.testimonials().then((r) => setList(r.testimonials)).catch((e: Error) => setN({ ok: false, text: e.message }));
  useEffect(() => { load(); }, []);
  const run = async (fn: () => Promise<unknown>, ok: string) => { try { await fn(); setN({ ok: true, text: ok }); load(); } catch (e) { setN({ ok: false, text: readError(e).message }); } };
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4"><h2 className="mb-1 text-lg font-extrabold">Customer testimonials</h2>
      <p className="mb-3 text-sm text-slate-600">Only add feedback from real customers who agreed to it being shown. Nothing appears on the website until you tick Published.</p>
      <Note n={n} />
      <ul className="my-3 divide-y divide-slate-200 text-sm">{list.length === 0 && <li className="py-3 text-slate-500">No testimonials yet. The homepage hides this section until you publish one.</li>}{list.map((t) => (
        <li key={t.id} className="py-2"><div className="flex flex-wrap justify-between gap-2"><b>{t.name} <span className="font-normal text-slate-500">({t.published ? "published" : "not published"})</span></b>
          <span className="flex gap-3"><button className="font-bold text-electric" onClick={() => run(() => admin.editTestimonial(t.id, { published: !t.published }), "Testimonial updated.")}>{t.published ? "Unpublish" : "Publish"}</button><button className="font-bold text-red-700" onClick={() => window.confirm("Delete this testimonial?") && run(() => admin.removeTestimonial(t.id), "Testimonial deleted.")}>Delete</button></span></div>
          <p className="mt-1 text-slate-700">“{t.quote}”</p></li>))}</ul>
      <form onSubmit={(e) => { e.preventDefault(); run(async () => { await admin.addTestimonial(f); setF({ name: "", quote: "", published: false }); }, "Testimonial added."); }} className="space-y-2">
        <input aria-label="Customer name" placeholder="Customer name (as they agreed to be shown)" className={input} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <textarea aria-label="What the customer said" rows={3} placeholder="What the customer said" className={input} value={f.quote} onChange={(e) => setF({ ...f, quote: e.target.value })} />
        <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={f.published} onChange={(e) => setF({ ...f, published: e.target.checked })} /> Publish on the website now</label>
        <button className="btn btn-blue">Add testimonial</button>
      </form>
    </section>
  );
}

export default function Content() {
  return <div className="space-y-6"><h1 className="text-2xl font-extrabold">Banners and testimonials</h1><Banners /><Testimonials /></div>;
}
