const fs = require("fs");
const path = require("path");

// Common image file extension to MIME type mapping
const MIME_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".bmp": "image/bmp",
  ".svg": "image/svg+xml",
};

async function runUploadTest() {
  const targetUrl = "http://localhost:5000/api/upload";
  let targetPath = process.argv[2];

  console.log("=========================================");
  console.log("   ImagePrep API - Image Upload Test     ");
  console.log("=========================================\n");

  // If no image path provided via CLI, generate a sample PNG in the backend directory
  if (!targetPath) {
    targetPath = path.join(__dirname, "sample-test.png");
    console.log("Notice: No image path passed as command line argument.");
    console.log(`Creating/using sample test image at: ${targetPath}\n`);

    // 1x1 pixel valid PNG buffer in base64
    const samplePngBase64 =
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    fs.writeFileSync(targetPath, Buffer.from(samplePngBase64, "base64"));
  }

  const absolutePath = path.resolve(targetPath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: File does not exist at path: "${absolutePath}"`);
    console.log("\nUsage:");
    console.log("  node test-upload.js <path-to-image>");
    console.log("Example:");
    console.log("  node test-upload.js ./sample-test.png");
    console.log('  node test-upload.js "C:\\Users\\ASUS\\Desktop\\photo.jpg"');
    process.exit(1);
  }

  const fileName = path.basename(absolutePath);
  const ext = path.extname(fileName).toLowerCase();
  const mimeType = MIME_TYPES[ext] || "application/octet-stream";
  const fileBuffer = fs.readFileSync(absolutePath);
  const stats = fs.statSync(absolutePath);

  console.log(`Endpoint   : ${targetUrl}`);
  console.log(`Field Name : "image"`);
  console.log(`File Name  : ${fileName}`);
  console.log(`File Path  : ${absolutePath}`);
  console.log(`File Size  : ${(stats.size / 1024).toFixed(2)} KB (${stats.size} bytes)`);
  console.log(`MIME Type  : ${mimeType}\n`);

  // Construct multipart/form-data using Node.js built-in global APIs
  const fileBlob = new Blob([fileBuffer], { type: mimeType });
  const formData = new FormData();
  formData.append("image", fileBlob, fileName);

  console.log("Sending POST request...");

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      body: formData,
    });

    console.log("\n-----------------------------------------");
    console.log(`HTTP Status : ${response.status} ${response.statusText}`);
    console.log("-----------------------------------------");

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const json = await response.json();
      console.log("Response JSON:");
      console.log(JSON.stringify(json, null, 2));
    } else {
      const text = await response.text();
      console.log("Response Body:");
      console.log(text);
    }

    if (response.ok) {
      console.log("\nTest Result: PASSED (Image received and stored successfully)");
    } else {
      console.log("\nTest Result: FAILED (Server returned an error status)");
    }
  } catch (error) {
    console.error("\nConnection Error:");
    if (error.cause && error.cause.code === "ECONNREFUSED") {
      console.error(
        `Could not connect to ${targetUrl}. Is the Express server running?`
      );
      console.error("\nTo start your backend server, run in your terminal:");
      console.error("  cd backend");
      console.error("  node app.js");
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

runUploadTest();

