import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import WhatsAppIcon from "../components/WhatsAppIcon";
import WishlistButton from "../components/WishlistButton";
import { USE_DEMO_FALLBACK } from "../config";
import { useCart } from "../context/CartContext";
import { useSettings } from "../context/SettingsContext";
import { useSeo } from "../hooks/useSeo";
import { api } from "../services/api";
import { DEMO_PRODUCTS } from "../services/demoData";
import { Product, ProductDetail } from "../types";
import { naira, productEnquiry, whatsappLink } from "../utils/format";

export default function ProductPage() {
  const { slug = "" } = useParams();
  const nav = useNavigate();
  const { add, openDrawer } = useCart();
  const { settings } = useSettings();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let off = false;
    setLoading(true); setError(null); setNotFound(false); setActive(0); setQty(1);
    api.product(slug)
      .then((r) => { if (!off) { setProduct(r.product); setRelated(r.related); } })
      .catch((e: Error) => {
        if (off) return;
        const demo = USE_DEMO_FALLBACK ? DEMO_PRODUCTS.find((p) => p.slug === slug) : undefined;
        if (demo) { setProduct({ ...demo, model: null, images: [], brand: null, specs: null, warranty: null }); setRelated(DEMO_PRODUCTS.filter((p) => p.cat === demo.cat && p.id !== demo.id).slice(0, 4)); }
        else if (/not found/i.test(e.message)) setNotFound(true);
        else setError(e.message);
      })
      .finally(() => { if (!off) setLoading(false); });
    return () => { off = true; };
  }, [slug]);

  useSeo(product ? `${product.name} | De Young Musical and City Spot` : "Product | De Young Musical and City Spot",
    product ? `${product.name} for ${naira(product.price)}. ${product.inStock ? "In stock." : "Currently out of stock."}` : undefined);

  // Structured data with real price and availability. Skipped for demo products and never includes invented ratings.
  useEffect(() => {
    if (!product || product.isDemo) return;
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.text = JSON.stringify({
      "@context": "https://schema.org", "@type": "Product", name: product.name, description: product.description || undefined,
      image: product.images.map((i) => i.url), brand: product.brand ? { "@type": "Brand", name: product.brand.name } : undefined,
      offers: { "@type": "Offer", priceCurrency: "NGN", price: product.price, url: window.location.href,
        availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
    });
    document.head.appendChild(s);
    return () => { s.remove(); };
  }, [product]);

  if (loading) return <p className="p-16 text-center text-slate-500" role="status">Loading product…</p>;
  if (error) return <div className="p-16 text-center" role="alert"><p className="mb-3">We could not load this product: {error}</p><button className="btn btn-blue" onClick={() => nav(0)}>Try again</button></div>;
  if (notFound || !product) return <div className="p-16 text-center"><h1 className="mb-2 text-2xl font-extrabold">Product not found</h1><p className="mb-4 text-slate-600">It may have been removed or the link is wrong.</p><Link to="/shop" className="btn btn-blue">Browse all products</Link></div>;

  const p = product;
  const wa = whatsappLink(productEnquiry(p));
  const img = p.images[active];
  const specs = p.specs ? Object.entries(p.specs) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-500">
        <Link to="/" className="hover:underline">Home</Link> / <Link to="/shop" className="hover:underline">Shop</Link> / <Link to={`/shop?category=${p.category?.slug ?? ""}`} className="hover:underline">{p.cat}</Link> / {p.name}
      </nav>
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          {img ? <img src={img.url} alt={img.alt || p.name} className="aspect-square w-full rounded-xl border border-slate-200 bg-mist object-contain" />
               : <div className="placeholder-box aspect-square w-full rounded-xl border border-slate-200" role="img" aria-label="Product Image placeholder">Product Image</div>}
          {p.images.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {p.images.map((im, i) => (
                <button key={im.url} onClick={() => setActive(i)} aria-label={`Show image ${i + 1}`} aria-current={i === active}
                  className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${i === active ? "border-electric" : "border-slate-200"}`}>
                  <img src={im.url} alt="" loading="lazy" className="h-full w-full object-contain bg-white" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {p.isDemo && <span className="mb-2 inline-block rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-[#241a00]">Demonstration data</span>}
          <h1 className="text-3xl font-extrabold leading-tight">{p.name}</h1>
          <p className="mt-1 text-sm text-slate-600">{[p.brand?.name, p.model].filter(Boolean).join(" · ") || p.cat}</p>
          <p className="mt-4 text-3xl font-extrabold text-navy">{naira(p.price)}{p.oldPrice ? <span className="ml-3 text-lg font-normal text-slate-500 line-through">{naira(p.oldPrice)}</span> : null}</p>
          <p className="mt-2 font-bold">Availability: <span className={p.inStock ? "text-emerald-700" : "text-red-700"}>{p.inStock ? `In Stock (${p.stock} available)` : "Out of Stock"}</span></p>

          {p.inStock && (
            <div className="mt-5 flex items-center gap-3">
              <span className="text-sm font-bold">Quantity</span>
              <button className="h-10 w-10 rounded-lg border border-slate-300" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
              <span className="w-8 text-center font-bold" aria-live="polite">{qty}</span>
              <button className="h-10 w-10 rounded-lg border border-slate-300" onClick={() => setQty((q) => Math.min(p.stock, q + 1))} disabled={qty >= p.stock} aria-label="Increase quantity">+</button>
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="btn btn-gold" disabled={!p.inStock} onClick={() => { add(p, qty); openDrawer(); }}>Add to Cart</button>
            <button className="btn btn-blue" disabled={!p.inStock} onClick={() => { add(p, qty); nav("/checkout"); }}>Buy Now</button>
            {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" className="btn bg-[#1fa855] text-white hover:bg-[#188a45]"><WhatsAppIcon size={18} /> WhatsApp enquiry</a>
                : <span className="btn cursor-not-allowed bg-slate-300 text-white" title="WhatsApp number not set"><WhatsAppIcon size={18} /> WhatsApp enquiry</span>}
            <WishlistButton product={p} variant="full" />
          </div>

          <div className="mt-8 space-y-4 text-sm">
            <div><h2 className="mb-1 text-lg font-extrabold">Description</h2><p className="whitespace-pre-line text-slate-700">{p.description || "Description coming soon."}</p></div>
            {specs.length > 0 && (
              <div><h2 className="mb-1 text-lg font-extrabold">Specifications</h2>
                <table className="w-full text-left"><tbody>{specs.map(([k, v]) => <tr key={k} className="border-b border-slate-200"><th className="w-1/3 py-2 pr-3 font-bold">{k}</th><td className="py-2">{String(v)}</td></tr>)}</tbody></table></div>
            )}
            <div><h2 className="mb-1 text-lg font-extrabold">Delivery</h2><p className="text-slate-700">{settings.delivery_info || "Delivery options and fees: [to be confirmed by the business]. Ask on WhatsApp before ordering."}</p></div>
            <div><h2 className="mb-1 text-lg font-extrabold">Warranty and returns</h2><p className="text-slate-700">{p.warranty ?? (settings.warranty_info || "Warranty and return terms: [to be confirmed by the business].")}</p></div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 text-2xl font-extrabold">Related products</h2>
          <div className="grid grid-cols-1 gap-3 min-[340px]:grid-cols-2 md:grid-cols-3 md:gap-5 lg:grid-cols-4">{related.map((r) => <ProductCard key={r.id} product={r} />)}</div>
        </section>
      )}
    </div>
  );
}
