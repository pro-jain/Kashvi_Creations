import express from "express";
import multer from "multer";
import { uploadImages } from "../services/imageUploadService.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid image format. Only JPEG, PNG, WebP, and GIF are allowed."));
    }
  },
});

/**
 * Upload single or multiple images
 * POST /api/upload
 * Body: multipart/form-data with images
 * 
 * Example:
 * - Single: image (key: "image")
 * - Multiple: image1, image2, image3, image4
 */
router.post("/", adminAuth, upload.any(), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.json({ success: false, message: "No images provided" });
    }

    // Convert multer files to uploadImages format
    const filesToUpload = req.files.map((file) => ({
      filename: file.originalname,
      data: file.buffer,
      mimetype: file.mimetype,
    }));

    // Upload to configured storage service
    const imageUrls = await uploadImages(filesToUpload);

    return res.json({
      success: true,
      message: `${imageUrls.length} image(s) uploaded successfully`,
      urls: imageUrls,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.json({
      success: false,
      message: error.message || "Failed to upload images",
    });
  }
});

/**
 * Get upload status/info
 * GET /api/upload/status
 */
router.get("/status", async (req, res) => {
  try {
    const storageType = process.env.STORAGE_TYPE || "local";
    return res.json({
      success: true,
      storageType,
      message: `Using ${storageType} storage`,
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
});

export default router;
