import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import Field, { aria } from "../components/Field";
import ServicePhoto from "../components/ServicePhoto";
import WhatsAppIcon from "../components/WhatsAppIcon";
import { useSeo } from "../hooks/useSeo";
import { api } from "../services/api";
import { input, readError } from "../utils/forms";
import { whatsappLink } from "../utils/format";

const SERVICES: { type: string; text: string; gear: [string, string][] }[] = [
  { type: "Home recording studio", text: "Plan a compact recording space at home with the right interface, microphone, headphones and monitors.", gear: [["Studio equipment", "studio-recording-equipment"], ["Microphones", "microphones"], ["Headphones", "headphones-and-accessories"]] },
  { type: "Professional recording studio", text: "Equipment selection for a larger room, from microphones and monitoring to recording gear.", gear: [["Studio equipment", "studio-recording-equipment"], ["Microphones", "microphones"], ["Speakers", "speakers-and-pa-systems"]] },
  { type: "Podcast studio", text: "Clear voice recording for one presenter or a full table of guests.", gear: [["Microphones", "microphones"], ["Headphones", "headphones-and-accessories"], ["Studio equipment", "studio-recording-equipment"]] },
  { type: "Church sound system", text: "Speakers, microphones and amplification chosen for your hall and congregation.", gear: [["Speakers and PA", "speakers-and-pa-systems"], ["Microphones", "microphones"], ["Amplifiers", "amplifiers"]] },
  { type: "DJ booth and event setup", text: "Controllers, mixers and sound for parties, venues and events.", gear: [["DJ equipment", "dj-controllers-and-mixers"], ["Speakers and PA", "speakers-and-pa-systems"], ["Amplifiers", "amplifiers"]] },
  { type: "Music production workstation", text: "Keyboards, controllers and monitoring for writing and producing music.", gear: [["Keyboards", "keyboards-and-digital-pianos"], ["Studio equipment", "studio-recording-equipment"], ["Headphones", "headphones-and-accessories"]] },
  { type: "Acoustic treatment and monitoring", text: "Advice on making your room sound accurate and choosing monitor speakers.", gear: [["Studio equipment", "studio-recording-equipment"]] },
];
const PHOTO: Record<string, string> = {
  "Home recording studio": "studio_photo_home", "Professional recording studio": "studio_photo_professional", "Podcast studio": "studio_photo_podcast", "Church sound system": "studio_photo_church",
  "DJ booth and event setup": "studio_photo_dj", "Music production workstation": "studio_photo_production", "Acoustic treatment and monitoring": "studio_photo_acoustic",
};
const BUDGETS = ["Under ₦500,000", "₦500,000 to ₦1,000,000", "₦1,000,000 to ₦3,000,000", "₦3,000,000 to ₦10,000,000", "Above ₦10,000,000", "Not sure yet"];
const EMPTY = { fullName: "", phone: "", email: "", studioType: "", budgetRange: "", location: "", requirements: "", contactMethod: "whatsapp", website: "" };

