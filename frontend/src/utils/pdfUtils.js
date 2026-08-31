import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import Tesseract from "tesseract.js";

// Use jsdelivr CDN which has better version support
// This will use the same version as your installed package
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.296/legacy/build/pdf.worker.min.mjs`;

/**
 * Converts PDF page to image canvas
 * @param {PDFPage} page - PDF page
 * @returns {Promise<Canvas>} - canvas with rendered page
 */
const pageToCanvas = async (page) => {
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const context = canvas.getContext("2d");
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas;
};

/**
 * Extracts text from image using OCR (Tesseract)
 * @param {Canvas} canvas - Canvas with image
 * @returns {Promise<string>} - extracted text
 */
const extractTextFromImage = async (canvas) => {
  try {
    const worker = await Tesseract.createWorker();
    const { data: { text } } = await worker.recognize(canvas);
    await worker.terminate();
    return text;
  } catch (err) {
    console.error("OCR extraction failed:", err);
    throw new Error(`OCR extraction failed: ${err.message}`);
  }
};

/**
 * Extracts text from a PDF file (handles both text and image-based PDFs)
 * @param {File} file - PDF file
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<string>} - extracted text
 */
export const extractPDFText = async (file, onProgress = null) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let text = "";
    let isImageBased = false;

    for (let i = 1; i <= pdf.numPages; i++) {
      if (onProgress) {
        onProgress(`Processing page ${i} of ${pdf.numPages}...`);
      }

      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(" ");

      if (pageText.trim().length > 0) {
        // Page has extractable text
        text += pageText + "\n";
      } else {
        // Page might be image-based, try OCR
        isImageBased = true;

        if (onProgress) {
          onProgress(`Running OCR on page ${i}...`);
        }

        try {
          const canvas = await pageToCanvas(page);
          const ocrText = await extractTextFromImage(canvas);
          if (ocrText.trim().length > 0) {
            text += ocrText + "\n";
          }
        } catch (ocrErr) {
          console.warn(`OCR failed for page ${i}:`, ocrErr);
          text += `[Unable to extract text from page ${i}]\n`;
        }
      }
    }

    if (text.trim().length === 0) {
      throw new Error("No text could be extracted from the PDF");
    }

    return text.trim();
  } catch (err) {
    console.error("PDF extraction failed:", err);
    throw new Error(`Failed to extract PDF text: ${err.message}`);
  }
};