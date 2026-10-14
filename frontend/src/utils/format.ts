import { runtime } from "../config";
import { Product } from "../types";

export const naira = (n: number) => "₦" + n.toLocaleString("en-NG");

export function whatsappLink(message: string): string | null {
  if (!runtime.whatsapp) return null;
  return `https://wa.me/${runtime.whatsapp}?text=${encodeURIComponent(message)}`;
}
export const productEnquiry = (p: Pick<Product, "name" | "price">) =>
  `Hello De Young Musical and City Spot, I am interested in ${p.name}, priced at ${naira(p.price)}. Please confirm availability and delivery details.`;
export const STUDIO_ENQUIRY =
  "Hello, I would like to enquire about studio setup services. Please provide information about available packages and pricing.";
