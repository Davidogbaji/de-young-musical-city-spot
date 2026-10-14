import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Field, { aria } from "../components/Field";
import Pagination from "../components/Pagination";
import { useAuth } from "../context/AuthContext";
import { Brand, Category } from "../types";
import { input, readError } from "../utils/forms";
import { naira } from "../utils/format";
import { admin, AdminProduct, Pager, uploadImage } from "./adminApi";

const Alert = ({ text, ok }: { text: string | null; ok?: boolean }) => text ? <p role={ok ? "status" : "alert"} className={`rounded-lg border p-3 ${ok ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-red-300 bg-red-50 text-red-800"}`}>{text}</p> : null;

function ProductForm({ initial, categories, brands, onDone }: { initial: AdminProduct | null; categories: Category[]; brands: Brand[]; onDone: (msg?: string) => void }) {
  const [f, setF] = useState({
    name: initial?.name ?? "", slug: initial?.slug ?? "", description: initial?.description ?? "", model: initial?.model ?? "",
    price: initial ? String(initial.price) : "", discountPrice: initial?.discountPrice ? String(initial.discountPrice) : "", stock: initial ? String(initial.stock) : "0",
    status: initial?.status ?? "ACTIVE", isFeatured: initial?.isFeatured ?? false, categoryId: initial ? String(initial.categoryId) : "", brandId: initial?.brandId ? String(initial.brandId) : "",
    warranty: initial?.warranty ?? "",
  });
  const [specs, setSpecs] = useState<[string, string][]>(initial?.specs ? Object.entries(initial.specs) : []);
  const [images, setImages] = useState(initial?.images ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true); setMsg(null);
    try { for (const file of Array.from(files)) { const url = await uploadImage(file); setImages((x) => [...x, { url, alt: f.name }]); } }
    catch (err) { setMsg(readError(err).message); } finally { setUploading(false); }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setMsg(null);
    const v: Record<string, string> = {};
    if (f.name.trim().length < 2) v.name = "Enter a product name";
    if (!f.categoryId) v.categoryId = "Choose a category";
    if (!/^\d+$/.test(f.price) || Number(f.price) < 1) v.price = "Enter the price in whole naira";
    if (f.discountPrice && (!/^\d+$/.test(f.discountPrice) || Number(f.discountPrice) >= Number(f.price))) v.discountPrice = "Must be lower than the price";
    if (!/^\d+$/.test(f.stock)) v.stock = "Enter the number in stock";
    setErrors(v); if (Object.keys(v).length) return;
    const body = {
      name: f.name.trim(), ...(f.slug.trim() ? { slug: f.slug.trim() } : {}), description: f.description, model: f.model || null,
      price: Number(f.price), discountPrice: f.discountPrice ? Number(f.discountPrice) : null, stock: Number(f.stock),
      status: f.status as AdminProduct["status"], isFeatured: f.isFeatured, categoryId: Number(f.categoryId), brandId: f.brandId ? Number(f.brandId) : null,
      warranty: f.warranty || null, specs: Object.fromEntries(specs.filter(([k]) => k.trim()).map(([k, val]) => [k.trim(), val])), images,
    };
    setBusy(true);
    try { initial ? await admin.updateProduct(initial.id, body) : await admin.createProduct(body); onDone(initial ? "Product saved." : "Product added."); }
    catch (err) { const r = readError(err); setErrors(r.fields); setMsg(r.message); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-5 rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-xl font-extrabold">{initial ? `Edit: ${initial.name}` : "Add a product"}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Field id="name" label="Product name" error={errors.name}><input id="name" className={input} value={f.name} onChange={set("name")} {...aria(errors, "name")} /></Field>
        <Field id="model" label="Model (optional)"><input id="model" className={input} value={f.model} onChange={set("model")} /></Field>
        <Field id="categoryId" label="Category" error={errors.categoryId}><select id="categoryId" className={input} value={f.categoryId} onChange={set("categoryId")} {...aria(errors, "categoryId")}><option value="">Choose…</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field id="brandId" label="Brand (optional)"><select id="brandId" className={input} value={f.brandId} onChange={set("brandId")}><option value="">No brand</option>{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></Field>
        <Field id="price" label="Price (₦)" error={errors.price}><input id="price" inputMode="numeric" className={input} value={f.price} onChange={set("price")} {...aria(errors, "price")} /></Field>
        <Field id="discountPrice" label="Discount price (₦, optional)" error={errors.discountPrice} hint="Shown as the selling price, with the normal price crossed out."><input id="discountPrice" inputMode="numeric" className={input} value={f.discountPrice} onChange={set("discountPrice")} {...aria(errors, "discountPrice")} /></Field>
        <Field id="stock" label="Quantity in stock" error={errors.stock}><input id="stock" inputMode="numeric" className={input} value={f.stock} onChange={set("stock")} {...aria(errors, "stock")} /></Field>
        <Field id="status" label="Status" hint="Only Active products appear in the shop."><select id="status" className={input} value={f.status} onChange={set("status")}><option value="ACTIVE">Active (visible)</option><option value="DRAFT">Draft (hidden)</option><option value="ARCHIVED">Archived (hidden)</option></select></Field>
      </div>
      <Field id="description" label="Description" error={errors.description}><textarea id="description" rows={4} className={input} value={f.description} onChange={set("description")} /></Field>
      <Field id="warranty" label="Warranty (optional)" hint="Only fill this in if you really offer one."><input id="warranty" className={input} value={f.warranty} onChange={set("warranty")} /></Field>
      <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={f.isFeatured} onChange={(e) => setF((x) => ({ ...x, isFeatured: e.target.checked }))} /> Featured product</label>

      <fieldset>
        <legend className="mb-1 text-sm font-bold">Specifications (optional)</legend>
        {specs.map(([k, val], i) => (
          <div key={i} className="mb-2 flex gap-2">
            <input aria-label="Specification name" placeholder="e.g. Body" className={input} value={k} onChange={(e) => setSpecs((s) => s.map((r, j) => (j === i ? [e.target.value, r[1]] : r)))} />
            <input aria-label="Specification value" placeholder="e.g. Spruce top" className={input} value={val} onChange={(e) => setSpecs((s) => s.map((r, j) => (j === i ? [r[0], e.target.value] : r)))} />
            <button type="button" className="px-2 font-bold text-red-700" aria-label="Remove row" onClick={() => setSpecs((s) => s.filter((_, j) => j !== i))}>×</button>
          </div>
        ))}
        <button type="button" className="text-sm font-bold text-electric" onClick={() => setSpecs((s) => [...s, ["", ""]])}>+ Add specification</button>
      </fieldset>

      <fieldset>
        <legend className="mb-1 text-sm font-bold">Photos (JPEG, PNG or WebP, up to 5 MB each)</legend>
        <div className="mb-2 flex flex-wrap gap-3">
          {images.map((im, i) => (
            <div key={im.url} className="w-28 text-center text-xs">
              <img src={im.url} alt={im.alt} className="mb-1 aspect-square w-full rounded-lg border border-slate-200 object-contain bg-white" />
              {i === 0 ? <b>Main photo</b> : <button type="button" className="font-bold text-electric" onClick={() => setImages((x) => [x[i], ...x.filter((_, j) => j !== i)])}>Make main</button>}
              <br /><button type="button" className="font-bold text-red-700" onClick={() => setImages((x) => x.filter((_, j) => j !== i))}>Remove</button>
            </div>
          ))}
        </div>
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading} onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} aria-label="Upload photos" />
        {uploading && <p className="text-sm text-slate-600" role="status">Uploading…</p>}
        <p className="mt-1 text-xs text-slate-500">Use photos of the exact item you sell. Save the product to keep your changes.</p>
      </fieldset>

      <Alert text={msg} />
      <div className="flex gap-2"><button className="btn btn-blue" disabled={busy || uploading}>{busy ? "Saving…" : "Save product"}</button><button type="button" className="btn border border-slate-300" onClick={() => onDone()}>Cancel</button></div>
    </form>
  );
}

