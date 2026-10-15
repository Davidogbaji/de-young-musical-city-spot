import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { API_URL, BUSINESS, normalizeNumber, runtime } from "../config";

interface SettingsCtx { settings: Record<string, string>; phone: string; email: string }
const Ctx = createContext<SettingsCtx>({ settings: {}, phone: BUSINESS.phoneDisplay, email: BUSINESS.email });

// Loads the business details once before the page appears, so the WhatsApp number is right from the first click.
// If the server is slow or down, the built-in defaults are used after 3 seconds.
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Record<string, string> | null>(null);
  useEffect(() => {
    fetch(`${API_URL}/api/health`).catch(() => {}); // starts waking a sleeping server straight away
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 3000);
    fetch(`${API_URL}/api/settings`, { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : { settings: {} }))
      .then((j) => (j.settings ?? {}) as Record<string, string>)
      .catch(() => ({}) as Record<string, string>)
      .then((s) => { clearTimeout(timer); if (s.whatsapp_number) runtime.whatsapp = normalizeNumber(s.whatsapp_number); setSettings(s); });
    return () => { clearTimeout(timer); ctl.abort(); };
  }, []);
  const value = useMemo<SettingsCtx>(() => ({ settings: settings ?? {}, phone: settings?.contact_phone || BUSINESS.phoneDisplay, email: settings?.contact_email || BUSINESS.email }), [settings]);
  if (!settings) return <p className="p-16 text-center text-slate-500" role="status">Loading…</p>;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useSettings = () => useContext(Ctx);
export const telHref = (display: string) => "tel:" + display.replace(/[^\d+]/g, "");
