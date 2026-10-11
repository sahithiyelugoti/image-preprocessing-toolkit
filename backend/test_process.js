
const fs = require("fs");
const path = require("path");

async function testGrayscale() {
  try {
    const imagePath =
      "C:/Users/ASUS/Downloads/vecteezy_blue-cold-ice-background-with-scratches-and-patterns-frozen_6260443.jpg";

    // Check whether the input image exists
    if (!fs.existsSync(imagePath)) {
      throw new Error("Image not found. Please check the image path.");
    }

    // Create form data and read the image
    const formData = new FormData();
    const imageBuffer = fs.readFileSync(imagePath);

    formData.append(
      "image",
      new Blob([imageBuffer], { type: "image/jpeg" }),
      path.basename(imagePath)
    );

    // Send the image to the backend
    const response = await fetch(
      "http://localhost:5000/api/process",
      {
        method: "POST",
        body: formData,
      }
    );

    // Handle unsuccessful responses
    if (!response.ok) {
      console.log("Request failed:", response.status);
      console.log(await response.text());
      return;
    }

    // Save the processed image
    const processedImage = Buffer.from(
      await response.arrayBuffer()
    );

    const outputPath = path.join(
      __dirname,
      "grayscale-output.png"
    );

    fs.writeFileSync(outputPath, processedImage);

    console.log("Grayscale processing successful!");
    console.log("Saved processed image to:", outputPath);
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

testGrayscale();