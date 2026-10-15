import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSeo } from "../hooks/useSeo";

const LINKS: [string, string][] = [["/admin", "Dashboard"], ["/admin/products", "Products"], ["/admin/orders", "Orders"], ["/admin/catalog", "Categories and brands"], ["/admin/delivery", "Delivery fees"], ["/admin/enquiries", "Studio enquiries"], ["/admin/content", "Banners and testimonials"], ["/admin/studio-photos", "Studio photos"], ["/admin/settings", "Settings"], ["/admin/subscribers", "Newsletter"]];

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-16 text-center text-slate-500" role="status">Loading…</p>;
  if (!user) return <section className="mx-auto max-w-md px-4 py-20 text-center"><h1 className="mb-3 text-2xl font-extrabold">Staff login</h1><p className="mb-4 text-slate-600">Log in with your staff account to open the dashboard.</p><Link className="btn btn-blue" to="/login?next=/admin">Log in</Link></section>;
  if (user.role === "CUSTOMER") return <section className="mx-auto max-w-md px-4 py-20 text-center"><h1 className="mb-3 text-2xl font-extrabold">No access</h1><p className="mb-4 text-slate-600">This area is for store staff only.</p><Link className="btn btn-blue" to="/">Back to the shop</Link></section>;
  return <>{children}</>;
}

export default function AdminLayout() {
  useSeo("Admin | De Young Musical and City Spot");
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-mist">
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <b>De Young admin</b>
          <div className="flex items-center gap-3 text-sm"><span>{user?.fullName} ({user?.role.toLowerCase()})</span><Link to="/" className="underline">View shop</Link><button onClick={async () => { await logout(); nav("/"); }} className="underline">Log out</button></div>
        </div>
        <nav aria-label="Admin" className="border-t border-[#1d3270] bg-[#0a1a40]"><ul className="mx-auto flex max-w-7xl overflow-x-auto px-2">
          {LINKS.map(([to, label]) => <li key={to}><NavLink to={to} end={to === "/admin"} className={({ isActive }) => `block whitespace-nowrap px-3 py-2.5 text-sm font-semibold ${isActive ? "bg-[#17306b] text-white" : "text-slate-300 hover:text-white"}`}>{label}</NavLink></li>)}
        </ul></nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6"><Outlet /></main>
    </div>
  );
}
