import pdfParse from 'pdf-parse';
import { cleanText } from './text-cleaner';

export interface PdfParseResult {
  text: string;
  isScannedOrUnreadable: boolean;
  error?: string;
  numPages?: number;
}

export async function parsePdfBuffer(buffer: Buffer): Promise<PdfParseResult> {
  try {
    const parsed = await pdfParse(buffer);
    const text = cleanText(parsed.text || '');

    // Check if text is empty or virtually empty (less than 15 characters, indicating image-only/scanned PDF)
    if (!text || text.replace(/[\s\n\t]/g, '').length < 15) {
      return {
        text: '',
        isScannedOrUnreadable: true,
        error: 'Text could not be extracted from this PDF. Please upload a text-based PDF or DOCX.',
        numPages: parsed.numpages || 1,
      };
    }

    return {
      text,
      isScannedOrUnreadable: false,
      numPages: parsed.numpages || 1,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown PDF parsing error';
    return {
      text: '',
      isScannedOrUnreadable: true,
      error: `PDF parsing error: ${msg}. Text could not be extracted from this PDF. Please upload a text-based PDF or DOCX.`,
    };
  }
}
