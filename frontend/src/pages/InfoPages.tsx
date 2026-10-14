import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import WhatsAppIcon from "../components/WhatsAppIcon";
import { BUSINESS } from "../config";
import { telHref, useSettings } from "../context/SettingsContext";
import { useSeo } from "../hooks/useSeo";
import { api } from "../services/api";
import { readError } from "../utils/forms";
import { whatsappLink } from "../utils/format";

const Page = ({ title, children }: { title: string; children: React.ReactNode }) => <section className="mx-auto max-w-3xl px-4 py-12"><h1 className="mb-6 text-3xl font-extrabold">{title}</h1>{children}</section>;
const Todo = ({ what }: { what: string }) => <p className="rounded-lg border border-dashed border-amber-500 bg-amber-50 p-4 text-sm">{what} has not been added yet. The shop owner can add it in Admin &gt; Settings.</p>;

export function About() {
  useSeo(`About us | ${BUSINESS.name}`, "About De Young Musical and City Spot.");
  const { settings } = useSettings();
  return <Page title={`About ${BUSINESS.name}`}>{settings.about_text ? <p className="whitespace-pre-line text-slate-700">{settings.about_text}</p> : <Todo what="The About text" />}
    <p className="mt-6"><Link to="/contact" className="font-bold text-electric hover:underline">Contact us</Link></p></Page>;
}

export function Contact() {
  useSeo(`Contact us | ${BUSINESS.name}`, "Phone, WhatsApp and email for De Young Musical and City Spot.");
  const { settings, phone, email } = useSettings();
  const wa = whatsappLink(`Hello ${BUSINESS.name}, I have a question.`);
  return (
    <Page title="Contact us">
      <ul className="space-y-3 text-slate-800">
        <li><b>Phone:</b> <a className="text-electric hover:underline" href={telHref(phone)}>{phone}</a></li>
        <li><b>Email:</b> <a className="text-electric hover:underline" href={`mailto:${email}`}>{email}</a></li>
        {settings.address && <li><b>Address:</b> {settings.address}</li>}
        {settings.opening_hours && <li><b>Opening hours:</b> {settings.opening_hours}</li>}
      </ul>
      {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn mt-6 bg-[#1fa855] text-white hover:bg-[#188a45]"><WhatsAppIcon size={18} /> Chat on WhatsApp</a>}
      {!settings.address && <p className="mt-6 text-sm text-slate-500">Our shop address will appear here once added.</p>}
    </Page>
  );
}

export function Policy({ title, settingKey }: { title: string; settingKey: string }) {
  useSeo(`${title} | ${BUSINESS.name}`);
  const { settings } = useSettings();
  return <Page title={title}>{settings[settingKey] ? <p className="whitespace-pre-line text-slate-700">{settings[settingKey]}</p> : <Todo what={`The ${title.toLowerCase()} text`} />}</Page>;
}

export function Unsubscribe() {
  useSeo(`Unsubscribe | ${BUSINESS.name}`);
  const [sp] = useSearchParams();
  const token = sp.get("token") ?? "";
  const [state, setState] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { document.title = `Unsubscribe | ${BUSINESS.name}`; }, []);
  const go = async () => { setBusy(true); try { setState({ ok: true, text: (await api.unsubscribe(token)).message }); } catch (e) { setState({ ok: false, text: readError(e).message }); } finally { setBusy(false); } };
  return (
    <Page title="Unsubscribe from our newsletter">
      {!token ? <p>This link is incomplete.</p> : state ? <p role="status" className={state.ok ? "text-emerald-800" : "text-red-800"}>{state.text}</p> : <button className="btn btn-blue" onClick={go} disabled={busy}>{busy ? "Working…" : "Yes, unsubscribe me"}</button>}
    </Page>
  );
}
