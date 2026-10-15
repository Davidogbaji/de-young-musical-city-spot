import { Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import { ApiError } from "../utils/apiError";
import { slugify, uniqueSlug } from "../utils/slug";
import { include } from "./product.service";
import { ProductCreate, ProductPatch } from "../validators/admin.validators";

type Row = Prisma.ProductGetPayload<{ include: typeof include }>;
// Admin view: raw price and discount, every status.
const adminDto = (p: Row) => ({
  id: p.id, name: p.name, slug: p.slug, description: p.description, model: p.model, price: p.price, discountPrice: p.discountPrice,
  stock: p.stock, status: p.status, isFeatured: p.isFeatured, isDemo: p.isDemo, categoryId: p.categoryId, brandId: p.brandId,
  category: p.category.name, brand: p.brand?.name ?? null, specs: p.specs, warranty: p.warranty,
  images: p.images.map((i) => ({ url: i.url, alt: i.alt })), updatedAt: p.updatedAt,
});
const specsValue = (s: Record<string, string> | null | undefined) =>
  s === undefined ? undefined : s === null || Object.keys(s).length === 0 ? Prisma.DbNull : s;

async function ensureRefs(categoryId?: number, brandId?: number | null) {
  if (categoryId && !(await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } }))) throw new ApiError(400, "Choose a valid category.");
  if (brandId && !(await prisma.brand.findUnique({ where: { id: brandId }, select: { id: true } }))) throw new ApiError(400, "Choose a valid brand.");
}

export async function listAdminProducts(q: { q?: string; status?: "ACTIVE" | "DRAFT" | "ARCHIVED"; page: number; limit: number }) {
  const where: Prisma.ProductWhereInput = {};
  if (q.status) where.status = q.status;
  if (q.q) where.OR = [{ name: { contains: q.q, mode: "insensitive" } }, { model: { contains: q.q, mode: "insensitive" } }, { slug: { contains: q.q, mode: "insensitive" } }];
  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, include, orderBy: { updatedAt: "desc" }, skip: (q.page - 1) * q.limit, take: q.limit }),
  ]);
  return { products: rows.map(adminDto), pagination: { page: q.page, limit: q.limit, total, totalPages: Math.max(1, Math.ceil(total / q.limit)) } };
}

export async function getAdminProduct(id: number) {
  const p = await prisma.product.findUnique({ where: { id }, include });
  if (!p) throw new ApiError(404, "Product not found");
  return adminDto(p);
}

export async function createProduct(input: ProductCreate) {
  await ensureRefs(input.categoryId, input.brandId);
  const slug = input.slug ?? await uniqueSlug(slugify(input.name), async (s) => !!(await prisma.product.findUnique({ where: { slug: s }, select: { id: true } })));
  const p = await prisma.product.create({
    data: {
      name: input.name, slug, description: input.description, model: input.model, price: input.price, discountPrice: input.discountPrice ?? null,
      stock: input.stock, status: input.status, isFeatured: input.isFeatured, warranty: input.warranty, categoryId: input.categoryId, brandId: input.brandId ?? null,
      specs: specsValue(input.specs),
      images: { create: input.images.map((im, i) => ({ url: im.url, alt: im.alt || input.name, position: i })) },
    },
    include,
  });
  return adminDto(p);
}

export async function updateProduct(id: number, input: ProductPatch) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Product not found");
  const price = input.price ?? existing.price;
  const discount = input.discountPrice === undefined ? existing.discountPrice : input.discountPrice;
  if (discount != null && discount >= price) throw new ApiError(400, "Discount price must be lower than the price.");
  await ensureRefs(input.categoryId, input.brandId);
  return prisma.$transaction(async (tx) => {
    if (input.images) {
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productImage.createMany({ data: input.images.map((im, i) => ({ productId: id, url: im.url, alt: im.alt || (input.name ?? existing.name), position: i })) });
    }
    const p = await tx.product.update({
      where: { id },
      data: {
        name: input.name, slug: input.slug, description: input.description, model: input.model, price: input.price, discountPrice: input.discountPrice,
        stock: input.stock, status: input.status, isFeatured: input.isFeatured, warranty: input.warranty, categoryId: input.categoryId, brandId: input.brandId,
        specs: specsValue(input.specs), isDemo: false, // once staff edit a product it is no longer demonstration data
      },
      include,
    });
    return adminDto(p);
  });
}

export async function setStock(id: number, stock: number) {
  const p = await prisma.product.update({ where: { id }, data: { stock }, include });
  return adminDto(p);
}
export const deleteProduct = async (id: number) => { await prisma.product.delete({ where: { id } }); }; // past orders keep their own name/price snapshot
export const deleteDemoProducts = async () => (await prisma.product.deleteMany({ where: { isDemo: true } })).count;

// Categories and brands
export async function createCategory(b: { name: string; slug?: string; description?: string | null; imageUrl?: string | null; position?: number }) {
  const slug = b.slug ?? await uniqueSlug(slugify(b.name), async (s) => !!(await prisma.category.findUnique({ where: { slug: s } })));
  return prisma.category.create({ data: { name: b.name, slug, description: b.description, imageUrl: b.imageUrl, position: b.position ?? 0 } });
}
export const updateCategory = (id: number, b: Prisma.CategoryUpdateInput) => prisma.category.update({ where: { id }, data: b });
export async function deleteCategory(id: number) {
  if (await prisma.product.count({ where: { categoryId: id } })) throw new ApiError(409, "This category still has products. Move or delete them first.");
  await prisma.category.delete({ where: { id } });
}
export async function createBrand(b: { name: string; slug?: string; logoUrl?: string | null }) {
  const slug = b.slug ?? await uniqueSlug(slugify(b.name), async (s) => !!(await prisma.brand.findUnique({ where: { slug: s } })));
  return prisma.brand.create({ data: { name: b.name, slug, logoUrl: b.logoUrl } });
}
export const updateBrand = (id: number, b: Prisma.BrandUpdateInput) => prisma.brand.update({ where: { id }, data: b });
export async function deleteBrand(id: number) {
  if (await prisma.product.count({ where: { brandId: id } })) throw new ApiError(409, "This brand still has products. Move or delete them first.");
  await prisma.brand.delete({ where: { id } });
}

// Delivery fees
export const listZones = () => prisma.deliveryZone.findMany({ orderBy: { state: "asc" } });
export const saveZone = (state: string, fee: number) => prisma.deliveryZone.upsert({ where: { state }, update: { fee }, create: { state, fee } });
export const deleteZone = async (state: string) => { await prisma.deliveryZone.deleteMany({ where: { state } }); };
