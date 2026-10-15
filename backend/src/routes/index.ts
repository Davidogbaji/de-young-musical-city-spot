import { Router } from "express";
import rateLimit from "express-rate-limit";
import * as products from "../controllers/product.controller";
import * as orders from "../controllers/order.controller";
import * as auth from "../controllers/auth.controller";
import * as account from "../controllers/account.controller";
import { authenticate, optionalAuth } from "../middleware/auth";
import * as content from "../controllers/content.controller";
import admin from "./admin";

const limiter = (minutes: number, limit: number, message: string) =>
  rateLimit({ windowMs: minutes * 60 * 1000, limit, standardHeaders: true, legacyHeaders: false, message: { error: { message } } });
const orderLimiter = limiter(60, 30, "Too many orders from this connection. Please try again later.");
const authLimiter = limiter(15, 20, "Too many attempts. Please wait a few minutes and try again.");

const r = Router();
r.get("/health", (_req, res) => res.json({ ok: true }));

r.get("/products", products.list);
r.get("/products/:idOrSlug", products.getOne);
r.get("/search", products.list);
r.get("/categories", products.categories);
r.get("/brands", products.brands);

r.get("/checkout/config", orders.checkoutConfig);
r.get("/orders/my-orders", authenticate, orders.myOrders); // must stay above /orders/:reference
r.get("/orders/my-orders/:reference", authenticate, orders.myOrder);
r.post("/orders", orderLimiter, optionalAuth, orders.create);
r.get("/orders/:reference", orders.getOne);

r.post("/auth/register", authLimiter, auth.register);
r.post("/auth/login", authLimiter, auth.login);
r.post("/auth/logout", auth.logout);
r.get("/auth/me", optionalAuth, auth.me);
r.post("/auth/forgot-password", authLimiter, auth.forgot);
r.post("/auth/reset-password", authLimiter, auth.reset);

r.patch("/account/profile", authenticate, account.updateProfile);
r.post("/account/change-password", authenticate, authLimiter, account.changePassword);
r.get("/account/addresses", authenticate, account.addresses);
r.post("/account/addresses", authenticate, account.addAddress);
r.patch("/account/addresses/:id", authenticate, account.editAddress);
r.delete("/account/addresses/:id", authenticate, account.removeAddress);

r.get("/wishlist", authenticate, account.wishlist);
r.post("/wishlist", authenticate, account.wishlistAdd);
r.delete("/wishlist/:productId", authenticate, account.wishlistRemove);
const formLimiter = limiter(60, 10, "Too many submissions. Please try again later.");
r.post("/studio-enquiries", formLimiter, content.studioEnquiry);
r.post("/newsletter", formLimiter, content.newsletter);
r.post("/newsletter/unsubscribe", authLimiter, content.unsubscribe);
r.get("/testimonials", content.testimonials);
r.get("/banners", content.banners);
r.get("/settings", content.settings);

r.use("/admin", admin);
export default r;
