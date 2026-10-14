import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Brand, Category } from "../types";
import { input, readError } from "../utils/forms";
import { admin, uploadImage } from "./adminApi";

function CategoryRow({ c, canEdit, done }: { c: Category; canEdit: boolean; done: (m: string, ok?: boolean) => void }) {
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(c.name);
  const [img, setImg] = useState(c.imageUrl ?? "");
  const [up, setUp] = useState(false);
  const save = async () => { try { await admin.updateCategory(c.id, { name, imageUrl: img || null }); setEdit(false); done("Category saved."); } catch (e) { done(readError(e).message, false); } };
  const pick = async (f: FileList | null) => { if (!f?.[0]) return; setUp(true); try { setImg(await uploadImage(f[0])); } catch (e) { done(readError(e).message, false); } finally { setUp(false); } };
  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      {(edit ? img : c.imageUrl) ? <img src={(edit ? img : c.imageUrl)!} alt="" className="h-12 w-16 rounded object-contain bg-white" /> : <div className="placeholder-box h-12 w-16 rounded !text-[9px]">No photo</div>}
      {edit ? <>
        <input aria-label="Category name" className={`${input} !w-56`} value={name} onChange={(e) => setName(e.target.value)} />
        <input type="file" accept="image/jpeg,image/png,image/webp" aria-label="Category photo" disabled={up} onChange={(e) => pick(e.target.files)} className="text-xs" />
        <button className="font-bold text-electric" onClick={save}>Save</button><button className="font-bold" onClick={() => setEdit(false)}>Cancel</button>
      </> : <>
        <b className="flex-1">{c.name}</b>
        {canEdit && <><button className="font-bold text-electric" onClick={() => setEdit(true)}>Edit</button>
          <button className="font-bold text-red-700" onClick={async () => { if (!window.confirm(`Delete category "${c.name}"?`)) return; try { await admin.deleteCategory(c.id); done("Category deleted."); } catch (e) { done(readError(e).message, false); } }}>Delete</button></>}
      </>}
    </li>
  );
}

export default function Catalog() {
  const { user } = useAuth();
  const canEdit = user?.role === "ADMIN";
  const [cats, setCats] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [newCat, setNewCat] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);
  const load = () => Promise.all([admin.categories(), admin.brands()]).then(([c, b]) => { setCats(c.categories); setBrands(b.brands); }).catch((e: Error) => setNotice({ text: e.message, ok: false }));
  useEffect(() => { load(); }, []);
  const done = (text: string, ok = true) => { setNotice({ text, ok }); load(); };
  const add = async (fn: () => Promise<unknown>, reset: () => void, ok: string) => { try { await fn(); reset(); done(ok); } catch (e) { done(readError(e).message, false); } };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold">Categories and brands</h1>
      {!canEdit && <p className="rounded-lg bg-white p-3 text-sm">Only the shop administrator can change categories and brands.</p>}
      {notice && <p role={notice.ok ? "status" : "alert"} className={`rounded-lg border p-3 ${notice.ok ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-red-300 bg-red-50 text-red-800"}`}>{notice.text}</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-4"><h2 className="mb-2 font-extrabold">Categories</h2>
          <ul className="divide-y divide-slate-200 text-sm">{cats.map((c) => <CategoryRow key={`${c.id}-${c.imageUrl}`} c={c} canEdit={canEdit} done={done} />)}</ul>
          {canEdit && <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); add(() => admin.createCategory({ name: newCat }), () => setNewCat(""), "Category added."); }}><input aria-label="New category name" placeholder="New category" className={input} value={newCat} onChange={(e) => setNewCat(e.target.value)} /><button className="btn btn-blue !px-4">Add</button></form>}
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-4"><h2 className="mb-2 font-extrabold">Brands</h2>
          <ul className="divide-y divide-slate-200 text-sm">{brands.map((b) => <li key={b.id} className="flex items-center justify-between py-2"><b>{b.name}</b>{canEdit && <button className="font-bold text-red-700" onClick={async () => { if (!window.confirm(`Delete brand "${b.name}"?`)) return; try { await admin.deleteBrand(b.id); done("Brand deleted."); } catch (e) { done(readError(e).message, false); } }}>Delete</button>}</li>)}</ul>
          <p className="mt-2 text-xs text-slate-500">Listing a brand is not a claim to be an authorised dealer. Only add brands you actually sell.</p>
          {canEdit && <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); add(() => admin.createBrand(newBrand), () => setNewBrand(""), "Brand added."); }}><input aria-label="New brand name" placeholder="New brand" className={input} value={newBrand} onChange={(e) => setNewBrand(e.target.value)} /><button className="btn btn-blue !px-4">Add</button></form>}
        </section>
      </div>
    </div>
  );
}
