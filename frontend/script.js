(() => {
  "use strict";

  // ==========================================
  // 1. Configuration
  // ==========================================
  const API_URL = "http://localhost:5000/api/process";
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB (matches backend)

  // ==========================================
  // 2. Application state
  // ==========================================
  const state = {
    file: null,
    objectUrl: null,
    processedDataUrl: null,
    origWidth: 0,
    origHeight: 0,
    processedWidth: 0,
    processedHeight: 0,
    processedMime: "image/png",
    selectedOperation: "grayscale"
  };

  // ==========================================
  // 3. DOM elements
  // ==========================================
  const dom = {
    fileInput: document.getElementById("file-input"),
    uploadArea: document.getElementById("drop-zone"),
    browseBtn: document.getElementById("browse-btn"),
    changeImageBtn: document.getElementById("change-image-btn"),

    workspace: document.getElementById("workspace-area"),
    previewImg: document.getElementById("source-preview"),

    fileName: document.getElementById("meta-name"),
    fileSize: document.getElementById("meta-size"),
    imageDimensions: document.getElementById("meta-dims"),

    operationSelect: document.getElementById("operation-select"),
    processBtn: document.getElementById("process-btn"),

    errorBanner: document.getElementById("error-banner"),
    errorMessage: document.getElementById("error-message"),

    resultsSection: document.getElementById("results"),
    resultOrigImg: document.getElementById("result-orig-img"),
    resultProcImg: document.getElementById("result-proc-img"),

    tagOpName: document.getElementById("tag-op-name"),
    summaryOperation: document.getElementById("summary-operation"),
    summaryParams: document.getElementById("summary-params"),
    summaryResolution: document.getElementById("summary-resolution"),

    specsOriginal: document.getElementById("specs-original"),
    specsProcessed: document.getElementById("specs-processed"),

    downloadBtn: document.getElementById("download-btn"),
    resetBtn: document.getElementById("process-another-btn"),

    grayscaleSlider: document.getElementById("grayscale-slider"),
    blurSlider: document.getElementById("blur-slider"),
    sharpenSlider: document.getElementById("sharpen-slider"),
    rotateSlider: document.getElementById("rotate-slider"),
    compressSlider: document.getElementById("compress-slider"),
    formatSelect: document.getElementById("format-select"),

    resizeWidth: document.getElementById("resize-w"),
    resizeHeight: document.getElementById("resize-h"),
    aspectRatioLock: document.getElementById("aspect-ratio-lock")
  };

  // ==========================================
  // 4. Helper functions
  // ==========================================
  function formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes";

    const units = ["Bytes", "KB", "MB", "GB"];
    const index = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1
    );

    return (
      (bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 2) +
      " " +
      units[index]
    );
  }

  function showError(message) {
    if (dom.errorMessage) {
      dom.errorMessage.textContent = message;
    }

    if (dom.errorBanner) {
      dom.errorBanner.hidden = false;
    } else {
      alert(message);
    }
  }

  function clearError() {
    if (dom.errorMessage) {
      dom.errorMessage.textContent = "";
    }

    if (dom.errorBanner) {
      dom.errorBanner.hidden = true;
    }
  }

  function releaseObjectUrl(url) {
    if (url && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }

  function setImageSource(element, url) {
    if (element) {
      element.src = url;
    }
  }

  // ==========================================
  // 5. Open file picker
  // ==========================================
  function openFilePicker() {
    if (dom.fileInput) {
      dom.fileInput.click();
    }
  }

  // ==========================================
  // 6. Handle image upload
  // ==========================================
  function handleFile(file) {
    clearError();

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Please select a valid image file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      showError("Image size must not exceed 10 MB.");
      return;
    }

    releaseObjectUrl(state.objectUrl);
    releaseObjectUrl(state.processedDataUrl);

    state.file = file;
    state.objectUrl = URL.createObjectURL(file);
    state.processedDataUrl = null;

    state.origWidth = 0;
    state.origHeight = 0;
    state.processedWidth = 0;
    state.processedHeight = 0;

    const image = new Image();

    image.onload = () => {
      state.origWidth = image.naturalWidth;
      state.origHeight = image.naturalHeight;

      setImageSource(dom.previewImg, state.objectUrl);

      if (dom.fileName) {
        dom.fileName.textContent = file.name;
      }

      if (dom.fileSize) {
        dom.fileSize.textContent = formatBytes(file.size);
      }

      if (dom.imageDimensions) {
        dom.imageDimensions.textContent =
          `${state.origWidth} × ${state.origHeight} px`;
      }

      // Fill resize fields with the original dimensions.
      updateResizeDimensions(state.origWidth, state.origHeight);

      if (dom.workspace) {
        dom.workspace.hidden = false;
      }

      if (dom.uploadArea) {
        dom.uploadArea.hidden = true;
      }

      if (dom.resultsSection) {
        dom.resultsSection.hidden = true;
      }

      image.onload = null;
    };

    image.onerror = () => {
      showError("This image could not be opened. Please choose another.");

      releaseObjectUrl(state.objectUrl);
      state.objectUrl = null;
      state.file = null;
    };

    image.src = state.objectUrl;
  }

  // ==========================================
  // 7. Operation selector and parameter panels
  // ==========================================
  function updateOperationPanel() {
    const operation = state.selectedOperation;

    const panels = [
      "grayscale",
      "resize",
      "blur",
      "sharpen",
      "rotate",
      "compress",
      "format"
    ];

    panels.forEach((name) => {
      const panel = document.getElementById(`panel-${name}`);

      if (panel) {
        panel.hidden = name !== operation;
      }
    });

    clearError();
  }

  function updateSliderLabels() {
    const labels = [
      ["grayscale-slider", "val-grayscale", (v) => `${v}%`],
      ["blur-slider", "val-blur", (v) => `${v} px`],
      ["sharpen-slider", "val-sharpen", (v) => `${v}`],
      ["rotate-slider", "val-rotate", (v) => `${v}°`],
      ["compress-slider", "val-compress", (v) => `${v}%`]
    ];

    labels.forEach(([sliderId, labelId, format]) => {
      const slider = document.getElementById(sliderId);
      const label = document.getElementById(labelId);

      if (slider && label) {
        label.textContent = format(slider.value);

        slider.addEventListener("input", () => {
          label.textContent = format(slider.value);
        });
      }
    });
  }

  // ==========================================
  // 8. Resize controls
  // ==========================================
  function updateResizeDimensions(width, height) {
    if (dom.resizeWidth) {
      dom.resizeWidth.value = Math.max(1, Math.round(width));
    }

    if (dom.resizeHeight) {
      dom.resizeHeight.value = Math.max(1, Math.round(height));
    }
  }

  function setupResizeControls() {
    if (dom.resizeWidth) {
      dom.resizeWidth.addEventListener("input", () => {
        if (
          dom.aspectRatioLock &&
          dom.aspectRatioLock.checked &&
          state.origWidth > 0 &&
          state.origHeight > 0
        ) {
          const width = Number(dom.resizeWidth.value);

          if (width > 0) {
            dom.resizeHeight.value = Math.round(
              (width * state.origHeight) / state.origWidth
            );
          }
        }
      });
    }

    if (dom.resizeHeight) {
      dom.resizeHeight.addEventListener("input", () => {
        if (
          dom.aspectRatioLock &&
          dom.aspectRatioLock.checked &&
          state.origWidth > 0 &&
          state.origHeight > 0
        ) {
          const height = Number(dom.resizeHeight.value);

          if (height > 0) {
            dom.resizeWidth.value = Math.round(
              (height * state.origWidth) / state.origHeight
            );
          }
        }
      });
    }

    document.querySelectorAll("[data-scale]").forEach((button) => {
      button.addEventListener("click", () => {
        if (!state.origWidth || !state.origHeight) {
          showError("Upload an image before selecting a resize preset.");
          return;
        }

        const scale = Number(button.dataset.scale);

        updateResizeDimensions(
          state.origWidth * scale,
          state.origHeight * scale
        );
      });
    });

    document.querySelectorAll("[data-angle]").forEach((button) => {
      button.addEventListener("click", () => {
        if (dom.rotateSlider) {
          dom.rotateSlider.value = button.dataset.angle;
          dom.rotateSlider.dispatchEvent(new Event("input"));
        }
      });
    });
  }

  // ==========================================
  // 9. Process image using Express + Sharp
  // Supports grayscale and resize
  // ==========================================
  async function processImage() {
    if (!state.file) {
      showError("Please upload an image first.");
      return;
    }

    const operation = state.selectedOperation;

    let width = state.origWidth;
    let height = state.origHeight;

    clearError();

    // Read and validate dimensions for resizing.
    if (operation === "resize") {
      width = Number(dom.resizeWidth?.value);
      height = Number(dom.resizeHeight?.value);

      if (
        !Number.isInteger(width) ||
        !Number.isInteger(height) ||
        width < 1 ||
        height < 1 ||
        width > 5000 ||
        height > 5000
      ) {
        showError("Width and height must be between 1 and 5000 pixels.");
        return;
      }
    } else if (operation !== "grayscale") {
      showError("Only grayscale and resize are supported right now.");
      return;
    }

    const originalButtonText = dom.processBtn
      ? dom.processBtn.innerHTML
      : "Process Image";

    if (dom.processBtn) {
      dom.processBtn.disabled = true;
      dom.processBtn.textContent = "Processing...";
    }

    try {
      const formData = new FormData();

      // Send the image file.
      formData.append("image", state.file);

      // Send the requested operation.
      formData.append("operation", operation);

      // Send dimensions only when resizing.
      if (operation === "resize") {
        formData.append("width", String(width));
        formData.append("height", String(height));
      }

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        let message = `Processing failed (${response.status}).`;

        try {
          const data = await response.json();

          if (data.message) {
            message = data.message;
          }
        } catch {
          // Keep the default error message.
        }

        throw new Error(message);
      }

      const processedBlob = await response.blob();

      if (!processedBlob.size) {
        throw new Error("The server returned an empty image.");
      }

      const processedUrl = URL.createObjectURL(processedBlob);

      releaseObjectUrl(state.processedDataUrl);

      state.processedDataUrl = processedUrl;
      state.processedMime = processedBlob.type || "image/png";

      // Read the actual dimensions of the output image.
      const processedImage = new Image();

      await new Promise((resolve, reject) => {
        processedImage.onload = resolve;
        processedImage.onerror = reject;
        processedImage.src = processedUrl;
      });

      state.processedWidth = processedImage.naturalWidth;
      state.processedHeight = processedImage.naturalHeight;

      const operationName =
        operation === "resize"
          ? "Image Resizing"
          : "Grayscale Conversion";

      if (dom.tagOpName) {
        dom.tagOpName.textContent = operationName;
      }

      if (dom.summaryOperation) {
        dom.summaryOperation.textContent = operationName;
      }

      if (dom.summaryParams) {
        dom.summaryParams.textContent =
          operation === "resize"
            ? `Resized to ${state.processedWidth} × ${state.processedHeight} pixels.`
            : "Converted to grayscale using Sharp.";
      }

      if (dom.summaryResolution) {
        dom.summaryResolution.textContent =
          `${state.processedWidth} × ${state.processedHeight} px`;
      }

      setImageSource(dom.resultOrigImg, state.objectUrl);
      setImageSource(dom.resultProcImg, processedUrl);

      if (dom.specsOriginal) {
        dom.specsOriginal.textContent =
          `${state.origWidth} × ${state.origHeight} px • ${formatBytes(state.file.size)}`;
      }

      if (dom.specsProcessed) {
        dom.specsProcessed.textContent =
          `${state.processedWidth} × ${state.processedHeight} px • ${formatBytes(processedBlob.size)}`;
      }

      if (dom.resultsSection) {
        dom.resultsSection.hidden = false;
        dom.resultsSection.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    } catch (error) {
      console.error("Image processing error:", error);

      if (
        error instanceof TypeError &&
        error.message.toLowerCase().includes("fetch")
      ) {
        showError(
          "Cannot connect to the backend. Make sure your Express server is running on port 5000 and CORS is enabled."
        );
      } else {
        showError(error.message || "Unable to process this image.");
      }
    } finally {
      if (dom.processBtn) {
        dom.processBtn.disabled = false;
        dom.processBtn.innerHTML = originalButtonText;
      }
    }
  }

  // ==========================================
  // 10. Download processed image
  // ==========================================
  function downloadImage() {
    if (!state.processedDataUrl) {
      showError("Please process an image before downloading.");
      return;
    }

    const link = document.createElement("a");

    const extension =
      state.processedMime.includes("jpeg") ||
      state.processedMime.includes("jpg")
        ? "jpg"
        : state.processedMime.includes("webp")
          ? "webp"
          : "png";

    link.href = state.processedDataUrl;
    link.download = `imageprep-${state.selectedOperation}.${extension}`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  // ==========================================
  // 11. Reset and process another image
  // ==========================================
  function resetApp() {
    releaseObjectUrl(state.objectUrl);
    releaseObjectUrl(state.processedDataUrl);

    state.file = null;
    state.objectUrl = null;
    state.processedDataUrl = null;

    state.origWidth = 0;
    state.origHeight = 0;
    state.processedWidth = 0;
    state.processedHeight = 0;

    state.processedMime = "image/png";
    state.selectedOperation = "grayscale";

    if (dom.fileInput) {
      dom.fileInput.value = "";
    }

    [
      dom.previewImg,
      dom.resultOrigImg,
      dom.resultProcImg
    ].forEach((img) => {
      if (img) {
        img.removeAttribute("src");
      }
    });

    if (dom.fileName) dom.fileName.textContent = "-";
    if (dom.fileSize) dom.fileSize.textContent = "-";
    if (dom.imageDimensions) dom.imageDimensions.textContent = "-";

    if (dom.operationSelect) {
      dom.operationSelect.value = "grayscale";
    }

    if (dom.workspace) {
      dom.workspace.hidden = true;
    }

    if (dom.uploadArea) {
      dom.uploadArea.hidden = false;
    }

    if (dom.resultsSection) {
      dom.resultsSection.hidden = true;
    }

    if (dom.processBtn) {
      dom.processBtn.disabled = false;
    }

    updateOperationPanel();
    clearError();

    const processSection = document.getElementById("process");

    if (processSection) {
      processSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  // ==========================================
  // 12. Initialize event listeners
  // ==========================================
  function init() {
    // Browse button.
    if (dom.browseBtn) {
      dom.browseBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        openFilePicker();
      });
    }

    // Clicking the drop zone opens the file picker.
    if (dom.uploadArea) {
      dom.uploadArea.addEventListener("click", (event) => {
        if (event.target.closest("button")) {
          return;
        }

        openFilePicker();
      });

      dom.uploadArea.addEventListener("keydown", (event) => {
        if (event.target !== dom.uploadArea) return;

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openFilePicker();
        }
      });

      dom.uploadArea.addEventListener("dragover", (event) => {
        event.preventDefault();
        dom.uploadArea.classList.add("drag-over");
      });

      dom.uploadArea.addEventListener("dragleave", (event) => {
        if (!dom.uploadArea.contains(event.relatedTarget)) {
          dom.uploadArea.classList.remove("drag-over");
        }
      });

      dom.uploadArea.addEventListener("drop", (event) => {
        event.preventDefault();
        dom.uploadArea.classList.remove("drag-over");

        const file = event.dataTransfer.files[0];

        if (file) {
          handleFile(file);
        }
      });
    }

    // Change image button.
    if (dom.changeImageBtn) {
      dom.changeImageBtn.addEventListener("click", openFilePicker);
    }

    // File picker selection.
    if (dom.fileInput) {
      dom.fileInput.addEventListener("change", (event) => {
        const file = event.target.files[0];

        if (file) {
          handleFile(file);
        }
      });
    }

    // Operation dropdown.
    if (dom.operationSelect) {
      dom.operationSelect.addEventListener("change", (event) => {
        state.selectedOperation = event.target.value;
        updateOperationPanel();
      });
    }

    // Process image.
    if (dom.processBtn) {
      dom.processBtn.addEventListener("click", processImage);
    }

    // Download image.
    if (dom.downloadBtn) {
      dom.downloadBtn.addEventListener("click", downloadImage);
    }

    // Process another image.
    if (dom.resetBtn) {
      dom.resetBtn.addEventListener("click", resetApp);
    }

    updateSliderLabels();
    setupResizeControls();
    updateOperationPanel();

    // Hero button navigation.
    const heroStartBtn = document.getElementById("hero-start-btn");

    if (heroStartBtn) {
      heroStartBtn.addEventListener("click", () => {
        const section = document.getElementById("process");

        if (section) {
          section.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      });
    }

    console.log("ImagePrep initialized successfully.");
  }

  // ==========================================
  // 13. Start application
  // ==========================================
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();