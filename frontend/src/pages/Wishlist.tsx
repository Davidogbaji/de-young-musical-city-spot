import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useWishlist } from "../context/WishlistContext";
import { useSeo } from "../hooks/useSeo";

export default function Wishlist() {
  useSeo("My wishlist | De Young Musical and City Spot");
  const { items, loading } = useWishlist();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-extrabold">My wishlist</h1>
      {loading && <p className="text-slate-500" role="status">Loading…</p>}
      {!loading && items.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-600">Your wishlist is empty. Tap the heart on any product to save it here. <Link to="/shop" className="font-bold text-electric hover:underline">Browse products</Link></p>}
      <div className="grid grid-cols-1 gap-3 min-[340px]:grid-cols-2 md:grid-cols-3 md:gap-5 lg:grid-cols-4">{items.map((p) => <ProductCard key={p.id} product={p} />)}</div>
    </div>
  );
}
