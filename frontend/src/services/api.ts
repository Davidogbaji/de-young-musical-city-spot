import { API_URL } from "../config";
import { Address, AddressInput, Banner, Brand, Category, CheckoutConfig, CreateOrderPayload, OrderSummary, Product, ProductDetail, Testimonial, User } from "../types";

export class ApiRequestError extends Error {
  constructor(message: string, public status: number, public details?: Record<string, string[]>) { super(message); }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const WAKING = new Set([502, 503, 504]);
const WAKE_MESSAGE = "The shop server is waking up after a quiet period. Please try again in a minute.";
let lastOk = 0;

function rawFetch(path: string, init?: RequestInit) {
  return fetch(`${API_URL}/api${path}`, { ...init, credentials: "include", headers: { Accept: "application/json", ...(init?.body && !(init.body instanceof FormData) ? { "Content-Type": "application/json" } : {}) } });
}

// Free hosting puts the server to sleep when idle, and the first request can fail with 502/503/504 while it wakes.
// Keep trying (up to maxMs) instead of showing an error.
async function fetchWithWake(path: string, init: RequestInit | undefined, maxMs: number): Promise<Response> {
  const start = Date.now();
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await rawFetch(path, init);
      if (!WAKING.has(res.status)) { lastOk = Date.now(); return res; }
      if (Date.now() - start >= maxMs) return res;
    } catch {
      if (Date.now() - start >= maxMs) throw new ApiRequestError("Could not reach the server. Check your connection and try again.", 0);
    }
    await sleep(Math.min(2000 + attempt * 1000, 5000));
  }
}

// Before sending anything that changes data (login, orders, uploads), make sure the server is awake so the request is not lost.
export async function ensureAwake(): Promise<void> {
  if (Date.now() - lastOk < 4 * 60 * 1000) return;
  try { await fetchWithWake("/health", undefined, 100_000); } catch { /* the real request will report the problem */ }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isRead = (init?.method ?? "GET").toUpperCase() === "GET";
  if (!isRead) await ensureAwake();
  const res = await fetchWithWake(path, init, isRead ? 100_000 : 0);
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = WAKING.has(res.status) ? WAKE_MESSAGE : body?.error?.message ?? `Request failed (${res.status})`;
    throw new ApiRequestError(message, res.status, body?.error?.details);
  }
  return body as T;
}

export const send = <T,>(method: string, path: string, body?: unknown) => request<T>(path, { method, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });

export interface Pagination { page: number; limit: number; total: number; totalPages: number }
export const api = {
  products: (query = "") => request<{ products: Product[]; pagination: Pagination }>(`/products${query}`),
  product: (slug: string) => request<{ product: ProductDetail; related: Product[] }>(`/products/${encodeURIComponent(slug)}`),
  categories: () => request<{ categories: Category[] }>("/categories"),
  brands: (usedOnly = false) => request<{ brands: Brand[] }>(`/brands${usedOnly ? "?used=true" : ""}`),
  checkoutConfig: () => request<CheckoutConfig>("/checkout/config"),
  // Prices are NOT sent. The server looks them up and calculates the total.
  createOrder: (payload: CreateOrderPayload) => request<{ order: OrderSummary }>("/orders", { method: "POST", body: JSON.stringify(payload) }),
  myOrders: () => request<{ orders: OrderSummary[] }>("/orders/my-orders"),
  myOrder: (reference: string) => request<{ order: OrderSummary }>(`/orders/my-orders/${encodeURIComponent(reference)}`),
  me: () => request<{ user: User | null }>("/auth/me"),
  login: (email: string, password: string) => send<{ user: User }>("POST", "/auth/login", { email, password }),
  register: (b: { fullName: string; email: string; phone: string; password: string }) => send<{ user: User }>("POST", "/auth/register", b),
  logout: () => send<{ ok: true }>("POST", "/auth/logout"),
  forgotPassword: (email: string) => send<{ message: string }>("POST", "/auth/forgot-password", { email }),
  resetPassword: (token: string, password: string) => send<{ message: string }>("POST", "/auth/reset-password", { token, password }),
  updateProfile: (b: { fullName: string; phone: string }) => send<{ user: User }>("PATCH", "/account/profile", b),
  changePassword: (currentPassword: string, newPassword: string) => send<{ message: string }>("POST", "/account/change-password", { currentPassword, newPassword }),
  addresses: () => request<{ addresses: Address[] }>("/account/addresses"),
  addAddress: (b: AddressInput) => send<{ address: Address }>("POST", "/account/addresses", b),
  editAddress: (id: number, b: Partial<AddressInput>) => send<{ address: Address }>("PATCH", `/account/addresses/${id}`, b),
  deleteAddress: (id: number) => send<{ ok: true }>("DELETE", `/account/addresses/${id}`),
  wishlist: () => request<{ products: Product[] }>("/wishlist"),
  wishlistAdd: (productId: number) => send<{ ok: true }>("POST", "/wishlist", { productId }),
  wishlistRemove: (productId: number) => send<{ ok: true }>("DELETE", `/wishlist/${productId}`),
  settings: () => request<{ settings: Record<string, string> }>("/settings"),
  banners: () => request<{ banners: Banner[] }>("/banners"),
  testimonials: () => request<{ testimonials: Testimonial[] }>("/testimonials"),
  studioEnquiry: (b: Record<string, string>) => send<{ ok: true }>("POST", "/studio-enquiries", b),
  subscribe: (email: string, consent: boolean) => send<{ message: string }>("POST", "/newsletter", { email, consent }),
  unsubscribe: (token: string) => send<{ message: string }>("POST", "/newsletter/unsubscribe", { token }),
  getOrder: (reference: string, email: string) => request<{ order: OrderSummary }>(`/orders/${encodeURIComponent(reference)}?email=${encodeURIComponent(email)}`),
};
