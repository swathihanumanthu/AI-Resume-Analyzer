import mammoth from 'mammoth';
import { cleanText } from './text-cleaner';

export interface DocxParseResult {
  text: string;
  error?: string;
}

export async function parseDocxBuffer(buffer: Buffer): Promise<DocxParseResult> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = cleanText(result.value || '');

    if (!text || text.trim().length === 0) {
      return {
        text: '',
        error: 'No text content could be extracted from this DOCX file.',
      };
    }

    return { text };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown DOCX parsing error';
    return {
      text: '',
      error: `DOCX parsing error: ${msg}.`,
    };
  }
}
