export interface PricedProduct { price: number; discountPrice: number | null }

// The selling price: discount only counts when it is genuinely lower.
export function unitPrice(p: PricedProduct): number {
  return p.discountPrice != null && p.discountPrice < p.price ? p.discountPrice : p.price;
}

// Same product added twice becomes one line with the summed quantity.
export function mergeItems(items: { productId: number; quantity: number }[]) {
  const map = new Map<number, number>();
  for (const i of items) map.set(i.productId, (map.get(i.productId) ?? 0) + i.quantity);
  return [...map.entries()].map(([productId, quantity]) => ({ productId, quantity }));
}

export function calculateTotals(lines: { unitPrice: number; quantity: number }[], deliveryFee: number) {
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  return { subtotal, deliveryFee, total: subtotal + deliveryFee };
}
