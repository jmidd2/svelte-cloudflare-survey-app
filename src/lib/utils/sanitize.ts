// Input sanitization function that preserves Unicode characters
function sanitizeInput(input: string): string {
  if (!input) return input;

  return (
    input
      // Remove potentially dangerous HTML tags but preserve Unicode
      .replace(/<script[^>]*>.*?<\/script>/gis, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gis, '')
      .replace(/<object[^>]*>.*?<\/object>/gis, '')
      .replace(/<embed[^>]*>/gi, '')
      .replace(/<link[^>]*>/gi, '')
      .replace(/<meta[^>]*>/gi, '')
      .replace(/<style[^>]*>.*?<\/style>/gis, '')
      // Remove dangerous attributes
      .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '') // onclick, onload, etc.
      .replace(/\s*javascript\s*:/gi, '')
      // Remove null bytes and control characters except newlines/tabs
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Trim whitespace
      .trim()
  );
}

// Sanitize form data helper
export function sanitizeFormData(formData: FormData): FormData {
  const sanitized = new FormData();

  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      sanitized.set(key, sanitizeInput(value));
    } else {
      sanitized.set(key, value); // File uploads, etc.
    }
  }

  return sanitized;
}
