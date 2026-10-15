import { randomBytes } from "crypto";
import { Order, OrderItem, Payment } from "@prisma/client";
import { prisma } from "../config/db";
import { env } from "../config/env";
import { ApiError } from "../utils/apiError";
import { calculateTotals, mergeItems, unitPrice } from "../utils/pricing";
import { CreateOrderInput, PAYMENT_METHODS } from "../validators/order.validators";

type Method = (typeof PAYMENT_METHODS)[number];

// Payment methods the business has switched on. ONLINE stays off until Stage 5 (payment verification) exists.
export function enabledPaymentMethods(): Method[] {
  return env.PAYMENT_METHODS.split(",").map((s) => s.trim() as Method)
    .filter((m) => (PAYMENT_METHODS as readonly string[]).includes(m) && m !== "ONLINE");
}

export const getCheckoutConfig = async () => ({
  paymentMethods: enabledPaymentMethods(),
  deliveryZones: await prisma.deliveryZone.findMany({ orderBy: { state: "asc" }, select: { state: true, fee: true } }),
});

const newReference = () => `DY-${Date.now().toString(36).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;

async function resolveDeliveryFee(input: CreateOrderInput) {
  if (input.deliveryMethod === "pickup") return { amount: 0, toBeConfirmed: false };
  const zone = await prisma.deliveryZone.findUnique({ where: { state: input.state } });
  return zone ? { amount: zone.fee, toBeConfirmed: false } : { amount: 0, toBeConfirmed: true };
}

export const toDto = (o: Order & { items: OrderItem[]; payments?: Payment[] }, feeToBeConfirmed = false) => ({
  reference: o.reference,
  status: o.status,
  paymentMethod: o.paymentMethod,
  paymentStatus: (o.payments?.some((p) => p.status === "SUCCESS") ? "PAID" : "NOT_PAID") as "PAID" | "NOT_PAID",
  deliveryMethod: o.deliveryMethod,
  fullName: o.fullName, city: o.city, state: o.state, addressLine: o.addressLine, notes: o.notes,
  subtotal: o.subtotal, deliveryFee: o.deliveryFee, total: o.total, feeToBeConfirmed, createdAt: o.createdAt,
  items: o.items.map((i) => ({ name: i.name, unitPrice: i.unitPrice, quantity: i.quantity })),
});

export async function createOrder(input: CreateOrderInput, userId?: number) {
  if (!enabledPaymentMethods().includes(input.paymentMethod)) throw new ApiError(400, "That payment method is not available.");
  const merged = mergeItems(input.items);
  const fee = await resolveDeliveryFee(input);

  // One transaction: if any item is short of stock, nothing is saved and no stock is taken.
  const order = await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({ where: { id: { in: merged.map((m) => m.productId) }, status: "ACTIVE" } });
    const byId = new Map(products.map((p) => [p.id, p]));
    const lines: { productId: number; name: string; unitPrice: number; quantity: number }[] = [];

    for (const it of merged) {
      const p = byId.get(it.productId);
      if (!p) throw new ApiError(400, "A product in your cart is no longer available. Please review your cart.");
      // Atomic guard: decrements only if enough stock remains, so two buyers can never both take the last unit.
      const res = await tx.product.updateMany({
        where: { id: p.id, status: "ACTIVE", stock: { gte: it.quantity } },
        data: { stock: { decrement: it.quantity } },
      });
      if (res.count === 0) throw new ApiError(409, `Not enough stock for ${p.name}. Please reduce the quantity or remove it.`);
      lines.push({ productId: p.id, name: p.name, unitPrice: unitPrice(p), quantity: it.quantity }); // price snapshot
    }

    const totals = calculateTotals(lines, fee.amount);
    return tx.order.create({
      data: {
        reference: newReference(), userId: userId ?? null,
        fullName: input.fullName, email: input.email, phone: input.phone,
        addressLine: input.addressLine || "Store pickup", city: input.city, state: input.state, notes: input.notes,
        deliveryMethod: input.deliveryMethod, paymentMethod: input.paymentMethod, status: "PENDING",
        ...totals,
        items: { create: lines },
      },
      include: { items: true, payments: true },
    });
  });
  return toDto(order, fee.toBeConfirmed);
}

export async function getOrderByReference(reference: string, email: string) {
  const order = await prisma.order.findUnique({ where: { reference }, include: { items: true, payments: true } });
  // Same answer for "no such order" and "wrong email" so references cannot be probed.
  if (!order || order.email.toLowerCase() !== email.toLowerCase()) throw new ApiError(404, "Order not found");
  const zone = order.deliveryMethod === "delivery" && order.deliveryFee === 0
    ? !(await prisma.deliveryZone.findUnique({ where: { state: order.state } })) : false;
  return toDto(order, zone);
}

export async function listMyOrders(userId: number) {
  const orders = await prisma.order.findMany({ where: { userId }, include: { items: true, payments: true }, orderBy: { createdAt: "desc" }, take: 50 });
  return orders.map((o) => toDto(o));
}
export async function getMyOrder(userId: number, reference: string) {
  const order = await prisma.order.findFirst({ where: { reference, userId }, include: { items: true, payments: true } });
  if (!order) throw new ApiError(404, "Order not found");
  return toDto(order);
}
