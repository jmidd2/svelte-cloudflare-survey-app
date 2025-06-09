import type { SelectFormField } from '$lib/server/db/schema';

/**
 * Generate a slug from field label and ID
 */
export function genSlug({ label, id }: SelectFormField): string {
  return `${label.toLowerCase().replaceAll(' ', '-')}-${id}`;
}

// Form field utilities barrel file
export * from './constants';
export * from './types.d';
export * from './type-guards';
