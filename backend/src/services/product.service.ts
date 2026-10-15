import { Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import { ApiError } from "../utils/apiError";
import { ListProductsQuery } from "../validators/product.validators";

export const include = {
  category: true,
  brand: true,
  images: { orderBy: { position: "asc" } },
} satisfies Prisma.ProductInclude;
type ProductWithRels = Prisma.ProductGetPayload<{ include: typeof include }>;

// Shape matches what the storefront cards expect (price, oldPrice, stock, image, cat).
export function toDto(p: ProductWithRels) {
  const onSale = p.discountPrice != null && p.discountPrice < p.price;
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    model: p.model,
    price: onSale ? (p.discountPrice as number) : p.price,
    oldPrice: onSale ? p.price : null,
    stock: p.stock,
    inStock: p.stock > 0,
    image: p.images[0]?.url ?? null,
    images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
    cat: p.category.name,
    category: { id: p.category.id, name: p.category.name, slug: p.category.slug },
    brand: p.brand ? { id: p.brand.id, name: p.brand.name, slug: p.brand.slug } : null,
    specs: p.specs,
    warranty: p.warranty,
    isFeatured: p.isFeatured,
    isDemo: p.isDemo,
    createdAt: p.createdAt,
  };
}

export async function listProducts(q: ListProductsQuery) {
  const where: Prisma.ProductWhereInput = { status: "ACTIVE" };
  if (q.q) {
    where.OR = [
      { name: { contains: q.q, mode: "insensitive" } },
      { description: { contains: q.q, mode: "insensitive" } },
      { model: { contains: q.q, mode: "insensitive" } },
      { brand: { name: { contains: q.q, mode: "insensitive" } } },
      { category: { name: { contains: q.q, mode: "insensitive" } } },
    ];
  }
  if (q.category) where.category = { slug: q.category };
  if (q.brand) where.brand = { slug: q.brand };
  if (q.minPrice != null || q.maxPrice != null) where.price = { gte: q.minPrice, lte: q.maxPrice };
  if (q.inStock) where.stock = { gt: 0 };
  if (q.featured) where.isFeatured = true;

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    q.sort === "price_asc" ? { price: "asc" }
    : q.sort === "price_desc" ? { price: "desc" }
    : q.sort === "name" ? { name: "asc" }
    : { createdAt: "desc" };

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, include, orderBy, skip: (q.page - 1) * q.limit, take: q.limit }),
  ]);
  return {
    products: rows.map(toDto),
    pagination: { page: q.page, limit: q.limit, total, totalPages: Math.max(1, Math.ceil(total / q.limit)) },
  };
}

export async function getProduct(idOrSlug: string) {
  const isId = /^\d+$/.test(idOrSlug);
  const row = await prisma.product.findFirst({
    where: { status: "ACTIVE", ...(isId ? { id: Number(idOrSlug) } : { slug: idOrSlug }) },
    include,
  });
  if (!row) throw new ApiError(404, "Product not found");
  const related = await prisma.product.findMany({
    where: { status: "ACTIVE", categoryId: row.categoryId, id: { not: row.id } },
    include, take: 4, orderBy: { createdAt: "desc" },
  });
  return { product: toDto(row), related: related.map(toDto) };
}

export const listCategories = () => prisma.category.findMany({ orderBy: { position: "asc" } });
// usedOnly: just brands that currently have an active product (for the public site). Admin lists all.
export const listBrands = (usedOnly = false) =>
  prisma.brand.findMany({ where: usedOnly ? { products: { some: { status: "ACTIVE" } } } : {}, orderBy: { name: "asc" } });
