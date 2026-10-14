import { API_URL } from "../config";
import { Address, AddressInput, Banner, Brand, Category, CheckoutConfig, CreateOrderPayload, OrderSummary, Product, ProductDetail, Testimonial, User } from "../types";

export class ApiRequestError extends Error {
  constructor(message: string, public status: number, public details?: Record<string, string[]>) { super(message); }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, { ...init, credentials: "include", headers: { Accept: "application/json", ...(init?.body ? { "Content-Type": "application/json" } : {}) } });
  } catch {
    throw new ApiRequestError("Could not reach the server. Check your connection and try again.", 0);
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new ApiRequestError(body?.error?.message ?? `Request failed (${res.status})`, res.status, body?.error?.details);
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
