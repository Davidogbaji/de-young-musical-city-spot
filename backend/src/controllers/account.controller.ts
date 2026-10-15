import { Request, Response } from "express";
import * as auth from "../services/auth.service";
import * as svc from "../services/account.service";
import { asyncHandler } from "../utils/asyncHandler";
import { addressBody, addressPatchBody, changePasswordBody, profileBody, wishlistBody } from "../validators/auth.validators";
import { setSession } from "./auth.controller";

const uid = (req: Request) => req.user!.id;
const idParam = (req: Request, name = "id") => {
  const n = Number(req.params[name]);
  return Number.isInteger(n) && n > 0 ? n : 0;
};

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  res.json({ user: await auth.updateProfile(uid(req), profileBody.parse(req.body)) });
});
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const b = changePasswordBody.parse(req.body);
  setSession(res, await auth.changePassword(uid(req), b.currentPassword, b.newPassword));
  res.json({ message: "Password changed." });
});
export const addresses = asyncHandler(async (req: Request, res: Response) => { res.json({ addresses: await svc.listAddresses(uid(req)) }); });
export const addAddress = asyncHandler(async (req: Request, res: Response) => { res.status(201).json({ address: await svc.createAddress(uid(req), addressBody.parse(req.body)) }); });
export const editAddress = asyncHandler(async (req: Request, res: Response) => { res.json({ address: await svc.updateAddress(uid(req), idParam(req), addressPatchBody.parse(req.body)) }); });
export const removeAddress = asyncHandler(async (req: Request, res: Response) => { await svc.deleteAddress(uid(req), idParam(req)); res.json({ ok: true }); });

export const wishlist = asyncHandler(async (req: Request, res: Response) => { res.json({ products: await svc.listWishlist(uid(req)) }); });
export const wishlistAdd = asyncHandler(async (req: Request, res: Response) => { await svc.addToWishlist(uid(req), wishlistBody.parse(req.body).productId); res.status(201).json({ ok: true }); });
export const wishlistRemove = asyncHandler(async (req: Request, res: Response) => { await svc.removeFromWishlist(uid(req), idParam(req, "productId")); res.json({ ok: true }); });
