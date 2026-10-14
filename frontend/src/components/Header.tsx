import { FormEvent, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Heart, Menu, ShoppingCart, User, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { telHref, useSettings } from "../context/SettingsContext";
import { useCart } from "../context/CartContext";
import { useLookups } from "../hooks/useLookups";
import { naira } from "../utils/format";

const NAV: [string, string][] = [
  ["Home", "/"], ["Shop All", "/shop"], ["Musical Instruments", "/shop"],
  ["Studio Equipment", "/shop?category=studio-recording-equipment"], ["DJ Equipment", "/shop?category=dj-controllers-and-mixers"],
  ["Audio and PA Systems", "/shop?category=speakers-and-pa-systems"], ["Microphones", "/shop?category=microphones"],
  ["Accessories", "/shop?category=headphones-and-accessories"], ["Studio Setup Services", "/studio-setup"],
  ["About Us", "/about"], ["Contact Us", "/contact"],
];

export default function Header() {
  const { count, subtotal, openDrawer } = useCart();
  const { user } = useAuth();
  const { settings, phone, email } = useSettings();
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const nav = useNavigate();
  const { categories } = useLookups();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (cat) p.set("category", cat);
    nav(`/shop?${p.toString()}`);
    setMenu(false);
  };

  return (
    <header className="sticky top-0 z-20">
      <div className="bg-ink text-[13px] text-slate-300">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-x-6 gap-y-1 px-4 py-1.5">
          <a href={telHref(phone)}>Customer service: {phone}</a>
          <a href={`mailto:${email}`} className="hidden sm:inline">{email}</a>
          <span className="hidden lg:inline">{settings.delivery_info || "Delivery, warranty and returns: [to be confirmed by the business]"}</span>
        </div>
      </div>
      <div className="bg-navy text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <button className="lg:hidden" aria-label={menu ? "Close menu" : "Open menu"} aria-expanded={menu} onClick={() => setMenu((m) => !m)}>{menu ? <X /> : <Menu />}</button>
          <Link to="/" className="text-lg font-extrabold leading-tight">De Young Musical<small className="hidden text-[11px] tracking-[1.5px] text-gold sm:block">AND CITY SPOT</small></Link>
          <form onSubmit={submit} role="search" className="hidden min-w-0 flex-1 md:flex">
            <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Category" className="max-w-[170px] rounded-l-lg border-0 bg-slate-100 px-2 text-sm text-ink">
              <option value="">All categories</option>
              {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
            </select>
            <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Search guitars, drums, mics, DJ gear" aria-label="Search products" className="min-w-0 flex-1 border-0 px-3 py-2.5 text-ink" />
            <button className="rounded-r-lg bg-electric px-5 font-bold">Search</button>
          </form>
          <div className="ml-auto flex items-center gap-3">
            <Link to="/wishlist" aria-label="Wishlist" className="hidden sm:block"><Heart /></Link>
            <Link to={user ? "/account" : "/login"} aria-label={user ? "My account" : "Log in"} className="hidden items-center gap-1 text-sm font-bold sm:flex"><User />{user ? user.fullName.split(" ")[0] : "Log in"}</Link>
            <button onClick={openDrawer} aria-label={`Open cart, ${count} items`} className="flex items-center gap-2 rounded-lg bg-gold px-3 py-2 text-sm font-extrabold text-[#241a00]">
              <ShoppingCart size={18} /> {count} <span className="hidden sm:inline">· {naira(subtotal)}</span>
            </button>
          </div>
        </div>
        <form onSubmit={submit} role="search" className="flex px-4 pb-3 md:hidden">
          <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Search products" aria-label="Search products" className="min-w-0 flex-1 rounded-l-lg px-3 py-2.5 text-ink" />
          <button className="rounded-r-lg bg-electric px-4 font-bold">Search</button>
        </form>
        <nav aria-label="Main" className={`border-t border-[#1d3270] bg-[#0a1a40] ${menu ? "block" : "hidden"} lg:block`}>
          <ul className="mx-auto flex max-w-7xl flex-col px-2 lg:flex-row lg:overflow-x-auto">
            <li className="sm:hidden"><NavLink to={user ? "/account" : "/login"} onClick={() => setMenu(false)} className="block rounded px-3 py-2.5 text-sm font-semibold text-gold">{user ? "My account" : "Log in or create account"}</NavLink></li>
            {NAV.map(([label, to]) => (
              <li key={label}><NavLink to={to} onClick={() => setMenu(false)} className="block whitespace-nowrap rounded px-3 py-2.5 text-sm font-semibold text-slate-200 hover:bg-[#17306b] hover:text-white">{label}</NavLink></li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
