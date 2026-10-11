const express = require("express");
const imageRoutes = require("./routes/imageRoutes");
const cors = require("cors");
const app = express();
const PORT = 5000;

// Body parsing middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root health check endpoint
app.get("/", (req, res) => {
  res.send("Image Preprocessing API is running!");
});

// Connect image routes under /api
app.use("/api", imageRoutes);

// Error-handling middleware (handles Multer errors and validation errors cleanly)
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File is too large. Maximum allowed size is 10 MB.",
    });
  }
  if (err.message === "Only image files are allowed!") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  return res.status(500).json({
    success: false,
    message: err.message || "An unexpected error occurred.",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});