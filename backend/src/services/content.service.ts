import { prisma } from "../config/db";
import { env } from "../config/env";
import { ApiError } from "../utils/apiError";
import { csvRow } from "../utils/csv";
import { sendMail } from "../utils/mailer";
import { normalizeSetting, SETTINGS } from "../utils/settings";
import { buildSitemap } from "../utils/sitemap";
import { StudioEnquiryInput } from "../validators/content.validators";

const siteUrl = () => (env.SITE_URL || env.FRONTEND_URL.split(",")[0]).trim().replace(/\/$/, "");
const pager = (page: number, limit: number, total: number) => ({ page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) });

// Studio enquiries
export async function createEnquiry(i: StudioEnquiryInput) {
  if (i.website) return { id: 0 }; // honeypot filled in: a bot. Pretend success, save nothing.
  const row = await prisma.studioEnquiry.create({ data: {
    fullName: i.fullName, phone: i.phone, email: i.email, studioType: i.studioType, budgetRange: i.budgetRange || null,
    location: i.location || null, requirements: i.requirements, contactMethod: i.contactMethod,
  } });
  const to = (await prisma.siteSetting.findUnique({ where: { key: "contact_email" } }))?.value;
  if (to) sendMail(to, `New studio enquiry: ${i.studioType}`,
    `${i.fullName} (${i.phone}${i.email ? ", " + i.email : ""}) asked about: ${i.studioType}\nBudget: ${i.budgetRange || "not given"}\nLocation: ${i.location || "not given"}\nPrefers: ${i.contactMethod}\n\n${i.requirements}\n\nOpen the admin dashboard to follow up.`).catch(() => {});
  return { id: row.id };
}
export async function listEnquiries(q: { status?: "NEW" | "CONTACTED" | "QUOTED" | "CLOSED"; page: number; limit: number }) {
  const where = q.status ? { status: q.status } : {};
  const [total, rows] = await Promise.all([prisma.studioEnquiry.count({ where }), prisma.studioEnquiry.findMany({ where, orderBy: { createdAt: "desc" }, skip: (q.page - 1) * q.limit, take: q.limit })]);
  return { enquiries: rows, pagination: pager(q.page, q.limit, total) };
}
export const updateEnquiry = (id: number, status: "NEW" | "CONTACTED" | "QUOTED" | "CLOSED") => prisma.studioEnquiry.update({ where: { id }, data: { status } });

// Newsletter
export async function subscribe(email: string) {
  const existing = await prisma.newsletterSubscription.findUnique({ where: { email } });
  if (existing && !existing.unsubscribedAt) return;
  const row = existing
    ? await prisma.newsletterSubscription.update({ where: { email }, data: { unsubscribedAt: null, consent: true, subscribedAt: new Date() } })
    : await prisma.newsletterSubscription.create({ data: { email, consent: true } });
  sendMail(email, "You are subscribed to De Young Musical and City Spot",
    `Thank you for subscribing. You can unsubscribe at any time using this link:\n${siteUrl()}/unsubscribe?token=${row.unsubscribeToken}`).catch(() => {});
}
export async function unsubscribe(token: string) {
  const res = await prisma.newsletterSubscription.updateMany({ where: { unsubscribeToken: token }, data: { unsubscribedAt: new Date() } });
  if (res.count === 0) throw new ApiError(404, "This unsubscribe link is not valid.");
}
export async function listSubscribers(page: number, limit: number) {
  const where = { unsubscribedAt: null };
  const [total, rows] = await Promise.all([prisma.newsletterSubscription.count({ where }), prisma.newsletterSubscription.findMany({ where, orderBy: { subscribedAt: "desc" }, skip: (page - 1) * limit, take: limit, select: { id: true, email: true, subscribedAt: true } })]);
  return { subscribers: rows, pagination: pager(page, limit, total) };
}
export async function subscribersCsv() {
  const rows = await prisma.newsletterSubscription.findMany({ where: { unsubscribedAt: null }, orderBy: { subscribedAt: "desc" } });
  return "\uFEFF" + [csvRow(["Email", "Subscribed on"]), ...rows.map((r) => csvRow([r.email, r.subscribedAt.toISOString()]))].join("\r\n");
}

// Testimonials and banners. Only genuine, published testimonials are ever shown publicly.
export const publicTestimonials = () => prisma.testimonial.findMany({ where: { published: true, isSample: false }, orderBy: { createdAt: "desc" }, take: 12, select: { id: true, name: true, quote: true } });
export const allTestimonials = () => prisma.testimonial.findMany({ orderBy: { createdAt: "desc" } });
export const createTestimonial = (d: { name: string; quote: string; published: boolean }) => prisma.testimonial.create({ data: { ...d, isSample: false } });
export const updateTestimonial = (id: number, d: Record<string, unknown>) => prisma.testimonial.update({ where: { id }, data: d });
export const deleteTestimonial = async (id: number) => { await prisma.testimonial.delete({ where: { id } }); };
export const publicBanners = () => prisma.banner.findMany({ where: { active: true }, orderBy: { position: "asc" }, take: 5, select: { id: true, title: true, imageUrl: true, linkUrl: true } });
export const allBanners = () => prisma.banner.findMany({ orderBy: { position: "asc" } });
export const createBanner = (d: { title: string; imageUrl?: string | null; linkUrl: string | null; position: number; active: boolean }) => prisma.banner.create({ data: { ...d, imageUrl: d.imageUrl ?? null } });
export const updateBanner = (id: number, d: Record<string, unknown>) => prisma.banner.update({ where: { id }, data: d });
export const deleteBanner = async (id: number) => { await prisma.banner.delete({ where: { id } }); };

// Business settings
export async function getSettings() {
  const rows = await prisma.siteSetting.findMany({ where: { key: { in: Object.keys(SETTINGS) } } });
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}
export async function saveSettings(input: Record<string, string>) {
  const cleaned = Object.entries(input).map(([k, v]) => [k, normalizeSetting(k, v)] as const); // validates everything before saving anything
  await prisma.$transaction(cleaned.map(([key, value]) => value === null
    ? prisma.siteSetting.deleteMany({ where: { key } })
    : prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } })));
  return getSettings();
}

// Search-engine files
export async function sitemapXml() {
  const base = siteUrl();
  const [cats, prods] = await Promise.all([
    prisma.category.findMany({ select: { slug: true } }),
    prisma.product.findMany({ where: { status: "ACTIVE", isDemo: false }, select: { slug: true, updatedAt: true }, take: 5000 }),
  ]);
  return buildSitemap([
    ...["", "/shop", "/studio-setup", "/about", "/contact"].map((p) => ({ loc: base + (p || "/") })),
    ...cats.map((c) => ({ loc: `${base}/shop?category=${encodeURIComponent(c.slug)}` })),
    ...prods.map((p) => ({ loc: `${base}/product/${encodeURIComponent(p.slug)}`, lastmod: p.updatedAt })),
  ]);
}
