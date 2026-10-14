import { useEffect } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { BUSINESS } from "../config";
import { useCart } from "../context/CartContext";
import { naira, whatsappLink } from "../utils/format";

export default function CartDrawer() {
  const { items, subtotal, drawerOpen, closeDrawer, setQty, remove } = useCart();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDrawer();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeDrawer]);

  const message = `Hello ${BUSINESS.name}, I would like to order:\n` +
    items.map((i) => `${i.quantity} x ${i.name} - ${naira(i.price * i.quantity)}`).join("\n") +
    `\nTotal: ${naira(subtotal)}\nPlease confirm availability, delivery and payment details.`;
  const wa = items.length ? whatsappLink(message) : null;

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/50 ${drawerOpen ? "" : "hidden"}`} onClick={closeDrawer} />
      <aside aria-label="Shopping cart" aria-hidden={!drawerOpen}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white transition-transform ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 className="text-lg font-extrabold">Your cart</h2>
          <button onClick={closeDrawer} aria-label="Close cart"><X /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-slate-500">Your cart is empty. Add a product to start your order.</p>
          ) : items.map((i) => (
            <div key={i.id} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 border-b border-slate-200 py-3 text-sm">
              <div><b>{i.name}</b><br />{naira(i.price)}</div>
              <div className="font-bold">{naira(i.price * i.quantity)}</div>
              <div className="flex items-center gap-2">
                <button className="h-7 w-7 rounded border border-slate-300" onClick={() => setQty(i.id, i.quantity - 1)} aria-label={`Decrease ${i.name}`}>−</button>
                <span>{i.quantity}</span>
                <button className="h-7 w-7 rounded border border-slate-300" onClick={() => setQty(i.id, i.quantity + 1)} disabled={i.quantity >= i.stock} aria-label={`Increase ${i.name}`}>+</button>
              </div>
              <button className="text-left text-red-700" onClick={() => remove(i.id)}>Remove</button>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-200 p-4">
          <div className="flex justify-between text-lg font-extrabold"><span>Subtotal</span><span>{naira(subtotal)}</span></div>
          <p className="mt-1 text-xs text-slate-500">Delivery fee is added at checkout. Final prices are confirmed by the server.</p>
          <Link to="/checkout" onClick={closeDrawer} className={`btn btn-gold mt-3 w-full ${items.length ? "" : "pointer-events-none opacity-50"}`}>Checkout</Link>
          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="btn mt-2 w-full bg-[#1fa855] text-white hover:bg-[#188a45]">Send order on WhatsApp</a>}
        </div>
      </aside>
    </>
  );
}
