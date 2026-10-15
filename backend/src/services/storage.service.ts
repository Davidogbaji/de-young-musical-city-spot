import { createHash, randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { env } from "../config/env";
import { ApiError } from "../utils/apiError";
import { sniffImage } from "../utils/image";

async function toCloudinary(buf: Buffer, mime: string): Promise<string> {
  const { CLOUDINARY_CLOUD_NAME: cloud, CLOUDINARY_API_KEY: key, CLOUDINARY_API_SECRET: secret } = env;
  if (!cloud || !key || !secret) throw new ApiError(500, "Image storage is not set up. Add the Cloudinary settings to backend/.env.");
  const timestamp = Math.floor(Date.now() / 1000), folder = "deyoung";
  const signature = createHash("sha1").update(`folder=${folder}&timestamp=${timestamp}${secret}`).digest("hex");
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buf)], { type: mime }));
  form.append("api_key", key); form.append("timestamp", String(timestamp)); form.append("folder", folder); form.append("signature", signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, { method: "POST", body: form });
  if (!res.ok) throw new ApiError(502, "The image could not be saved. Check the Cloudinary settings and try again.");
  return (await res.json() as { secure_url: string }).secure_url;
}

export async function saveImage(buf: Buffer): Promise<string> {
  const kind = sniffImage(buf);
  if (!kind) throw new ApiError(400, "Upload a JPEG, PNG or WebP image.");
  if (env.STORAGE_DRIVER === "cloudinary") return toCloudinary(buf, kind.mime);
  const name = `${randomBytes(12).toString("hex")}.${kind.ext}`; // server-chosen name: nothing from the visitor reaches the path
  const dir = path.resolve(env.UPLOAD_DIR);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), buf);
  return `${env.PUBLIC_API_URL.replace(/\/$/, "")}/uploads/${name}`;
}
