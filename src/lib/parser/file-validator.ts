// File validation utility

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateFile(
  filename: string,
  buffer?: Buffer | ArrayBuffer | string,
  sizeBytes?: number
): ValidationResult {
  const ext = filename.split('.').pop()?.toLowerCase() || '';

  if (!['pdf', 'docx', 'txt'].includes(ext)) {
    return {
      isValid: false,
      error: `Unsupported file extension '.${ext}'. Allowed formats: PDF, DOCX, TXT.`,
    };
  }

  const maxBytes = 10 * 1024 * 1024; // 10MB limit
  if (sizeBytes && sizeBytes > maxBytes) {
    return {
      isValid: false,
      error: `File '${filename}' exceeds maximum allowed size of 10MB.`,
    };
  }

  if (buffer) {
    let byteLen = 0;
    if (Buffer.isBuffer(buffer)) {
      byteLen = buffer.length;
    } else if (typeof buffer === 'string') {
      byteLen = Buffer.byteLength(buffer);
    } else if (buffer instanceof ArrayBuffer) {
      byteLen = buffer.byteLength;
    }

    if (byteLen === 0) {
      return {
        isValid: false,
        error: `File '${filename}' is empty (0 bytes).`,
      };
    }
  }

  return { isValid: true };
}
