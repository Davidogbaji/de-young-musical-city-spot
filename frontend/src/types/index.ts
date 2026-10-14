export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  inStock: boolean;
  image: string | null;
  cat: string;
  isDemo?: boolean;
}
export interface Category { id: number; name: string; slug: string; imageUrl?: string | null }
export interface CartItem { id: number; name: string; price: number; quantity: number; stock: number }
export interface Brand { id: number; name: string; slug: string }
export interface ProductDetail extends Product {
  model: string | null;
  images: { url: string; alt: string }[];
  brand: Brand | null;
  category?: Category;
  specs: Record<string, string> | null;
  warranty: string | null;
}
export type PaymentMethod = "ONLINE" | "BANK_TRANSFER" | "PAY_ON_DELIVERY" | "WHATSAPP_CONFIRM";
export interface CheckoutConfig { paymentMethods: PaymentMethod[]; deliveryZones: { state: string; fee: number }[] }
export interface OrderSummary {
  reference: string; status: string; paymentMethod: PaymentMethod; paymentStatus: "NOT_PAID" | "PAID";
  deliveryMethod: "delivery" | "pickup"; fullName: string; city: string; state: string; addressLine: string; notes: string | null;
  subtotal: number; deliveryFee: number; total: number; feeToBeConfirmed: boolean; createdAt: string;
  items: { name: string; unitPrice: number; quantity: number }[];
}
export interface CreateOrderPayload {
  fullName: string; email: string; phone: string; addressLine: string; city: string; state: string; notes: string;
  deliveryMethod: "delivery" | "pickup"; paymentMethod: PaymentMethod; items: { productId: number; quantity: number }[];
}
export interface Banner { id: number; title: string; imageUrl: string | null; linkUrl: string | null }
export interface Testimonial { id: number; name: string; quote: string }
export interface User { id: number; email: string; fullName: string; phone: string | null; role: "CUSTOMER" | "STAFF" | "ADMIN" }
export interface Address { id: number; label: string | null; line1: string; city: string; state: string; phone: string | null; isDefault: boolean }
export type AddressInput = { label?: string; line1: string; city: string; state: string; phone?: string; isDefault?: boolean };
