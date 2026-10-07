const fs = require('fs');
const path = require('path');
const Tesseract = require('tesseract.js');
let pdfParse = null;

try {
  pdfParse = require('pdf-parse');
} catch (e) {
  console.warn('pdf-parse not loaded:', e.message);
}

class OcrService {
  /**
   * Performs text extraction from an uploaded image or PDF document.
   * @param {string} filePath Absolute or relative path to file
   * @param {string} mimeType File mime type
   * @returns {Promise<{ text: string, confidence: number }>}
   */
  async extractText(filePath, mimeType = '') {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    const ext = path.extname(filePath).toLowerCase();

    // PDF processing
    if (ext === '.pdf' || mimeType.includes('pdf')) {
      return await this.extractFromPdf(filePath);
    }

    // Image processing with Tesseract.js
    return await this.extractFromImage(filePath);
  }

  async extractFromPdf(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    let text = '';
    let pageCount = 1;

    try {
      if (typeof pdfParse === 'function') {
        const data = await pdfParse(dataBuffer);
        text = data.text ? data.text.trim() : '';
        pageCount = data.numpages || 1;
      } else if (pdfParse && pdfParse.PDFParse) {
        const parser = new pdfParse.PDFParse({ data: dataBuffer });
        const result = await parser.getText();
        text = result.text ? result.text.trim() : '';
        pageCount = result.total || (result.pages ? result.pages.length : 1);
        if (typeof parser.destroy === 'function') {
          await parser.destroy();
        }
      }
    } catch (parseErr) {
      console.warn('PDF parser encountered error, attempting raw text extraction:', parseErr.message);
      const raw = dataBuffer.toString('latin1');
      const matches = raw.match(/\(([^()]+)\)Tj/g) || [];
      if (matches.length > 0) {
        text = matches.map(m => m.replace(/^\(/, '').replace(/\)Tj$/, '')).join(' ');
      }
    }

    return {
      text: text,
      confidence: text.length > 30 ? 92 : 50,
      pageCount: pageCount
    };
  }

  async extractFromImage(filePath) {
    try {
      const result = await Tesseract.recognize(filePath, 'eng', {
        logger: m => {
          // progress logging suppressed in production
        }
      });

      const text = result.data.text ? result.data.text.trim() : '';
      const confidence = Math.round(result.data.confidence || 85);

      return {
        text: text,
        confidence: confidence
      };
    } catch (err) {
      console.error('Tesseract OCR error:', err);
      // Fallback response with informative error
      throw new Error(`OCR processing failed: ${err.message}`);
    }
  }
}

module.exports = new OcrService();
