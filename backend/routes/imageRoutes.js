const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const router = express.Router();

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `image-${uniqueSuffix}${ext}`);
  },
});

// Validate that uploaded file is an image
const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// Configure Multer with 10 MB limit and image validation
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB file-size limit
  },
});

// POST /api/upload

router.post("/process", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image using the field name 'image'.",
      });
    }

    // Read the operation requested by the frontend
    const operation = req.body.operation || "grayscale";

    // Start with the uploaded image
    let image = sharp(req.file.path);

    if (operation === "grayscale") {
      image = image.grayscale();
    } else if (operation === "resize") {
      const width = Number(req.body.width);
      const height = Number(req.body.height);

      // Validate the requested dimensions
      if (
        !Number.isInteger(width) ||
        !Number.isInteger(height) ||
        width < 1 ||
        height < 1 ||
        width > 5000 ||
        height > 5000
      ) {
        return res.status(400).json({
          success: false,
          message: "Width and height must be integers between 1 and 5000.",
        });
      }

      image = image.resize(width, height, {
        fit: "fill",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Unsupported image operation.",
      });
    }

    const processedImage = await image
      .png()
      .toBuffer();

    return res
      .status(200)
      .type("png")
      .send(processedImage);
  } catch (error) {
    console.error("Image processing error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process the image.",
    });
  }
});

// POST /api/process - Convert an uploaded image to grayscale
router.post("/process", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image using the field name 'image'.",
      });
    }

    const processedImage = await sharp(req.file.path)
      .grayscale()
      .png()
      .toBuffer();

    return res
      .status(200)
      .type("png")
      .send(processedImage);
  } catch (error) {
    console.error("Image processing error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to process the image.",
    });
  }
});

module.exports = router;

