import { API_URL } from "../config";
import { ApiRequestError, request, send } from "../services/api";
import { Category, Brand, OrderSummary } from "../types";

export interface AdminProduct {
  id: number; name: string; slug: string; description: string; model: string | null; price: number; discountPrice: number | null;
  stock: number; status: "ACTIVE" | "DRAFT" | "ARCHIVED"; isFeatured: boolean; isDemo: boolean; categoryId: number; brandId: number | null;
  category: string; brand: string | null; specs: Record<string, string> | null; warranty: string | null; images: { url: string; alt: string }[];
}
export type ProductInput = Omit<AdminProduct, "id" | "isDemo" | "category" | "brand" | "slug"> & { slug?: string };
export type AdminOrder = OrderSummary & { id: number; email: string; phone: string };
export interface Enquiry {
  id: number; fullName: string; phone: string; email: string | null; studioType: string; budgetRange: string | null; location: string | null;
  requirements: string; contactMethod: string; status: "NEW" | "CONTACTED" | "QUOTED" | "CLOSED"; createdAt: string;
}
export interface AdminBanner { id: number; title: string; imageUrl: string | null; linkUrl: string | null; position: number; active: boolean }
export interface AdminTestimonial { id: number; name: string; quote: string; published: boolean }
export interface Pager { page: number; limit: number; total: number; totalPages: number }
export interface Dashboard {
  ordersByStatus: Record<string, number>; awaitingAction: number; orders30: number; paidRevenue30: number; activeProducts: number;
  lowStockThreshold: number; lowStock: { id: number; name: string; stock: number }[]; recentOrders: AdminOrder[]; newEnquiries: number;
}

const qs = (o: Record<string, string | number | undefined>) => {
  const p = new URLSearchParams();
  Object.entries(o).forEach(([k, v]) => v !== undefined && v !== "" && p.set(k, String(v)));
  const s = p.toString();
  return s ? `?${s}` : "";
};

export const admin = {
  dashboard: () => request<Dashboard>("/admin/dashboard"),
  products: (o: { q?: string; status?: string; page?: number }) => request<{ products: AdminProduct[]; pagination: Pager }>(`/admin/products${qs({ ...o, limit: 15 })}`),
  createProduct: (b: Partial<ProductInput>) => send<{ product: AdminProduct }>("POST", "/admin/products", b),
  updateProduct: (id: number, b: Partial<ProductInput>) => send<{ product: AdminProduct }>("PATCH", `/admin/products/${id}`, b),
  deleteProduct: (id: number) => send<{ ok: true }>("DELETE", `/admin/products/${id}`),
  deleteDemo: () => send<{ deleted: number }>("DELETE", "/admin/products/demo"),
  setStock: (id: number, stock: number) => send<{ product: AdminProduct }>("PATCH", `/admin/inventory/${id}`, { stock }),
  categories: () => request<{ categories: Category[] }>("/categories"),
  brands: () => request<{ brands: Brand[] }>("/brands"),
  createCategory: (b: Partial<Category> & { name: string }) => send("POST", "/admin/categories", b),
  updateCategory: (id: number, b: Record<string, unknown>) => send("PATCH", `/admin/categories/${id}`, b),
  deleteCategory: (id: number) => send("DELETE", `/admin/categories/${id}`),
  createBrand: (name: string) => send("POST", "/admin/brands", { name }),
  deleteBrand: (id: number) => send("DELETE", `/admin/brands/${id}`),
  zones: () => request<{ zones: { state: string; fee: number }[] }>("/admin/delivery-zones"),
  saveZone: (state: string, fee: number) => send("PUT", "/admin/delivery-zones", { state, fee }),
  deleteZone: (state: string) => send("DELETE", `/admin/delivery-zones/${encodeURIComponent(state)}`),
  enquiries: (o: { status?: string; page?: number }) => request<{ enquiries: Enquiry[]; pagination: Pager }>(`/admin/studio-enquiries${qs({ ...o, limit: 15 })}`),
  updateEnquiry: (id: number, status: string) => send("PATCH", `/admin/studio-enquiries/${id}`, { status }),
  banners: () => request<{ banners: AdminBanner[] }>("/admin/banners"),
  addBanner: (b: Partial<AdminBanner>) => send("POST", "/admin/banners", b),
  editBanner: (id: number, b: Partial<AdminBanner>) => send("PATCH", `/admin/banners/${id}`, b),
  removeBanner: (id: number) => send("DELETE", `/admin/banners/${id}`),
  testimonials: () => request<{ testimonials: AdminTestimonial[] }>("/admin/testimonials"),
  addTestimonial: (b: Partial<AdminTestimonial>) => send("POST", "/admin/testimonials", b),
  editTestimonial: (id: number, b: Partial<AdminTestimonial>) => send("PATCH", `/admin/testimonials/${id}`, b),
  removeTestimonial: (id: number) => send("DELETE", `/admin/testimonials/${id}`),
  saveSettings: (b: Record<string, string>) => send<{ settings: Record<string, string> }>("PUT", "/admin/settings", b),
  subscribers: (page: number) => request<{ subscribers: { id: number; email: string; subscribedAt: string }[]; pagination: Pager }>(`/admin/newsletter${qs({ page })}`),
  orders: (o: { status?: string; q?: string; page?: number }) => request<{ orders: AdminOrder[]; pagination: Pager }>(`/admin/orders${qs({ ...o, limit: 15 })}`),
  updateOrder: (id: number, b: { status?: string; markPaid?: boolean }) => send<{ order: AdminOrder }>("PATCH", `/admin/orders/${id}`, b),
};

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("image", file);
  let res: Response;
  try { res = await fetch(`${API_URL}/api/admin/uploads`, { method: "POST", body: form, credentials: "include" }); }
  catch { throw new ApiRequestError("Could not reach the server.", 0); }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiRequestError(body?.error?.message ?? "Upload failed", res.status);
  return body.url as string;
}

export async function downloadOrdersCsv(o: { status?: string; q?: string }) {
  const res = await fetch(`${API_URL}/api/admin/orders/export.csv${qs(o)}`, { credentials: "include" });
  if (!res.ok) throw new ApiRequestError("Export failed", res.status);
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url; a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

export async function downloadCsv(path: string, filename: string) {
  const res = await fetch(`${API_URL}/api${path}`, { credentials: "include" });
  if (!res.ok) throw new ApiRequestError("Export failed", res.status);
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
