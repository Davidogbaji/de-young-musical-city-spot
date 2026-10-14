import { FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import WhatsAppIcon from "../components/WhatsAppIcon";
import { PAYMENT_LABELS } from "../utils/constants";
import { useAuth } from "../context/AuthContext";
import { useSeo } from "../hooks/useSeo";
import { api } from "../services/api";
import { OrderSummary } from "../types";
import { naira, whatsappLink } from "../utils/format";

function savedEmail(ref: string): string {
  try { return sessionStorage.getItem(`dy_order_${ref}`) ?? ""; } catch { return ""; }
}

export default function OrderPage() {
  const { reference = "" } = useParams();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  useSeo(`Order ${reference} | De Young Musical and City Spot`);
  const [email, setEmail] = useState<string>((location.state as { email?: string } | null)?.email ?? savedEmail(reference));
  const [typed, setTyped] = useState("");
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authLoading || (!email && !user)) return;
    let off = false;
    setLoading(true); setError(null);
    (email ? api.getOrder(reference, email) : api.myOrder(reference))
      .then((r) => { if (!off) setOrder(r.order); })
      .catch((e: Error) => { if (!off) setError(e.message); })
      .finally(() => { if (!off) setLoading(false); });
    return () => { off = true; };
  }, [reference, email, user?.id, authLoading]);

  const lookup = (e: FormEvent) => { e.preventDefault(); setEmail(typed.trim().toLowerCase()); };

  if (authLoading) return <p className="p-16 text-center text-slate-500" role="status">Loading…</p>;
  if ((!email && !user) || (error && !order)) {
    return (
      <section className="mx-auto max-w-md px-4 py-16">
        <h1 className="mb-2 text-2xl font-extrabold">Find your order</h1>
        <p className="mb-4 text-slate-600">Order {reference}. Enter the email address you used when ordering.</p>
        {error && <p role="alert" className="mb-3 rounded-lg border border-red-300 bg-red-50 p-3 text-red-800">{error === "Order not found" ? "We could not find an order with that reference and email." : error}</p>}
        <form onSubmit={lookup} className="flex gap-2">
          <input type="email" required value={typed} onChange={(e) => setTyped(e.target.value)} aria-label="Email address" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2.5" />
          <button className="btn btn-blue">View order</button>
        </form>
      </section>
    );
  }
  if (loading || !order) return <p className="p-16 text-center text-slate-500" role="status">Loading your order…</p>;

  const o = order;
  const wa = whatsappLink(`Hello De Young Musical and City Spot, I placed order ${o.reference}:\n${o.items.map((i) => `${i.quantity} x ${i.name}`).join("\n")}\nTotal: ${naira(o.total)}${o.feeToBeConfirmed ? " (delivery to be confirmed)" : ""}\nName: ${o.fullName}\nPlease confirm payment details and delivery.`);
  const pay = PAYMENT_LABELS[o.paymentMethod];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-5">
        <h1 className="text-2xl font-extrabold text-emerald-900">Order received</h1>
        <p className="mt-1">Thank you, {o.fullName}. Your order reference is <b className="font-mono">{o.reference}</b>. Keep it for any enquiry.</p>
        <p className="mt-2 text-sm"><b>Payment status: Not yet paid.</b> Your order is held until the business confirms your payment arrangement.</p>
      </div>

      <section className="mt-6 rounded-xl border border-slate-200 p-5">
        <h2 className="mb-2 text-lg font-extrabold">What happens next</h2>
        <p className="text-sm text-slate-700">{pay?.title}: {pay?.help}</p>
        {o.paymentMethod === "BANK_TRANSFER" && <p className="mt-2 text-sm text-slate-700">Bank account details: [to be supplied by the business]. Message us on WhatsApp to receive them.</p>}
        {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn mt-4 bg-[#1fa855] text-white hover:bg-[#188a45]"><WhatsAppIcon size={18} /> Send my order on WhatsApp</a>}
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 p-5">
        <h2 className="mb-2 text-lg font-extrabold">Order details</h2>
        <ul className="divide-y divide-slate-200 text-sm">
          {o.items.map((i) => <li key={i.name} className="flex justify-between gap-3 py-2"><span>{i.quantity} × {i.name}</span><b>{naira(i.unitPrice * i.quantity)}</b></li>)}
        </ul>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{naira(o.subtotal)}</dd></div>
          <div className="flex justify-between"><dt>Delivery</dt><dd>{o.feeToBeConfirmed ? "To be confirmed by the business" : naira(o.deliveryFee)}</dd></div>
          <div className="flex justify-between border-t border-slate-300 pt-2 text-lg font-extrabold"><dt>{o.feeToBeConfirmed ? "Total so far" : "Total"}</dt><dd>{naira(o.total)}</dd></div>
        </dl>
        <p className="mt-3 text-sm text-slate-600">{o.deliveryMethod === "pickup" ? "Store pickup" : `Deliver to: ${o.addressLine}, ${o.city}, ${o.state}`}</p>
      </section>
      <div className="mt-6 text-center"><Link to="/shop" className="btn btn-blue">Continue shopping</Link></div>
    </div>
  );
}