export default function StudioSetup() {
  useSeo("Studio setup services | De Young Musical and City Spot", "Home, professional, podcast, church and DJ studio setups. Tell us what you need and we will get back to you.");
  const [sp] = useSearchParams();
  const { hash } = useLocation();
  const [f, setF] = useState({ ...EMPTY, studioType: sp.get("type") ?? "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const goForm = (type?: string) => { if (type) setF((x) => ({ ...x, studioType: type })); document.getElementById("enquiry")?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(() => { if (hash === "#enquiry") document.getElementById("enquiry")?.scrollIntoView(); }, [hash]);

  const submit = async (e: FormEvent) => {
    e.preventDefault(); setMsg(null);
    const v: Record<string, string> = {};
    if (f.fullName.trim().length < 2) v.fullName = "Enter your full name";
    if (!/^\+?\d{10,15}$/.test(f.phone.replace(/[\s()-]/g, ""))) v.phone = "Enter a valid phone or WhatsApp number";
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email.trim())) v.email = "Enter a valid email address";
    if (!f.studioType) v.studioType = "Choose the type of studio";
    if (f.requirements.trim().length < 10) v.requirements = "Tell us a little about what you need (at least 10 characters)";
    setErrors(v); if (Object.keys(v).length) return;
    setBusy(true);
    try { await api.studioEnquiry({ ...f }); setDone(true); } // success is shown only after the server confirms
    catch (err) { const r = readError(err); setErrors(r.fields); setMsg(r.message); } finally { setBusy(false); }
  };

  return (
    <div>
      <section className="bg-navy py-12 text-white"><div className="mx-auto max-w-7xl px-4">
        <h1 className="text-4xl font-extrabold">YOUR STUDIO. YOUR SOUND. OUR EXPERTISE.</h1>
        <p className="mt-3 max-w-2xl text-slate-200">Planning and equipment selection for studios, churches and events. Which services we can provide, including installation, is confirmed with you when you enquire. No fixed prices are published: every setup is quoted for your room and budget.</p>
        <button className="btn btn-gold mt-5" onClick={() => goForm()}>Send an enquiry</button>
      </div></section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => {
            const wa = whatsappLink(`Hello, I would like to enquire about: ${s.type}. Please provide information about available packages and pricing.`);
            return (
              <article key={s.type} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4">
                <ServicePhoto photoKey={PHOTO[s.type]} alt={s.type} />
                <h2 className="text-lg font-extrabold">{s.type}</h2>
                <p className="text-sm text-slate-700">{s.text}</p>
                <p className="text-sm"><b>Suggested equipment:</b> {s.gear.map(([n, slug], i) => <span key={slug}>{i > 0 && ", "}<Link className="text-electric hover:underline" to={`/shop?category=${slug}`}>{n}</Link></span>)}</p>
                <div className="mt-auto flex flex-wrap gap-2">
                  <button className="btn btn-gold !py-2" onClick={() => goForm(s.type)}>Request a Quote</button>
                  {wa && <a className="btn bg-[#1fa855] !py-2 text-white hover:bg-[#188a45]" href={wa} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={16} /> WhatsApp</a>}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="enquiry" className="bg-mist py-12"><div className="mx-auto max-w-2xl px-4">
        <h2 className="mb-1 text-3xl font-extrabold">Studio setup enquiry</h2>
        <p className="mb-6 text-slate-600">Tell us about your project and we will contact you.</p>
        {done ? (
          <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-5 text-emerald-900"><b>Thank you, {f.fullName.split(" ")[0]}.</b> Your enquiry has been received. We will contact you by {f.contactMethod === "whatsapp" ? "WhatsApp" : f.contactMethod}.</p>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="fullName" label="Full name" error={errors.fullName}><input id="fullName" autoComplete="name" className={input} value={f.fullName} onChange={set("fullName")} {...aria(errors, "fullName")} /></Field>
              <Field id="phone" label="Phone or WhatsApp number" error={errors.phone}><input id="phone" type="tel" autoComplete="tel" className={input} value={f.phone} onChange={set("phone")} {...aria(errors, "phone")} /></Field>
              <Field id="email" label="Email (optional)" error={errors.email}><input id="email" type="email" autoComplete="email" className={input} value={f.email} onChange={set("email")} {...aria(errors, "email")} /></Field>
              <Field id="studioType" label="Type of studio" error={errors.studioType}><select id="studioType" className={input} value={f.studioType} onChange={set("studioType")} {...aria(errors, "studioType")}><option value="">Choose…</option>{SERVICES.map((s) => <option key={s.type}>{s.type}</option>)}</select></Field>
              <Field id="budgetRange" label="Budget range (₦)"><select id="budgetRange" className={input} value={f.budgetRange} onChange={set("budgetRange")}><option value="">Choose…</option>{BUDGETS.map((b) => <option key={b}>{b}</option>)}</select></Field>
              <Field id="location" label="Location"><input id="location" className={input} placeholder="City and state" value={f.location} onChange={set("location")} /></Field>
            </div>
            <Field id="requirements" label="Equipment or service requirements" error={errors.requirements}><textarea id="requirements" rows={4} className={input} value={f.requirements} onChange={set("requirements")} {...aria(errors, "requirements")} /></Field>
            <Field id="contactMethod" label="Preferred contact method"><select id="contactMethod" className={input} value={f.contactMethod} onChange={set("contactMethod")}><option value="whatsapp">WhatsApp</option><option value="phone">Phone call</option><option value="email">Email</option></select></Field>
            <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}><label>Leave this empty<input tabIndex={-1} autoComplete="off" value={f.website} onChange={set("website")} /></label></div>
            {msg && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">{msg}</p>}
            <button className="btn btn-gold w-full" disabled={busy}>{busy ? "Sending…" : "Send enquiry"}</button>
          </form>
        )}
      </div></section>
    </div>
  );
}
