import { Request } from "express";
import * as svc from "../services/content.service";
import { ApiError } from "../utils/apiError";
import { h } from "../utils/asyncHandler";
import * as v from "../validators/content.validators";

const idOf = (req: Request) => {
  const n = Number(req.params.id);
  if (!Number.isInteger(n) || n < 1) throw new ApiError(404, "Not found");
  return n;
};

// Public
export const studioEnquiry = h(async (req, res) => { await svc.createEnquiry(v.studioEnquiryBody.parse(req.body)); res.status(201).json({ ok: true }); });
export const newsletter = h(async (req, res) => { await svc.subscribe(v.newsletterBody.parse(req.body).email); res.status(201).json({ message: "Thank you! You are subscribed." }); });
export const unsubscribe = h(async (req, res) => { await svc.unsubscribe(v.unsubscribeBody.parse(req.body).token); res.json({ message: "You have been unsubscribed." }); });
export const testimonials = h(async (_q, res) => { res.setHeader("Cache-Control", "public, max-age=60"); res.json({ testimonials: await svc.publicTestimonials() }); });
export const banners = h(async (_q, res) => { res.setHeader("Cache-Control", "public, max-age=60"); res.json({ banners: await svc.publicBanners() }); });
export const settings = h(async (_q, res) => { res.setHeader("Cache-Control", "public, max-age=60"); res.json({ settings: await svc.getSettings() }); });

// Admin
export const enquiries = h(async (req, res) => { res.json(await svc.listEnquiries(v.enquiryListQuery.parse(req.query))); });
export const updateEnquiry = h(async (req, res) => { res.json({ enquiry: await svc.updateEnquiry(idOf(req), v.enquiryUpdateBody.parse(req.body).status) }); });
export const adminTestimonials = h(async (_q, res) => { res.json({ testimonials: await svc.allTestimonials() }); });
export const addTestimonial = h(async (req, res) => { res.status(201).json({ testimonial: await svc.createTestimonial(v.testimonialBody.parse(req.body)) }); });
export const editTestimonial = h(async (req, res) => { res.json({ testimonial: await svc.updateTestimonial(idOf(req), v.testimonialPatch.parse(req.body)) }); });
export const removeTestimonial = h(async (req, res) => { await svc.deleteTestimonial(idOf(req)); res.json({ ok: true }); });
export const adminBanners = h(async (_q, res) => { res.json({ banners: await svc.allBanners() }); });
export const addBanner = h(async (req, res) => { res.status(201).json({ banner: await svc.createBanner(v.bannerBody.parse(req.body)) }); });
export const editBanner = h(async (req, res) => { res.json({ banner: await svc.updateBanner(idOf(req), v.bannerPatch.parse(req.body)) }); });
export const removeBanner = h(async (req, res) => { await svc.deleteBanner(idOf(req)); res.json({ ok: true }); });
export const saveSettings = h(async (req, res) => { res.json({ settings: await svc.saveSettings(v.settingsBody.parse(req.body)) }); });
export const subscribers = h(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  res.json(await svc.listSubscribers(page, 50));
});
export const subscribersCsv = h(async (_q, res) => {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(await svc.subscribersCsv());
});
