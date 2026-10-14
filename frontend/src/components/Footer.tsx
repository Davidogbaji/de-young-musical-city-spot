import { Link } from "react-router-dom";
import { BUSINESS } from "../config";
import { telHref, useSettings } from "../context/SettingsContext";
import Newsletter from "./Newsletter";

const SOCIAL: [string, string][] = [["facebook_url", "Facebook"], ["instagram_url", "Instagram"], ["tiktok_url", "TikTok"], ["x_url", "X"], ["youtube_url", "YouTube"]];

export default function Footer() {
  const { settings, phone, email } = useSettings();
  const social = SOCIAL.filter(([k]) => settings[k]);
  return (
    <footer className="bg-ink pb-24 pt-10 text-sm text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:grid-cols-2 lg:grid-cols-4">
        <div><h4 className="mb-2 font-extrabold text-white">{BUSINESS.name}</h4><p>Musical instruments, audio, DJ and studio equipment.</p>
          <p className="mt-2"><Link to="/about" className="underline">About us</Link></p></div>
        <div><h4 className="mb-2 font-extrabold text-white">Shop</h4><ul className="space-y-1">
          <li><Link to="/shop">All products</Link></li><li><Link to="/shop?category=microphones">Microphones</Link></li><li><Link to="/studio-setup">Studio setup services</Link></li></ul></div>
        <div><h4 className="mb-2 font-extrabold text-white">Customer support</h4><ul className="space-y-1">
          <li><Link to="/delivery-returns">Delivery and returns</Link></li><li><Link to="/privacy">Privacy policy</Link></li><li><Link to="/terms">Terms and conditions</Link></li><li><Link to="/contact">Contact us</Link></li></ul></div>
        <div><h4 className="mb-2 font-extrabold text-white">Contact</h4><ul className="space-y-1">
          <li><a href={telHref(phone)}>Phone/WhatsApp: {phone}</a></li>
          <li><a href={`mailto:${email}`}>{email}</a></li>
          {settings.address && <li>{settings.address}</li>}
          {settings.opening_hours && <li>Open: {settings.opening_hours}</li>}</ul>
          {social.length > 0 && <ul className="mt-3 flex flex-wrap gap-3">{social.map(([k, n]) => <li key={k}><a href={settings[k]} target="_blank" rel="noopener noreferrer" className="underline">{n}</a></li>)}</ul>}</div>
      </div>
      <div className="mx-auto mt-8 max-w-7xl border-t border-slate-700 px-4 pt-6"><Newsletter /></div>
    </footer>
  );
}
