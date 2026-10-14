import { Heart } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { Product } from "../types";

export default function WishlistButton({ product, variant = "icon" }: { product: Product; variant?: "icon" | "full" }) {
  const { has, toggle } = useWishlist();
  const nav = useNavigate();
  const loc = useLocation();
  const on = has(product.id);
  const click = async () => {
    if (!(await toggle(product))) nav(`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`);
  };
  const label = on ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`;
  if (variant === "full") {
    return <button type="button" onClick={click} aria-pressed={on} className="btn border border-slate-300"><Heart size={16} className={on ? "fill-red-500 text-red-500" : ""} /> {on ? "In wishlist" : "Add to Wishlist"}</button>;
  }
  return (
    <button type="button" onClick={click} aria-pressed={on} aria-label={label} title={label}
      className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow hover:bg-white">
      <Heart size={18} className={on ? "fill-red-500 text-red-500" : "text-slate-600"} />
    </button>
  );
}
