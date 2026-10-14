import { useEffect, useState } from "react";
import { USE_DEMO_FALLBACK } from "../config";
import { api } from "../services/api";
import { DEMO_CATEGORIES, DEMO_PRODUCTS } from "../services/demoData";
import { Category, Product } from "../types";

interface State { products: Product[]; categories: Category[]; loading: boolean; error: string | null; demo: boolean }

export function useCatalog(limit = 8): State & { retry: () => void } {
  const [state, setState] = useState<State>({ products: [], categories: [], loading: true, error: null, demo: false });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.all([api.products(`?limit=${limit}&featured=true`).then((r) => (r.products.length ? r : api.products(`?limit=${limit}`))), api.categories()])
      .then(([p, c]) => {
        if (!cancelled) setState({ products: p.products, categories: c.categories, loading: false, error: null, demo: p.products.some((x) => x.isDemo) });
      })
      .catch((e: Error) => {
        if (cancelled) return;
        if (USE_DEMO_FALLBACK) setState({ products: DEMO_PRODUCTS, categories: DEMO_CATEGORIES, loading: false, error: null, demo: true });
        else setState({ products: [], categories: [], loading: false, error: e.message, demo: false });
      });
    return () => { cancelled = true; };
  }, [limit, attempt]);

  return { ...state, retry: () => setAttempt((a) => a + 1) };
}
