import { z } from "zod";

export const listProductsQuery = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.string().trim().max(100).optional(),
  brand: z.string().trim().max(100).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  inStock: z.enum(["true", "false"]).optional().transform((v) => (v === "true" ? true : undefined)),
  featured: z.enum(["true", "false"]).optional().transform((v) => (v === "true" ? true : undefined)),
  sort: z.enum(["newest", "price_asc", "price_desc", "name"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(12),
});
export type ListProductsQuery = z.infer<typeof listProductsQuery>;
