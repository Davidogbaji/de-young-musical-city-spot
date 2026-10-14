import { useEffect, useState } from "react";
import { USE_DEMO_FALLBACK } from "../config";
import { api } from "../services/api";
import { DEMO_BRANDS, DEMO_CATEGORIES } from "../services/demoData";
import { Brand, Category } from "../types";

interface Lookups { categories: Category[]; brands: Brand[] }
let cache: Promise<Lookups> | null = null;
function fetchLookups(): Promise<Lookups> {
  if (!cache) {
    cache = Promise.all([api.categories(), api.brands(true)])
      .then(([c, b]) => ({ categories: c.categories, brands: b.brands }))
      .catch((e) => { cache = null; throw e; });
  }
  return cache;
}

// Categories and brands for menus and filters. Falls back to demo lists only in development.
export function useLookups(): Lookups {
  const [data, setData] = useState<Lookups>(USE_DEMO_FALLBACK ? { categories: DEMO_CATEGORIES, brands: DEMO_BRANDS } : { categories: [], brands: [] });
  useEffect(() => { fetchLookups().then(setData).catch(() => { /* keep fallback */ }); }, []);
  return data;
}
