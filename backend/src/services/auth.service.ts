import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db";
import { env } from "../config/env";
import { ApiError } from "../utils/apiError";
import { sendMail } from "../utils/mailer";
import { generateResetToken, hashToken } from "../utils/tokens";

export const SESSION_COOKIE = "dy_session";
export const SESSION_DAYS = 7;
// Compared against when the email is unknown, so response time does not reveal which emails have accounts.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 12);

const publicUser = (u: { id: number; email: string; fullName: string; phone: string | null; role: string }) =>
  ({ id: u.id, email: u.email, fullName: u.fullName, phone: u.phone, role: u.role });

export const signToken = (u: { id: number; tokenVersion: number }) =>
  jwt.sign({ v: u.tokenVersion }, env.JWT_SECRET, { subject: String(u.id), expiresIn: `${SESSION_DAYS}d` });

export async function register(input: { fullName: string; email: string; phone?: string; password: string }) {
  if (await prisma.user.findUnique({ where: { email: input.email } })) throw new ApiError(409, "An account with this email already exists. Try logging in.");
  const user = await prisma.user.create({
    data: { fullName: input.fullName, email: input.email, phone: input.phone || null, passwordHash: await bcrypt.hash(input.password, 12) },
  });
  return { user: publicUser(user), token: signToken(user) };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) throw new ApiError(401, "Email or password is incorrect.");
  return { user: publicUser(user), token: signToken(user) };
}

export async function getUser(id: number) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new ApiError(401, "Please log in to continue.");
  return publicUser(user);
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // same response either way
  const { token, hash } = generateResetToken();
  await prisma.user.update({ where: { id: user.id }, data: { resetTokenHash: hash, resetTokenExpires: new Date(Date.now() + 60 * 60 * 1000) } });
  const origin = env.FRONTEND_URL.split(",")[0].trim();
  try {
    await sendMail(user.email, "Reset your De Young Musical and City Spot password",
      `Hello ${user.fullName},\n\nUse this link within one hour to choose a new password:\n${origin}/reset-password?token=${token}\n\nIf you did not ask for this, ignore this email. Your password stays the same.`);
  } catch (e) { console.error("Reset email failed:", (e as Error).message); }
}

export async function resetPassword(token: string, password: string) {
  const user = await prisma.user.findFirst({ where: { resetTokenHash: hashToken(token), resetTokenExpires: { gt: new Date() } } });
  if (!user) throw new ApiError(400, "This reset link is invalid or has expired. Request a new one.");
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(password, 12), resetTokenHash: null, resetTokenExpires: null, tokenVersion: { increment: 1 } }, // logs out other devices
  });
}

export async function changePassword(userId: number, current: string, next: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!(await bcrypt.compare(current, user.passwordHash))) throw new ApiError(400, "Your current password is incorrect.");
  const updated = await prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(next, 12), tokenVersion: { increment: 1 } } });
  return signToken(updated);
}

export async function updateProfile(userId: number, data: { fullName: string; phone?: string }) {
  const user = await prisma.user.update({ where: { id: userId }, data: { fullName: data.fullName, phone: data.phone || null } });
  return publicUser(user);
}
