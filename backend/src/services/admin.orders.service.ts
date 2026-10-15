import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/db";
import { ApiError } from "../utils/apiError";
import { csvRow } from "../utils/csv";
import { toDto } from "./order.service";

const LOW_STOCK = 3;
const withContact = (o: Parameters<typeof toDto>[0] & { id: number; email: string; phone: string }) => ({ ...toDto(o), id: o.id, email: o.email, phone: o.phone });
const include = { items: true, payments: true } as const;

function filter(q: { status?: OrderStatus; q?: string }): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};
  if (q.status) where.status = q.status;
  if (q.q) {
    const c = { contains: q.q, mode: "insensitive" as const };
    where.OR = [{ reference: c }, { fullName: c }, { email: c }, { phone: c }];
  }
  return where;
}

export async function listOrders(q: { status?: OrderStatus; q?: string; page: number; limit: number }) {
  const where = filter(q);
  const [total, rows] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({ where, include, orderBy: { createdAt: "desc" }, skip: (q.page - 1) * q.limit, take: q.limit }),
  ]);
  return { orders: rows.map(withContact), pagination: { page: q.page, limit: q.limit, total, totalPages: Math.max(1, Math.ceil(total / q.limit)) } };
}

export async function updateOrder(id: number, input: { status?: Exclude<OrderStatus, "PAID" | "AWAITING_PAYMENT">; markPaid?: boolean }) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id }, include });
    if (!order) throw new ApiError(404, "Order not found");
    if (order.status === "CANCELLED") throw new ApiError(409, "A cancelled order cannot be changed.");
    let status: OrderStatus = input.status ?? order.status;

    if (input.markPaid) {
      if (order.payments.some((p) => p.status === "SUCCESS")) throw new ApiError(409, "This order is already marked as paid.");
      await tx.payment.create({ data: { orderId: id, provider: "manual", reference: `MANUAL-${order.reference}`, amount: order.total, status: "SUCCESS", verifiedAt: new Date() } });
      if (!input.status && (order.status === "PENDING" || order.status === "AWAITING_PAYMENT")) status = "PAID";
    }
    if (status === "CANCELLED") {
      // Cancelling returns the reserved stock exactly once (a cancelled order can no longer be changed).
      for (const it of order.items) if (it.productId) await tx.product.update({ where: { id: it.productId }, data: { stock: { increment: it.quantity } } });
    }
    const updated = await tx.order.update({ where: { id }, data: { status }, include });
    return withContact(updated);
  });
}

export async function exportOrdersCsv(q: { status?: OrderStatus; q?: string }) {
  const rows = await prisma.order.findMany({ where: filter(q), include, orderBy: { createdAt: "desc" }, take: 5000 });
  const lines = [csvRow(["Reference", "Date", "Status", "Payment", "Name", "Email", "Phone", "State", "City", "Address", "Items", "Subtotal", "Delivery", "Total"])];
  for (const o of rows) {
    const d = toDto(o);
    lines.push(csvRow([o.reference, o.createdAt.toISOString(), o.status, d.paymentStatus, o.fullName, o.email, o.phone, o.state, o.city, o.addressLine,
      o.items.map((i) => `${i.quantity} x ${i.name}`).join("; "), o.subtotal, o.deliveryFee, o.total]));
  }
  return "\uFEFF" + lines.join("\r\n"); // BOM so Excel reads accents correctly
}

export async function dashboard() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [byStatus, orders30, revenue30, activeProducts, lowStock, recent, newEnquiries] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.count({ where: { createdAt: { gte: since } } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { status: "SUCCESS", verifiedAt: { gte: since } } }),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.product.findMany({ where: { status: "ACTIVE", stock: { lte: LOW_STOCK } }, orderBy: { stock: "asc" }, take: 8, select: { id: true, name: true, stock: true } }),
    prisma.order.findMany({ include, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.studioEnquiry.count({ where: { status: "NEW" } }),
  ]);
  const counts = Object.fromEntries(byStatus.map((s) => [s.status, s._count._all]));
  return { ordersByStatus: counts, awaitingAction: (counts.PENDING ?? 0) + (counts.AWAITING_PAYMENT ?? 0), orders30, paidRevenue30: revenue30._sum.amount ?? 0,
    activeProducts, lowStockThreshold: LOW_STOCK, lowStock, recentOrders: recent.map(withContact), newEnquiries };
}
