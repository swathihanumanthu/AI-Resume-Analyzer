// Text cleaning and normalization utility

export function cleanText(input: string): string {
  if (!input) return '';

  return input
    // Replace non-breaking spaces and unusual whitespace
    .replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000]/g, ' ')
    // Normalize Unicode bullets to standard bullet and single space
    .replace(/[\u2022\u2023\u25E6\u2043\u2219\u25C6\u25AA\u25AB]\s*/g, '• ')
    // Remove control characters (except newline, tab, carriage return)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Normalize CRLF to LF
    .replace(/\r\n/g, '\n')
    // Reduce multiple blank lines to max 2
    .replace(/\n{3,}/g, '\n\n')
    // Trim leading/trailing space on lines
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .trim();
}

export function extractTokens(text: string): string[] {
  if (!text) return [];
  const cleaned = cleanText(text).toLowerCase();
  // Split on non-alphanumeric characters except +, #, ., - (to preserve C++, C#, React.js, CI/CD)
  return cleaned
    .split(/[^a-z0-9+#.-]+/i)
    .filter((token) => token.length > 1 && !/^\d+$/.test(token));
}
