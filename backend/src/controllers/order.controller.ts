import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { createOrderBody, lookupQuery } from "../validators/order.validators";
import * as svc from "../services/order.service";

export const checkoutConfig = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await svc.getCheckoutConfig());
});
export const create = asyncHandler(async (req: Request, res: Response) => {
  res.status(201).json({ order: await svc.createOrder(createOrderBody.parse(req.body), req.user?.id) });
});
export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const { email } = lookupQuery.parse(req.query);
  res.json({ order: await svc.getOrderByReference(String(req.params.reference), email) });
});
export const myOrders = asyncHandler(async (req: Request, res: Response) => {
  res.json({ orders: await svc.listMyOrders(req.user!.id) });
});
export const myOrder = asyncHandler(async (req: Request, res: Response) => {
  res.json({ order: await svc.getMyOrder(req.user!.id, String(req.params.reference)) });
});
