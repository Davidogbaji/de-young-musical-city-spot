import { prisma } from "../config/db";
import { ApiError } from "../utils/apiError";
import { include, toDto } from "./product.service";

type AddressInput = { label?: string; line1: string; city: string; state: string; phone?: string; isDefault?: boolean };
const MAX_ADDRESSES = 10;

export const listAddresses = (userId: number) => prisma.address.findMany({ where: { userId }, orderBy: [{ isDefault: "desc" }, { id: "asc" }] });

export async function createAddress(userId: number, a: AddressInput) {
  const count = await prisma.address.count({ where: { userId } });
  if (count >= MAX_ADDRESSES) throw new ApiError(400, `You can save up to ${MAX_ADDRESSES} addresses.`);
  return prisma.$transaction(async (tx) => {
    const makeDefault = a.isDefault || count === 0;
    if (makeDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    return tx.address.create({ data: { ...a, phone: a.phone || null, userId, isDefault: makeDefault } });
  });
}

export async function updateAddress(userId: number, id: number, a: Partial<AddressInput>) {
  const existing = await prisma.address.findFirst({ where: { id, userId } }); // ownership check
  if (!existing) throw new ApiError(404, "Address not found");
  return prisma.$transaction(async (tx) => {
    if (a.isDefault) await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    return tx.address.update({ where: { id }, data: { ...a, phone: a.phone === undefined ? undefined : a.phone || null } });
  });
}

export async function deleteAddress(userId: number, id: number) {
  const res = await prisma.address.deleteMany({ where: { id, userId } });
  if (res.count === 0) throw new ApiError(404, "Address not found");
}

export async function listWishlist(userId: number) {
  const rows = await prisma.wishlistItem.findMany({
    where: { userId, product: { status: "ACTIVE" } }, orderBy: { createdAt: "desc" }, include: { product: { include } },
  });
  return rows.map((r) => toDto(r.product));
}
export async function addToWishlist(userId: number, productId: number) {
  const p = await prisma.product.findFirst({ where: { id: productId, status: "ACTIVE" }, select: { id: true } });
  if (!p) throw new ApiError(404, "Product not found");
  await prisma.wishlistItem.upsert({ where: { userId_productId: { userId, productId } }, update: {}, create: { userId, productId } });
}
export const removeFromWishlist = (userId: number, productId: number) => prisma.wishlistItem.deleteMany({ where: { userId, productId } });
