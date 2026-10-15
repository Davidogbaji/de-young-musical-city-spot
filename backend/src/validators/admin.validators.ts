import { z } from "zod";
import { NIGERIAN_STATES } from "../utils/states";

const url = z.string().max(500).refine((u) => /^https?:\/\//i.test(u), "Invalid image address");
const slug = z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens").max(160);
const id = z.number().int().positive();

const productBase = z.object({
  name: z.string().trim().min(2, "Enter a product name").max(150),
  slug: slug.optional(),
  description: z.string().trim().max(5000).default(""),
  model: z.string().trim().max(100).nullish().transform((v) => v || null),
  price: z.number({ invalid_type_error: "Enter the price" }).int("Use whole naira").min(1, "Enter the price").max(1_000_000_000),
  discountPrice: z.number().int().min(1).max(1_000_000_000).nullish(),
  stock: z.number({ invalid_type_error: "Enter the stock" }).int().min(0, "Stock cannot be negative").max(100000),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]).default("ACTIVE"),
  isFeatured: z.boolean().default(false),
  categoryId: id,
  brandId: id.nullish(),
  warranty: z.string().trim().max(500).nullish().transform((v) => v || null),
  specs: z.record(z.string().trim().min(1).max(100), z.string().trim().max(300)).nullish(),
  images: z.array(z.object({ url, alt: z.string().trim().max(200).default("") })).max(10).default([]),
});
const discountRule = { path: ["discountPrice"], message: "Discount price must be lower than the price" };
export const productCreate = productBase.refine((v) => v.discountPrice == null || v.discountPrice < v.price, discountRule);
export const productPatch = productBase.partial().refine((v) => v.discountPrice == null || v.price == null || v.discountPrice < v.price, discountRule);
export type ProductCreate = z.infer<typeof productCreate>;
export type ProductPatch = z.infer<typeof productPatch>;

export const adminProductQuery = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export const stockBody = z.object({ stock: z.number().int().min(0).max(100000) });

export const categoryBody = z.object({
  name: z.string().trim().min(2, "Enter a name").max(100),
  slug: slug.optional(),
  description: z.string().trim().max(500).nullish().transform((v) => v || null),
  imageUrl: url.nullish(),
  position: z.number().int().min(0).max(1000).optional(),
});
export const categoryPatch = categoryBody.partial();
export const brandBody = z.object({ name: z.string().trim().min(2, "Enter a name").max(100), slug: slug.optional(), logoUrl: url.nullish() });
export const brandPatch = brandBody.partial();

export const deliveryZoneBody = z.object({ state: z.enum(NIGERIAN_STATES), fee: z.number().int().min(0).max(1_000_000) });

export const ORDER_STATUSES = ["PENDING", "AWAITING_PAYMENT", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"] as const;
export const orderListQuery = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
// "PAID" is set only through markPaid so every paid order has a payment record.
export const orderUpdateBody = z.object({
  status: z.enum(["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]).optional(),
  markPaid: z.boolean().optional(),
}).refine((v) => v.status !== undefined || v.markPaid === true, { message: "Nothing to update" });
