import { FormEvent, ReactNode, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { NIGERIAN_STATES, PAYMENT_LABELS } from "../utils/constants";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useSeo } from "../hooks/useSeo";
import { api, ApiRequestError } from "../services/api";
import { Address, CheckoutConfig } from "../types";
import { naira } from "../utils/format";

type Form = { fullName: string; email: string; phone: string; addressLine: string; city: string; state: string; notes: string; deliveryMethod: "delivery" | "pickup"; paymentMethod: string };
const EMPTY: Form = { fullName: "", email: "", phone: "", addressLine: "", city: "", state: "", notes: "", deliveryMethod: "delivery", paymentMethod: "" };
const input = "w-full rounded-lg border border-slate-300 px-3 py-2.5";

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-bold">{label}</label>
      {children}
      {error && <p id={`${id}-err`} className="mt-1 text-sm text-red-700">{error}</p>}
    </div>
  );
}

export default function Checkout() {
  useSeo("Checkout | De Young Musical and City Spot");
  const { items, subtotal, clear } = useCart();
  const nav = useNavigate();
  const { user } = useAuth();
  const [saved, setSaved] = useState<Address[]>([]);
  const [cfg, setCfg] = useState<CheckoutConfig | null>(null);
  const [cfgError, setCfgError] = useState<string | null>(null);
  const [f, setF] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.checkoutConfig()
      .then((c) => { setCfg(c); setF((x) => ({ ...x, paymentMethod: c.paymentMethods[0] ?? "" })); })
      .catch((e: Error) => setCfgError(e.message));
  }, []);

  useEffect(() => {
    if (!user) { setSaved([]); return; }
    setF((x) => ({ ...x, fullName: x.fullName || user.fullName, email: x.email || user.email, phone: x.phone || (user.phone ?? "") }));
    api.addresses().then((r) => setSaved(r.addresses)).catch(() => setSaved([]));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const useSaved = (id: string) => {
    const a = saved.find((s) => String(s.id) === id);
    if (a) setF((x) => ({ ...x, addressLine: a.line1, city: a.city, state: a.state }));
  };
  const set = (k: keyof Form) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));
  const zone = cfg?.deliveryZones.find((z) => z.state === f.state);
  const feeText = f.deliveryMethod === "pickup" ? naira(0) : !f.state ? "Choose your state" : zone ? naira(zone.fee) : "To be confirmed";
  const feeKnown = f.deliveryMethod === "pickup" || !!zone;
  const total = subtotal + (feeKnown ? (f.deliveryMethod === "pickup" ? 0 : zone!.fee) : 0);

  const validate = () => {
    const e: Record<string, string> = {};
    if (f.fullName.trim().length < 2) e.fullName = "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = "Enter a valid email address";
    if (!/^\+?\d{10,15}$/.test(f.phone.replace(/[\s()-]/g, ""))) e.phone = "Enter a valid phone number";
    if (f.deliveryMethod === "delivery" && f.addressLine.trim().length < 5) e.addressLine = "Enter your delivery address";
    if (!f.state) e.state = "Choose your state";
    if (f.city.trim().length < 2) e.city = "Enter your city";
    if (!f.paymentMethod) e.paymentMethod = "Choose a payment option";
    return e;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setFormError(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) { document.getElementById("checkout-form")?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus(); return; }
    setSubmitting(true);
    try {
      const { order } = await api.createOrder({ ...f, paymentMethod: f.paymentMethod as never, items: items.map((i) => ({ productId: i.id, quantity: i.quantity })) });
      try { sessionStorage.setItem(`dy_order_${order.reference}`, f.email.trim().toLowerCase()); } catch { /* storage unavailable */ }
      clear();
      nav(`/order/${order.reference}`, { replace: true, state: { email: f.email.trim().toLowerCase() } });
    } catch (err) {
      if (err instanceof ApiRequestError && err.details) {
        setErrors(Object.fromEntries(Object.entries(err.details).map(([k, v]) => [k, v[0]])));
      }
      setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally { setSubmitting(false); }
  };

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-extrabold">Your cart is empty</h1>
        <p className="my-4 text-slate-600">Add a product to start your order.</p>
        <Link to="/shop" className="btn btn-blue">Browse products</Link>
      </section>
    );
  }
  const ai = (k: string) => ({ "aria-invalid": errors[k] ? true : undefined, "aria-describedby": errors[k] ? `${k}-err` : undefined } as const);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-extrabold">Checkout</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <form id="checkout-form" onSubmit={submit} noValidate className="space-y-5">
          {!user && <p className="rounded-lg bg-mist p-3 text-sm">Have an account? <Link to="/login?next=/checkout" className="font-bold text-electric hover:underline">Log in</Link> to use saved details and see this order in your history. Or just continue as a guest.</p>}
          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="mb-2 text-lg font-extrabold">Your details</legend>
            <Field id="fullName" label="Full name" error={errors.fullName}><input id="fullName" autoComplete="name" className={input} value={f.fullName} onChange={set("fullName")} {...ai("fullName")} /></Field>
            <Field id="phone" label="Phone number" error={errors.phone}><input id="phone" type="tel" autoComplete="tel" className={input} value={f.phone} onChange={set("phone")} {...ai("phone")} /></Field>
            <div className="sm:col-span-2"><Field id="email" label="Email address" error={errors.email}><input id="email" type="email" autoComplete="email" className={input} value={f.email} onChange={set("email")} {...ai("email")} /></Field></div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-2 text-lg font-extrabold">Delivery</legend>
            <div className="flex flex-wrap gap-4 text-sm font-bold">
              {(["delivery", "pickup"] as const).map((m) => (
                <label key={m} className="flex items-center gap-2"><input type="radio" name="dm" checked={f.deliveryMethod === m} onChange={() => setF((x) => ({ ...x, deliveryMethod: m }))} /> {m === "delivery" ? "Delivery to my address" : "Store pickup"}</label>
              ))}
            </div>
            {f.deliveryMethod === "delivery" && saved.length > 0 && (
              <Field id="saved" label="Use a saved address"><select id="saved" className={input} defaultValue="" onChange={(e) => useSaved(e.target.value)}><option value="">Choose…</option>{saved.map((a) => <option key={a.id} value={a.id}>{a.label || a.line1}</option>)}</select></Field>
            )}
            {f.deliveryMethod === "delivery" && <Field id="addressLine" label="Delivery address" error={errors.addressLine}><input id="addressLine" autoComplete="street-address" className={input} value={f.addressLine} onChange={set("addressLine")} {...ai("addressLine")} /></Field>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="state" label="State" error={errors.state}>
                <select id="state" className={input} value={f.state} onChange={set("state")} {...ai("state")}><option value="">Choose state</option>{NIGERIAN_STATES.map((s) => <option key={s}>{s}</option>)}</select>
              </Field>
              <Field id="city" label="City or area" error={errors.city}><input id="city" autoComplete="address-level2" className={input} value={f.city} onChange={set("city")} {...ai("city")} /></Field>
            </div>
            <Field id="notes" label="Order notes (optional)"><textarea id="notes" rows={2} maxLength={500} className={input} value={f.notes} onChange={set("notes")} /></Field>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-lg font-extrabold">Payment</legend>
            {cfgError && <p role="alert" className="text-red-700">Could not load payment options: {cfgError}</p>}
            <div className={`space-y-2 ${cfg?.paymentMethods.length === 1 ? "hidden" : ""}`}>
              {cfg?.paymentMethods.map((m) => (
                <label key={m} className="flex cursor-pointer gap-3 rounded-lg border border-slate-300 p-3 has-[:checked]:border-electric has-[:checked]:bg-blue-50">
                  <input type="radio" name="pm" className="mt-1" checked={f.paymentMethod === m} onChange={() => setF((x) => ({ ...x, paymentMethod: m }))} />
                  <span><b className="block">{PAYMENT_LABELS[m]?.title ?? m}</b><span className="text-sm text-slate-600">{PAYMENT_LABELS[m]?.help}</span></span>
                </label>
              ))}
            </div>
            {cfg?.paymentMethods.length === 1 && cfg.paymentMethods[0] === "WHATSAPP_CONFIRM" && (
              <p className="rounded-lg border border-slate-300 bg-mist p-3 text-sm"><b>Pay via WhatsApp.</b> After you place your order, message us on WhatsApp to agree payment. Your order is not marked paid until we confirm your payment.</p>
            )}
            {cfg && cfg.paymentMethods.length > 1 && <p className="mt-2 text-sm text-slate-500">Your order is not marked paid until the business confirms your payment.</p>}
            {errors.paymentMethod && <p className="mt-1 text-sm text-red-700">{errors.paymentMethod}</p>}
          </fieldset>

          {formError && <p role="alert" className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">{formError}</p>}
          <button className="btn btn-gold w-full !py-4 text-base" disabled={submitting || !cfg}>{submitting ? "Placing order…" : "Place order"}</button>
        </form>

        <aside className="h-fit rounded-xl border border-slate-200 bg-mist p-4">
          <h2 className="mb-3 text-lg font-extrabold">Order summary</h2>
          <ul className="divide-y divide-slate-200 text-sm">
            {items.map((i) => <li key={i.id} className="flex justify-between gap-3 py-2"><span>{i.quantity} × {i.name}</span><b>{naira(i.price * i.quantity)}</b></li>)}
          </ul>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{naira(subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Delivery</dt><dd>{feeText}</dd></div>
            <div className="flex justify-between border-t border-slate-300 pt-2 text-lg font-extrabold"><dt>{feeKnown ? "Total" : "Total so far"}</dt><dd>{naira(total)}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-slate-500">Final prices and delivery fee are calculated by our server when you place the order. {!feeKnown && f.state && "Delivery to your state will be confirmed by the business."}</p>
          <button className="mt-3 text-sm font-bold text-electric hover:underline" onClick={() => nav("/shop")} type="button">Continue shopping</button>
        </aside>
      </div>
    </div>
  );
}
