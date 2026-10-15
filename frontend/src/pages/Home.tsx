import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import ServicePhoto from "../components/ServicePhoto";
import { BUSINESS, SITE_URL } from "../config";
import { useSettings } from "../context/SettingsContext";
import { useCatalog } from "../hooks/useCatalog";
import { useLookups } from "../hooks/useLookups";
import { usePageTitle } from "../hooks/usePageTitle";
import { api } from "../services/api";
import { Banner, Testimonial } from "../types";
import { STUDIO_ENQUIRY, whatsappLink } from "../utils/format";

const SERVICES = ["Home studio setup", "Professional recording studio setup", "Podcast studio setup", "Church audio system setup", "DJ and event sound setup", "Studio equipment consultation"];
const HOME_PHOTO: Record<string, string> = {
  "Home studio setup": "studio_photo_home", "Professional recording studio setup": "studio_photo_professional", "Podcast studio setup": "studio_photo_podcast",
  "Church audio system setup": "studio_photo_church", "DJ and event sound setup": "studio_photo_dj", "Studio equipment consultation": "studio_photo_acoustic",
};
const WHY: [string, string][] = [
  ["Quality equipment", "Instruments and audio gear for stage, church and studio."],
  ["Helpful support", "Ask us on WhatsApp before you buy."],
  ["Product guidance", "Not sure what you need? We will help you choose."],
  ["Studio setup solutions", "From home studios to church sound."],
];

