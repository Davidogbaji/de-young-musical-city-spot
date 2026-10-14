import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { Product } from "../types";
import { naira, productEnquiry, whatsappLink } from "../utils/format";
import WhatsAppIcon from "./WhatsAppIcon";
import WishlistButton from "./WishlistButton";

export default function ProductCard({ product: p }: { product: Product }) {
  const { add, openDrawer } = useCart();
  const [imgFailed, setImgFailed] = useState(false);
  const wa = whatsappLink(productEnquiry(p));

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="relative">
      {p.image && !imgFailed ? (
        <img src={p.image} alt={p.name} loading="lazy" onError={() => setImgFailed(true)} className="aspect-[4/3] w-full bg-mist object-contain" />
      ) : (
        <div className="placeholder-box aspect-[4/3] w-full" role="img" aria-label="Product Image placeholder">Product Image</div>
      )}
      <WishlistButton product={p} />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="text-[15px] font-bold leading-snug"><Link to={`/product/${p.slug}`} className="hover:text-electric">{p.name}</Link></h3>
        <p className="text-xl font-extrabold text-navy">
          {naira(p.price)}
          {p.oldPrice ? <span className="ml-2 text-sm font-normal text-slate-500 line-through">{naira(p.oldPrice)}</span> : null}
        </p>
        <p className="text-sm font-bold">
          Availability: <span className={p.inStock ? "text-emerald-700" : "text-red-700"}>{p.inStock ? "In Stock" : "Out of Stock"}</span>
        </p>
        <Link to={`/product/${p.slug}`} className="text-sm font-bold text-electric hover:underline">View details</Link>
        <div className="mt-auto flex gap-2 pt-2">
          <button className="btn btn-gold flex-1 !px-2" disabled={!p.inStock} onClick={() => { add(p); openDrawer(); }}>Order Now</button>
          {wa ? (
            <a href={wa} target="_blank" rel="noopener noreferrer" aria-label={`WhatsApp enquiry about ${p.name}`}
               className="btn w-11 bg-[#1fa855] !px-0 text-white hover:bg-[#188a45]"><WhatsAppIcon /></a>
          ) : (
            <span className="btn w-11 cursor-not-allowed bg-slate-300 !px-0 text-white" title="WhatsApp number not set"><WhatsAppIcon /></span>
          )}
        </div>
      </div>
    </article>
  );
}
