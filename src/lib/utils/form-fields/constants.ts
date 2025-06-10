import {
  FIELD_FEATURES,
  FORM_FIELD_TYPES,
  type FormFieldType,
} from '$lib/types.d';

// Helper function to get all field types as array
export function getAllFieldTypes(): readonly FormFieldType[] {
  return Object.values(FORM_FIELD_TYPES);
}

// Helper function to check if a value is a valid field type
export function isValidFieldType(value: unknown): value is FormFieldType {
  return (
    typeof value === 'string' &&
    Object.values(FORM_FIELD_TYPES).includes(value as FormFieldType)
  );
}

// Legacy exports for backward compatibility
export const FIELD_TYPES_WITH_OPTIONS = FIELD_FEATURES.SUPPORTS_OPTIONS;
export const FIELD_TYPES_WITH_PLACEHOLDER = FIELD_FEATURES.SUPPORTS_PLACEHOLDER;
export const ALL_FIELD_TYPES = getAllFieldTypes();