export default function Home() {
  usePageTitle("De Young Musical and City Spot | Instruments, Audio, DJ and Studio Gear");
  const { products, categories, loading, error, demo, retry } = useCatalog(8);
  const { settings } = useSettings();
  const { brands } = useLookups();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  useEffect(() => { api.banners().then((r) => setBanners(r.banners)).catch(() => {}); api.testimonials().then((r) => setTestimonials(r.testimonials)).catch(() => {}); }, []);

  // Business details for search engines. Only details the owner has actually entered are included.
  useEffect(() => {
    const sameAs = ["facebook_url", "instagram_url", "tiktok_url", "x_url", "youtube_url"].map((k) => settings[k]).filter(Boolean);
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.text = JSON.stringify({ "@context": "https://schema.org", "@type": "Store", name: BUSINESS.name, url: SITE_URL,
      telephone: settings.contact_phone || undefined, email: settings.contact_email || undefined,
      address: settings.address ? { "@type": "PostalAddress", streetAddress: settings.address } : undefined, sameAs: sameAs.length ? sameAs : undefined });
    document.head.appendChild(s);
    return () => { s.remove(); };
  }, [settings]);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-deep via-navy to-[#17408f] py-16 text-white md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <h1 className="max-w-[11em] text-4xl font-extrabold leading-[1.02] sm:text-6xl">BRING YOUR SOUND TO LIFE</h1>
          <p className="my-5 max-w-xl text-lg text-slate-200">Discover quality musical instruments, professional audio equipment, DJ gear, and studio solutions for musicians, creators, churches, event professionals, and recording studios.</p>
          <div className="flex flex-wrap gap-3">
            <a href="#products" className="btn btn-gold">SHOP NOW</a>
            <Link to="/studio-setup" className="btn btn-ghost">EXPLORE STUDIO SETUPS</Link>
          </div>
        </div>
      </section>

      {banners.length > 0 && (
        <section aria-label="Promotions" className="mx-auto max-w-7xl px-4 pt-8"><div className="grid gap-3 md:grid-cols-2">
          {banners.map((b) => {
            const body = <div className="overflow-hidden rounded-xl bg-navy">{b.imageUrl && <img src={b.imageUrl} alt="" loading="lazy" className="h-auto w-full" />}<p className={`${b.imageUrl ? "p-3" : "p-6"} text-xl font-extrabold text-white`}>{b.title}</p></div>;
            return b.linkUrl ? (b.linkUrl.startsWith("/") ? <Link key={b.id} to={b.linkUrl}>{body}</Link> : <a key={b.id} href={b.linkUrl} target="_blank" rel="noopener noreferrer">{body}</a>) : <div key={b.id}>{body}</div>;
          })}
        </div></section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="text-3xl font-extrabold">Shop by category</h2>
        <p className="mb-6 text-slate-500">Category photos appear here once the administrator uploads them.</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => (
            <Link key={c.id} to={`/shop?category=${c.slug}`} className="rounded-xl border border-slate-200 border-l-4 border-l-electric bg-mist p-3 font-bold hover:border-l-gold">
              {c.imageUrl ? <img src={c.imageUrl} alt={c.name} loading="lazy" className="mb-2 aspect-[3/2] w-full rounded-lg object-contain bg-white" /> : <div className="placeholder-box mb-2 aspect-[3/2] rounded-lg">Category Image</div>}
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section id="products" className="bg-mist py-12">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-3xl font-extrabold">Featured products</h2>
          <p className="mb-6 text-slate-500">
            {demo && <span className="mr-2 rounded-full bg-gold px-2 py-0.5 text-xs font-bold text-[#241a00]">Demonstration data</span>}
            {demo ? "Replace with real inventory in the admin dashboard." : "Instruments and equipment in stock now."}
          </p>
          {loading && <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500" role="status">Loading products… The first visit after a quiet period can take up to a minute while the server wakes up.</div>}
          {error && (
            <div className="rounded-xl border border-dashed border-red-300 p-10 text-center" role="alert">
              <p className="mb-3">We could not load products: {error}</p>
              <button className="btn btn-blue" onClick={retry}>Try again</button>
            </div>
          )}
          {!loading && !error && products.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">No products yet. Add products in the admin dashboard.</p>}
          <div className="grid grid-cols-1 gap-3 min-[340px]:grid-cols-2 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          <div className="mt-8 text-center"><Link to="/shop" className="btn btn-blue">View All Products</Link></div>
        </div>
      </section>

      {brands.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="text-3xl font-extrabold">Shop by brand</h2>
          <p className="mb-6 text-slate-500">Browse products by brand.</p>
          <ul className="flex flex-wrap gap-3">{brands.map((b) => <li key={b.id}><Link to={`/shop?brand=${b.slug}`} className="block rounded-lg border border-slate-300 px-5 py-3 font-bold hover:border-electric">{b.name}</Link></li>)}</ul>
        </section>
      )}

      <section className="bg-navy py-12 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-3xl font-extrabold">YOUR STUDIO. YOUR SOUND. OUR EXPERTISE.</h2>
          <p className="mb-6 text-slate-300">Studio planning, equipment selection and setup. Availability of each service is to be confirmed by the business.</p>
          <Link to="/studio-setup" className="mb-6 inline-block font-bold text-gold underline">See all studio services and send an enquiry</Link>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s) => {
              const link = whatsappLink(s === "Studio equipment consultation" ? STUDIO_ENQUIRY : `Hello, I would like to request a quote for: ${s}.`);
              return (
                <div key={s} className="flex flex-col gap-3 rounded-xl border border-[#28438a] bg-[#10285f] p-4">
                  <ServicePhoto photoKey={HOME_PHOTO[s]} alt={s} dark />
                  <b>{s}</b>
                  {link && <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-gold hover:underline">Request a Quote</a>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="bg-mist py-12"><div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-6 text-3xl font-extrabold">What our customers say</h2>
          <div className="grid gap-4 md:grid-cols-3">{testimonials.slice(0, 3).map((t) => <figure key={t.id} className="rounded-xl border border-slate-200 bg-white p-5"><blockquote className="text-slate-700">“{t.quote}”</blockquote><figcaption className="mt-3 font-bold">{t.name}</figcaption></figure>)}</div>
        </div></section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="text-3xl font-extrabold">Why shop with us?</h2>
        <p className="mb-6 text-slate-500">Final wording to be confirmed by the business.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {WHY.map(([t, d]) => <div key={t} className="rounded-xl border border-slate-200 p-4"><b className="block">{t}</b>{d}</div>)}
        </div>
      </section>
    </>
  );
}
