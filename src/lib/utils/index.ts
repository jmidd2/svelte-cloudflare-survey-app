export * from './drag-drop';
export * from './form-fields';
// Legacy re-exports for backward compatibility
export { isValidFieldType as isHtmlFormField } from './form-fields/constants';
export * from './sanitize';
export * from './shadcn';

function generateShortHash(length = 6): string {
  const array = new Uint8Array(Math.ceil(length / 2));
  crypto.getRandomValues(array);
  return Array.from(array)
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length);
}

export function generateUrlSlug(name: string, withHash?: boolean): string {
  if (withHash === undefined) {
    withHash = true;
  }

  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const hash = withHash ? `-${generateShortHash()}` : '';
  return `${baseSlug}${hash}`;
}

export function getInitials(name: string): string {
  const allInitials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();
  if (allInitials.length === 0) return '?';
  if (allInitials.length === 1) return allInitials[0];
  return `${allInitials[0]}${allInitials[allInitials.length - 1]}`;
}