export default function Products() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [data, setData] = useState<{ products: AdminProduct[]; pagination: Pager } | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [editing, setEditing] = useState<AdminProduct | "new" | null>(null);
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [reload, setReload] = useState(0);

  const key = sp.toString();
  useEffect(() => {
    admin.products({ q: sp.get("q") ?? undefined, status: sp.get("status") ?? undefined, page: Number(sp.get("page")) || 1 })
      .then(setData).catch((e: Error) => setNotice({ text: e.message, ok: false }));
  }, [key, reload]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { Promise.all([admin.categories(), admin.brands()]).then(([c, b]) => { setCats(c.categories); setBrands(b.brands); }).catch(() => {}); }, []);

  const param = (k: string, v: string | null) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); if (k !== "page") n.delete("page"); setSp(n); };
  const run = async (fn: () => Promise<unknown>, ok: string) => { try { await fn(); setNotice({ text: ok, ok: true }); setReload((r) => r + 1); } catch (e) { setNotice({ text: readError(e).message, ok: false }); } };

  if (editing) return <ProductForm initial={editing === "new" ? null : editing} categories={cats} brands={brands} onDone={(m) => { setEditing(null); if (m) setNotice({ text: m, ok: true }); setReload((r) => r + 1); }} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-extrabold">Products</h1>
        <div className="flex gap-2">
          {isAdmin && <button className="btn border border-slate-300 bg-white" onClick={() => { if (window.confirm("Delete ALL demonstration products? Real products are not touched.")) run(async () => { const r = await admin.deleteDemo(); setNotice({ text: `${r.deleted} demonstration products deleted.`, ok: true }); }, "Done"); }}>Delete demo products</button>}
          <button className="btn btn-gold" onClick={() => { setNotice(null); setEditing("new"); }}>Add product</button>
        </div></div>
      <div className="flex flex-wrap gap-2">
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); param("q", q.trim() || null); }}><input className={`${input} !w-64`} placeholder="Search products" aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} /><button className="btn btn-blue !px-4">Search</button></form>
        <select aria-label="Filter by status" className={`${input} !w-40`} value={sp.get("status") ?? ""} onChange={(e) => param("status", e.target.value || null)}><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="DRAFT">Draft</option><option value="ARCHIVED">Archived</option></select>
      </div>
      <Alert text={notice?.text ?? null} ok={notice?.ok} />
      {!data ? <p className="text-slate-500" role="status">Loading…</p> : data.products.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">No products found. Add your first product.</p> : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-mist text-xs"><tr><th className="p-3">Product</th><th className="p-3">Price</th><th className="p-3">Stock</th><th className="p-3">Status</th><th className="p-3" /></tr></thead>
            <tbody>{data.products.map((p) => (
              <tr key={p.id} className="border-t border-slate-200">
                <td className="p-3"><div className="flex items-center gap-3">{p.images[0] ? <img src={p.images[0].url} alt="" className="h-12 w-12 rounded-lg object-contain bg-white" /> : <div className="placeholder-box h-12 w-12 rounded-lg !text-[9px]">No photo</div>}<div><b>{p.name}</b>{p.isDemo && <span className="ml-2 rounded-full bg-gold px-2 text-xs font-bold text-[#241a00]">Demo</span>}<br /><span className="text-xs text-slate-500">{p.category}{p.brand ? ` · ${p.brand}` : ""}</span></div></div></td>
                <td className="p-3">{naira(p.discountPrice ?? p.price)}{p.discountPrice ? <span className="ml-1 text-xs text-slate-500 line-through">{naira(p.price)}</span> : null}</td>
                <td className="p-3"><div className="flex items-center gap-1"><input aria-label={`Stock for ${p.name}`} inputMode="numeric" className="w-16 rounded border border-slate-300 px-2 py-1" value={drafts[p.id] ?? String(p.stock)} onChange={(e) => setDrafts((d) => ({ ...d, [p.id]: e.target.value }))} />
                  {drafts[p.id] !== undefined && drafts[p.id] !== String(p.stock) && <button className="text-xs font-bold text-electric" onClick={() => { const n = Number(drafts[p.id]); if (!/^\d+$/.test(drafts[p.id])) return setNotice({ text: "Stock must be a whole number.", ok: false }); run(async () => { await admin.setStock(p.id, n); setDrafts((d) => { const c = { ...d }; delete c[p.id]; return c; }); }, "Stock updated."); }}>Save</button>}</div></td>
                <td className="p-3">{p.status.toLowerCase()}</td>
                <td className="p-3 text-right"><button className="mr-3 font-bold text-electric" onClick={() => { setNotice(null); setEditing(p); }}>Edit</button>{isAdmin && <button className="font-bold text-red-700" onClick={() => { if (window.confirm(`Delete "${p.name}"? Past orders keep their details. To just hide it, set the status to Draft instead.`)) run(() => admin.deleteProduct(p.id), "Product deleted."); }}>Delete</button>}</td>
              </tr>))}</tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={data.pagination.page} totalPages={data.pagination.totalPages} onChange={(p) => param("page", p === 1 ? null : String(p))} />}
    </div>
  );
}
