import { Router } from "express";
import multer from "multer";
import * as a from "../controllers/admin.controller";
import * as c from "../controllers/content.controller";
import { authenticate, requireRole } from "../middleware/auth";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
const adminOnly = requireRole("ADMIN");

// Every route here needs a logged-in STAFF or ADMIN user, checked on the server.
const r = Router();
r.use(authenticate, requireRole("STAFF", "ADMIN"));

r.get("/dashboard", a.dashboard);

r.get("/products", a.products);
r.post("/products", a.createProduct);
r.delete("/products/demo", adminOnly, a.deleteDemo); // keep above /products/:id
r.get("/products/:id", a.product);
r.patch("/products/:id", a.updateProduct);
r.delete("/products/:id", adminOnly, a.deleteProduct);
r.patch("/inventory/:productId", a.setStock);
r.post("/uploads", upload.single("image"), a.upload);

r.post("/categories", adminOnly, a.createCategory);
r.patch("/categories/:id", adminOnly, a.updateCategory);
r.delete("/categories/:id", adminOnly, a.deleteCategory);
r.post("/brands", adminOnly, a.createBrand);
r.patch("/brands/:id", adminOnly, a.updateBrand);
r.delete("/brands/:id", adminOnly, a.deleteBrand);

r.get("/delivery-zones", a.zones);
r.put("/delivery-zones", adminOnly, a.saveZone);
r.delete("/delivery-zones/:state", adminOnly, a.deleteZone);

r.get("/orders/export.csv", a.exportOrders); // keep above /orders/:id
r.get("/orders", a.orders);
r.patch("/orders/:id", a.updateOrder);

r.get("/studio-enquiries", c.enquiries);
r.patch("/studio-enquiries/:id", c.updateEnquiry);

// Website content and personal data: administrator only.
r.get("/testimonials", adminOnly, c.adminTestimonials);
r.post("/testimonials", adminOnly, c.addTestimonial);
r.patch("/testimonials/:id", adminOnly, c.editTestimonial);
r.delete("/testimonials/:id", adminOnly, c.removeTestimonial);
r.get("/banners", adminOnly, c.adminBanners);
r.post("/banners", adminOnly, c.addBanner);
r.patch("/banners/:id", adminOnly, c.editBanner);
r.delete("/banners/:id", adminOnly, c.removeBanner);
r.put("/settings", adminOnly, c.saveSettings);
r.get("/newsletter", adminOnly, c.subscribers);
r.get("/newsletter/export.csv", adminOnly, c.subscribersCsv);
export default r;
