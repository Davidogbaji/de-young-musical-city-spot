import { Request, Response } from "express";
import * as cat from "../services/admin.catalog.service";
import * as ord from "../services/admin.orders.service";
import { saveImage } from "../services/storage.service";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";
import * as v from "../validators/admin.validators";

const idOf = (req: Request, name = "id") => {
  const n = Number(req.params[name]);
  if (!Number.isInteger(n) || n < 1) throw new ApiError(404, "Not found");
  return n;
};
type H = (req: Request, res: Response) => Promise<unknown>;
const h = (fn: H) => asyncHandler(async (req, res) => { await fn(req, res); });

export const dashboard = h(async (_q, res) => { res.json(await ord.dashboard()); });

export const products = h(async (req, res) => { res.json(await cat.listAdminProducts(v.adminProductQuery.parse(req.query))); });
export const product = h(async (req, res) => { res.json({ product: await cat.getAdminProduct(idOf(req)) }); });
export const createProduct = h(async (req, res) => { res.status(201).json({ product: await cat.createProduct(v.productCreate.parse(req.body)) }); });
export const updateProduct = h(async (req, res) => { res.json({ product: await cat.updateProduct(idOf(req), v.productPatch.parse(req.body)) }); });
export const deleteProduct = h(async (req, res) => { await cat.deleteProduct(idOf(req)); res.json({ ok: true }); });
export const deleteDemo = h(async (_q, res) => { res.json({ deleted: await cat.deleteDemoProducts() }); });
export const setStock = h(async (req, res) => { res.json({ product: await cat.setStock(idOf(req, "productId"), v.stockBody.parse(req.body).stock) }); });

export const upload = h(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Choose an image to upload.");
  res.status(201).json({ url: await saveImage(req.file.buffer) });
});

export const createCategory = h(async (req, res) => { res.status(201).json({ category: await cat.createCategory(v.categoryBody.parse(req.body)) }); });
export const updateCategory = h(async (req, res) => { res.json({ category: await cat.updateCategory(idOf(req), v.categoryPatch.parse(req.body)) }); });
export const deleteCategory = h(async (req, res) => { await cat.deleteCategory(idOf(req)); res.json({ ok: true }); });
export const createBrand = h(async (req, res) => { res.status(201).json({ brand: await cat.createBrand(v.brandBody.parse(req.body)) }); });
export const updateBrand = h(async (req, res) => { res.json({ brand: await cat.updateBrand(idOf(req), v.brandPatch.parse(req.body)) }); });
export const deleteBrand = h(async (req, res) => { await cat.deleteBrand(idOf(req)); res.json({ ok: true }); });

export const zones = h(async (_q, res) => { res.json({ zones: await cat.listZones() }); });
export const saveZone = h(async (req, res) => { const b = v.deliveryZoneBody.parse(req.body); res.json({ zone: await cat.saveZone(b.state, b.fee) }); });
export const deleteZone = h(async (req, res) => { await cat.deleteZone(String(req.params.state)); res.json({ ok: true }); });

export const orders = h(async (req, res) => { res.json(await ord.listOrders(v.orderListQuery.parse(req.query))); });
export const updateOrder = h(async (req, res) => { res.json({ order: await ord.updateOrder(idOf(req), v.orderUpdateBody.parse(req.body)) }); });
export const exportOrders = h(async (req, res) => {
  const q = v.orderListQuery.pick({ status: true, q: true }).parse(req.query);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(await ord.exportOrdersCsv(q));
});
