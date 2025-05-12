import type { SelectFormField } from '$lib/server/db/schema';

const fieldDataKey = Symbol('field');

export type FieldData = {
  [fieldDataKey]: true;
  fieldId: SelectFormField['id'];
};

export function getFieldData(field: SelectFormField): FieldData {
  return {
    [fieldDataKey]: true,
    fieldId: field.id,
  };
}

export function isFieldData(
  data: Record<string | symbol, unknown>
): data is FieldData {
  return data[fieldDataKey] === true;
}
