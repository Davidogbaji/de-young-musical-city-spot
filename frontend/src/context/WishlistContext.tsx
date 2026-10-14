import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { Product } from "../types";
import { useAuth } from "./AuthContext";

interface WishCtx {
  items: Product[];
  loading: boolean;
  has: (id: number) => boolean;
  // Returns false when the visitor must log in first.
  toggle: (p: Product) => Promise<boolean>;
}
const Ctx = createContext<WishCtx | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { setItems([]); return; }
    setLoading(true);
    api.wishlist().then((r) => setItems(r.products)).catch(() => setItems([])).finally(() => setLoading(false));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const has = useCallback((id: number) => items.some((i) => i.id === id), [items]);
  const toggle = useCallback(async (p: Product) => {
    if (!user) return false;
    try {
      if (items.some((i) => i.id === p.id)) { await api.wishlistRemove(p.id); setItems((x) => x.filter((i) => i.id !== p.id)); }
      else { await api.wishlistAdd(p.id); setItems((x) => [p, ...x]); }
    } catch { /* leave the heart as it was */ }
    return true;
  }, [user, items]);

  const value = useMemo(() => ({ items, loading, has, toggle }), [items, loading, has, toggle]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useWishlist() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWishlist must be used inside WishlistProvider");
  return c;
}
