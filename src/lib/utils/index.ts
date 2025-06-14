export * from './shadcn';
export * from './form-fields';
export * from './drag-drop';
export * from './sanitize';

// Legacy re-exports for backward compatibility
export { isValidFieldType as isHtmlFormField } from './form-fields/constants';

function generateShortHash(length = 6): string {
  const array = new Uint8Array(Math.ceil(length / 2));
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length);
}

export function generateUrlSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const hash = generateShortHash();
  return `${baseSlug}-${hash}`;
}
