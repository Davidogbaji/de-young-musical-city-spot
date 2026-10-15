import { z } from "zod";
import { NIGERIAN_STATES } from "../utils/states";

const phone = z.string().trim()
  .transform((s) => s.replace(/[\s()-]/g, ""))
  .refine((s) => /^\+?\d{10,15}$/.test(s), "Enter a valid phone number");

export const PAYMENT_METHODS = ["ONLINE", "BANK_TRANSFER", "PAY_ON_DELIVERY", "WHATSAPP_CONFIRM"] as const;

export const createOrderBody = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(200),
  phone,
  addressLine: z.string().trim().max(300).optional().default(""),
  city: z.string().trim().min(2, "Enter your city").max(100),
  state: z.enum(NIGERIAN_STATES, { errorMap: () => ({ message: "Choose your state" }) }),
  notes: z.string().trim().max(500).optional(),
  deliveryMethod: z.enum(["delivery", "pickup"]).default("delivery"),
  paymentMethod: z.enum(PAYMENT_METHODS),
  items: z.array(z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().min(1).max(20),
  })).min(1, "Your cart is empty").max(50),
}).superRefine((v, ctx) => {
  if (v.deliveryMethod === "delivery" && v.addressLine.length < 5)
    ctx.addIssue({ code: "custom", path: ["addressLine"], message: "Enter your delivery address" });
});
export type CreateOrderInput = z.infer<typeof createOrderBody>;

export const lookupQuery = z.object({ email: z.string().trim().toLowerCase().email() });
