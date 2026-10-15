import { z } from "zod";

const phone = z.string().trim().transform((s) => s.replace(/[\s()-]/g, "")).refine((s) => /^\+?\d{10,15}$/.test(s), "Enter a valid phone number");
const url = z.string().max(500).refine((u) => /^https?:\/\//i.test(u), "Invalid image address");

export const STUDIO_TYPES = [
  "Home recording studio", "Professional recording studio", "Podcast studio", "Church sound system",
  "DJ booth and event setup", "Music production workstation", "Acoustic treatment and monitoring",
] as const;

export const studioEnquiryBody = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(100),
  phone,
  email: z.string().trim().toLowerCase().max(200).refine((v) => v === "" || /^\S+@\S+\.\S+$/.test(v), "Enter a valid email address").optional().transform((v) => v || null),
  studioType: z.enum(STUDIO_TYPES, { errorMap: () => ({ message: "Choose the type of studio" }) }),
  budgetRange: z.string().trim().max(100).optional(),
  location: z.string().trim().max(150).optional(),
  requirements: z.string().trim().min(10, "Tell us a little about what you need (at least 10 characters)").max(2000),
  contactMethod: z.enum(["whatsapp", "phone", "email"]).default("whatsapp"),
  website: z.string().max(200).optional(), // honeypot: real visitors never see or fill this
});
export type StudioEnquiryInput = z.infer<typeof studioEnquiryBody>;
export const enquiryListQuery = z.object({
  status: z.enum(["NEW", "CONTACTED", "QUOTED", "CLOSED"]).optional(),
  page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20),
});
export const enquiryUpdateBody = z.object({ status: z.enum(["NEW", "CONTACTED", "QUOTED", "CLOSED"]) });

export const newsletterBody = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address").max(200),
  consent: z.literal(true, { errorMap: () => ({ message: "Please tick the box to agree to receive emails" }) }),
});
export const unsubscribeBody = z.object({ token: z.string().min(10).max(100) });

export const testimonialBody = z.object({
  name: z.string().trim().min(2, "Enter the customer's name").max(100),
  quote: z.string().trim().min(10, "Enter what the customer said").max(1000),
  published: z.boolean().default(false),
});
export const testimonialPatch = testimonialBody.partial();

const link = z.string().trim().max(300).refine((l) => l === "" || (l.startsWith("/") && !l.startsWith("//")) || /^https:\/\//i.test(l), "Use a page on this site (starting with /) or a full https:// address");
export const bannerBody = z.object({
  title: z.string().trim().min(2, "Enter a title").max(120),
  imageUrl: url.nullish(),
  linkUrl: link.nullish().transform((v) => v || null),
  position: z.number().int().min(0).max(1000).default(0),
  active: z.boolean().default(true),
});
export const bannerPatch = bannerBody.partial();

export const settingsBody = z.record(z.string().max(60), z.string().max(8000));
