import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CartItem, Product } from "../types";

interface CartCtx {
  items: CartItem[];
  count: number;
  subtotal: number;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  add: (p: Product, qty?: number) => void;
  setQty: (id: number, qty: number) => void;
  remove: (id: number) => void;
  clear: () => void;
}
const Ctx = createContext<CartCtx | null>(null);
const KEY = "dy_cart_v1";

function load(): CartItem[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(raw) ? raw : [];
  } catch { return []; }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(load);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage unavailable */ } }, [items]);

  const add = useCallback((p: Product, qty = 1) => {
    if (p.stock < 1) return;
    setItems((cur) => {
      const found = cur.find((i) => i.id === p.id);
      if (found) return cur.map((i) => (i.id === p.id ? { ...i, price: p.price, stock: p.stock, quantity: Math.min(i.quantity + qty, p.stock) } : i));
      return [...cur, { id: p.id, name: p.name, price: p.price, stock: p.stock, quantity: Math.min(qty, p.stock) }];
    });
  }, []);
  const setQty = useCallback((id: number, qty: number) =>
    setItems((cur) => cur.flatMap((i) => (i.id !== id ? [i] : qty < 1 ? [] : [{ ...i, quantity: Math.min(qty, i.stock) }]))), []);
  const remove = useCallback((id: number) => setItems((cur) => cur.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartCtx>(() => ({
    items,
    count: items.reduce((s, i) => s + i.quantity, 0),
    // Display-only. The server recalculates prices at checkout (Stage 4).
    subtotal: items.reduce((s, i) => s + i.price * i.quantity, 0),
    drawerOpen, openDrawer: () => setDrawerOpen(true), closeDrawer: () => setDrawerOpen(false),
    add, setQty, remove, clear,
  }), [items, drawerOpen, add, setQty, remove, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
