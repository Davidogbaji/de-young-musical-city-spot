import { FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { SlidersHorizontal } from "lucide-react";
import Pagination from "../components/Pagination";
import ProductCard from "../components/ProductCard";
import { USE_DEMO_FALLBACK } from "../config";
import { useLookups } from "../hooks/useLookups";
import { useSeo } from "../hooks/useSeo";
import { api, Pagination as PageInfo } from "../services/api";
import { demoList } from "../services/demoQuery";
import { Product } from "../types";

const LIMIT = 12;
const FILTER_KEYS = ["q", "category", "brand", "minPrice", "maxPrice", "inStock"];

export default function Shop() {
  const [sp, setSp] = useSearchParams();
  const { categories, brands } = useLookups();
  const [data, setData] = useState<{ products: Product[]; pagination: PageInfo } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [minP, setMinP] = useState(sp.get("minPrice") ?? "");
  const [maxP, setMaxP] = useState(sp.get("maxPrice") ?? "");
  const [retry, setRetry] = useState(0);

  const key = sp.toString();
  const catName = categories.find((c) => c.slug === sp.get("category"))?.name;
  useSeo(`${catName ?? "Shop all"} | De Young Musical and City Spot`, `Browse ${catName ?? "musical instruments, audio, DJ and studio equipment"} with prices in naira.`);

  useEffect(() => {
    setQ(sp.get("q") ?? ""); setMinP(sp.get("minPrice") ?? ""); setMaxP(sp.get("maxPrice") ?? "");
    let off = false;
    setLoading(true); setError(null);
    const qs = new URLSearchParams(sp); qs.set("limit", String(LIMIT));
    api.products(`?${qs.toString()}`)
      .then((r) => { if (!off) { setData(r); setDemo(r.products.some((p) => p.isDemo)); setLoading(false); } })
      .catch((e: Error) => {
        if (off) return;
        if (USE_DEMO_FALLBACK) { setData(demoList(sp, LIMIT)); setDemo(true); } else setError(e.message);
        setLoading(false);
      });
    return () => { off = true; };
  }, [key, retry]); // eslint-disable-line react-hooks/exhaustive-deps

  const setParams = (changes: Record<string, string | null>) => {
    const n = new URLSearchParams(sp);
    for (const [k, v] of Object.entries(changes)) v ? n.set(k, v) : n.delete(k);
    if (!("page" in changes)) n.delete("page");
    setSp(n);
  };
  const onSearch = (e: FormEvent) => { e.preventDefault(); setParams({ q: q.trim() || null }); };
  const onPrice = (e: FormEvent) => {
    e.preventDefault();
    const a = Math.max(0, Math.floor(Number(minP) || 0)), b = Math.max(0, Math.floor(Number(maxP) || 0));
    setParams({ minPrice: a ? String(a) : null, maxPrice: b ? String(b) : null });
  };
  const hasFilters = FILTER_KEYS.some((k) => sp.has(k));
  const pg = data?.pagination;
  const input = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

  const filters = (
    <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-4">
      <form onSubmit={onSearch}>
        <label className="mb-1 block text-sm font-bold" htmlFor="shop-q">Search</label>
        <div className="flex gap-2"><input id="shop-q" className={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Guitar, mic, mixer" /><button className="btn btn-blue !px-3">Go</button></div>
      </form>
      <div>
        <label className="mb-1 block text-sm font-bold" htmlFor="shop-cat">Category</label>
        <select id="shop-cat" className={input} value={sp.get("category") ?? ""} onChange={(e) => setParams({ category: e.target.value || null })}>
          <option value="">All categories</option>{categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-bold" htmlFor="shop-brand">Brand</label>
        <select id="shop-brand" className={input} value={sp.get("brand") ?? ""} onChange={(e) => setParams({ brand: e.target.value || null })}>
          <option value="">All brands</option>{brands.map((b) => <option key={b.id} value={b.slug}>{b.name}</option>)}
        </select>
      </div>
      <form onSubmit={onPrice}>
        <span className="mb-1 block text-sm font-bold">Price (₦)</span>
        <div className="flex items-center gap-2">
          <input className={input} inputMode="numeric" value={minP} onChange={(e) => setMinP(e.target.value)} placeholder="Min" aria-label="Minimum price" />
          <input className={input} inputMode="numeric" value={maxP} onChange={(e) => setMaxP(e.target.value)} placeholder="Max" aria-label="Maximum price" />
        </div>
        <button className="btn btn-blue mt-2 w-full !py-2">Apply price</button>
      </form>
      <label className="flex items-center gap-2 text-sm font-bold">
        <input type="checkbox" checked={sp.get("inStock") === "true"} onChange={(e) => setParams({ inStock: e.target.checked ? "true" : null })} /> In stock only
      </label>
      {hasFilters && <button className="w-full rounded-lg border border-slate-300 py-2 text-sm font-bold hover:border-red-400" onClick={() => setSp(new URLSearchParams())}>Clear filters</button>}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-2 text-sm text-slate-500"><Link to="/" className="hover:underline">Home</Link> / Shop{catName ? ` / ${catName}` : ""}</nav>
      <h1 className="text-3xl font-extrabold">{catName ?? "Shop all products"}</h1>
      {demo && <p className="mt-1"><span className="rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-[#241a00]">Demonstration data</span> <span className="text-sm text-slate-500">Replace with real inventory in the admin dashboard.</span></p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside>
          <button className="btn mb-3 w-full border border-slate-300 lg:hidden" aria-expanded={showFilters} onClick={() => setShowFilters((s) => !s)}><SlidersHorizontal size={16} /> Filters</button>
          <div className={`${showFilters ? "block" : "hidden"} lg:block`}>{filters}</div>
        </aside>
        <section aria-live="polite">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">{pg ? `Showing ${data!.products.length} of ${pg.total} products` : "Loading…"}</p>
            <label className="flex items-center gap-2 text-sm font-bold">Sort by
              <select className="rounded-lg border border-slate-300 px-2 py-2 font-normal" value={sp.get("sort") ?? "newest"} onChange={(e) => setParams({ sort: e.target.value === "newest" ? null : e.target.value })}>
                <option value="newest">Newest</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="name">Name</option>
              </select>
            </label>
          </div>
          {loading && <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500" role="status">Loading products…</div>}
          {error && <div className="rounded-xl border border-dashed border-red-300 p-12 text-center" role="alert"><p className="mb-3">We could not load products: {error}</p><button className="btn btn-blue" onClick={() => setRetry((r) => r + 1)}>Try again</button></div>}
          {!loading && !error && data && data.products.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-600"><p className="mb-3">No products match these filters.</p>{hasFilters && <button className="btn btn-blue" onClick={() => setSp(new URLSearchParams())}>Clear filters</button>}</div>
          )}
          {!loading && data && data.products.length > 0 && (
            <div className="grid grid-cols-1 gap-3 min-[340px]:grid-cols-2 md:grid-cols-3 md:gap-5">
              {data.products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
          {pg && !loading && <Pagination page={pg.page} totalPages={pg.totalPages} onChange={(p) => { setParams({ page: p === 1 ? null : String(p) }); window.scrollTo({ top: 0 }); }} />}
        </section>
      </div>
    </div>
  );
}
