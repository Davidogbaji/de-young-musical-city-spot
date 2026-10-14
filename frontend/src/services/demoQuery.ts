import { Pagination } from "./api";
import { DEMO_PRODUCTS, slugify } from "./demoData";
import { Product } from "../types";

// Mirrors the backend filters so the shop page behaves the same without an API (development only).
export function demoList(sp: URLSearchParams, limit = 12): { products: Product[]; pagination: Pagination } {
  let list = [...DEMO_PRODUCTS];
  const q = sp.get("q")?.toLowerCase();
  if (q) list = list.filter((p) => `${p.name} ${p.cat}`.toLowerCase().includes(q));
  const cat = sp.get("category");
  if (cat) list = list.filter((p) => slugify(p.cat) === cat);
  const min = Number(sp.get("minPrice")), max = Number(sp.get("maxPrice"));
  if (sp.get("minPrice")) list = list.filter((p) => p.price >= min);
  if (sp.get("maxPrice")) list = list.filter((p) => p.price <= max);
  if (sp.get("inStock") === "true") list = list.filter((p) => p.inStock);
  const sort = sp.get("sort");
  if (sort === "price_asc") list.sort((a, b) => a.price - b.price);
  else if (sort === "price_desc") list.sort((a, b) => b.price - a.price);
  else if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
  const page = Math.max(1, Number(sp.get("page")) || 1);
  return {
    products: list.slice((page - 1) * limit, page * limit),
    pagination: { page, limit, total: list.length, totalPages: Math.max(1, Math.ceil(list.length / limit)) },
  };
}
