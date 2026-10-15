import { z } from "zod";
import { NIGERIAN_STATES } from "../utils/states";

const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(200);
const password = z.string().min(8, "Use at least 8 characters").max(72, "Use at most 72 characters");
const phone = z.string().trim().transform((s) => s.replace(/[\s()-]/g, ""))
  .refine((s) => s === "" || /^\+?\d{10,15}$/.test(s), "Enter a valid phone number");
const fullName = z.string().trim().min(2, "Enter your full name").max(100);

export const registerBody = z.object({ fullName, email, phone: phone.optional(), password });
export const loginBody = z.object({ email, password: z.string().min(1, "Enter your password").max(200) });
export const forgotBody = z.object({ email });
export const resetBody = z.object({ token: z.string().min(20).max(200), password });
export const profileBody = z.object({ fullName, phone: phone.optional() });
export const changePasswordBody = z.object({ currentPassword: z.string().min(1).max(200), newPassword: password });

export const addressBody = z.object({
  label: z.string().trim().max(50).optional(),
  line1: z.string().trim().min(5, "Enter the street address").max(300),
  city: z.string().trim().min(2, "Enter your city").max(100),
  state: z.enum(NIGERIAN_STATES, { errorMap: () => ({ message: "Choose a state" }) }),
  phone: phone.optional(),
  isDefault: z.boolean().optional(),
});
export const addressPatchBody = addressBody.partial();
export const wishlistBody = z.object({ productId: z.number().int().positive() });
