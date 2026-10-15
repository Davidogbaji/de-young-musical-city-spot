import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { listProductsQuery } from "../validators/product.validators";
import * as svc from "../services/product.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  res.json(await svc.listProducts(listProductsQuery.parse(req.query)));
});
export const getOne = asyncHandler(async (req: Request, res: Response) => {
  res.json(await svc.getProduct(String(req.params.idOrSlug)));
});
export const categories = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ categories: await svc.listCategories() });
});
export const brands = asyncHandler(async (req: Request, res: Response) => {
  res.json({ brands: await svc.listBrands(req.query.used === "true") });
});
