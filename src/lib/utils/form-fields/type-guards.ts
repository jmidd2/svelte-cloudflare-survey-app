import type { SelectFormField } from '$lib/server/db/schema';
import { FIELD_FEATURES, type FormFieldType } from '$lib/types.d';
import { isValidFieldType } from './constants';
import type { FieldWithOptions } from './types.d';

/**
 * Type guard to check if a value is a valid FormFieldType
 * @deprecated Use isValidFieldType from $lib/types instead
 */
export function isHtmlFormField(
  fieldType: unknown
): fieldType is FormFieldType {
  return isValidFieldType(fieldType);
}

/**
 * Comprehensive validation for SelectFormField objects
 */
export function isSelectFormField(field: unknown): field is SelectFormField {
  if (!field || typeof field !== 'object') return false;

  const candidate = field as SelectFormField;
  const hasRequiredFields = [
    candidate.formId,
    candidate.id,
    candidate.type,
    candidate.label,
    candidate.required,
    candidate.placeholder,
    candidate.orderIndex,
  ].every(prop => prop !== undefined);

  if (!(hasRequiredFields && isValidFieldType(candidate.type))) return false;

  const typeRequiresOptions = FIELD_FEATURES.SUPPORTS_OPTIONS.includes(
    candidate.type as (typeof FIELD_FEATURES.SUPPORTS_OPTIONS)[number]
  );

  return typeRequiresOptions
    ? Array.isArray(candidate.options) || candidate.options === null
    : true;
}

/**
 * Check if a field type supports a specific feature
 */
export function fieldSupportsFeature(
  fieldType: FormFieldType,
  feature: 'value' | 'placeholder' | 'options'
): boolean {
  switch (feature) {
    case 'options':
      return FIELD_FEATURES.SUPPORTS_OPTIONS.includes(
        fieldType as (typeof FIELD_FEATURES.SUPPORTS_OPTIONS)[number]
      );
    case 'placeholder':
      return FIELD_FEATURES.SUPPORTS_PLACEHOLDER.includes(
        fieldType as (typeof FIELD_FEATURES.SUPPORTS_PLACEHOLDER)[number]
      );
    case 'value':
      return FIELD_FEATURES.SUPPORTS_VALUE.includes(fieldType);
    default:
      return false;
  }
}

/**
 * Type guard for fields that support options
 */
export function fieldSupportsOptions(
  type: FormFieldType
): type is (typeof FIELD_FEATURES.SUPPORTS_OPTIONS)[number] {
  return fieldSupportsFeature(type, 'options');
}

/**
 * Type guard for fields that support placeholders
 */
export function fieldSupportsPlaceholder(
  type: FormFieldType
): type is (typeof FIELD_FEATURES.SUPPORTS_PLACEHOLDER)[number] {
  return fieldSupportsFeature(type, 'placeholder');
}

/**
 * Type guard for fields that can have options
 */
export function fieldCanHaveOptions(
  field: SelectFormField
): field is SelectFormField & {
  type: (typeof FIELD_FEATURES.SUPPORTS_OPTIONS)[number];
} {
  return fieldSupportsOptions(field.type);
}

/**
 * Type guard for fields that actually have options configured
 */
export function fieldHasOptions(
  field: SelectFormField
): field is FieldWithOptions {
  return (
    fieldCanHaveOptions(field) &&
    field.options !== null &&
    Array.isArray(field.options)
  );
}

/**
 * Type guard for fields that can have placeholders
 */
export function fieldCanHavePlaceholder(
  field: SelectFormField
): field is SelectFormField & {
  type: (typeof FIELD_FEATURES.SUPPORTS_PLACEHOLDER)[number];
} {
  return fieldSupportsPlaceholder(field.type);
}

/**
 * Type guard for fields that actually have placeholders configured
 */
export function fieldHasPlaceholder(
  field: SelectFormField
): field is SelectFormField & {
  type: (typeof FIELD_FEATURES.SUPPORTS_PLACEHOLDER)[number];
  placeholder: NonNullable<SelectFormField['placeholder']>;
} {
  return (
    fieldCanHavePlaceholder(field) &&
    field.placeholder !== null &&
    field.placeholder !== undefined &&
    field.placeholder.trim().length > 0
  );
}
