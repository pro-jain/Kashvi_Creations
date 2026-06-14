import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const STORAGE_TYPE = process.env.STORAGE_TYPE || "local";

// ========== VERCEL BLOB ==========
export const uploadToVercelBlob = async (files) => {
  const { put } = await import("@vercel/blob");

  const uploadedUrls = await Promise.all(
    files.map(async (file) => {
      const filename = `products/${Date.now()}-${file.filename}`;

      // file.data is the Buffer from multer memoryStorage
      const blob = await put(filename, file.data, {
        access: "public",
        contentType: file.mimetype,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      return blob.url;
    })
  );

  return uploadedUrls;
};

// ========== LOCAL (dev fallback) ==========
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadToLocal = async (files) => {
  const uploadDir = path.join(__dirname, "..", "uploads");

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return files.map((file) => {
    const filename = `${Date.now()}-${file.filename}`;
    fs.writeFileSync(path.join(uploadDir, filename), file.data);
    return `/uploads/${filename}`;
  });
};

// ========== UNIFIED ==========
export const uploadImages = async (files) => {
  if (!files || files.length === 0) throw new Error("No files provided");

  console.log(`Uploading ${files.length} image(s) via ${STORAGE_TYPE}`);

  switch (STORAGE_TYPE.toLowerCase()) {
    case "vercel-blob":
      return await uploadToVercelBlob(files);
    case "local":
      return await uploadToLocal(files);
    default:
      throw new Error(`Unknown STORAGE_TYPE: ${STORAGE_TYPE}`);
  }
};