import type { SelectFormField } from '$lib/server/db/schema';

function createTaggedDataFactory<T extends Record<string, unknown>>(
  symbolDescription: string
) {
  const key = Symbol(symbolDescription);

  type Tagged<Data> = Data & { [key]: true };

  function create<Data extends T>(data: Data): Tagged<Data> {
    return { [key]: true, ...data } as Tagged<Data>;
  }

  function isTagged(data: Record<string | symbol, unknown>): data is Tagged<T> {
    return data[key] === true;
  }

  return { create, isTagged, key } as const;
}

// Toolbox List Field Data
const toolboxListField = createTaggedDataFactory<{ fieldId: string }>(
  'toolbox-list-field'
);
export type ToolboxListFieldData = ReturnType<
  typeof toolboxListField.create<{ fieldId: string }>
>;
export const getToolboxListFieldData = (field: SelectFormField) =>
  toolboxListField.create({ fieldId: field.id });
export const isToolboxListFieldData = toolboxListField.isTagged;

// Field Data
const fieldData = createTaggedDataFactory<{ fieldId: SelectFormField['id'] }>(
  'field'
);
export type FieldData = ReturnType<
  typeof fieldData.create<{ fieldId: SelectFormField['id'] }>
>;
export const getFieldData = (field: SelectFormField) =>
  fieldData.create({ fieldId: field.id });
export const isFieldData = fieldData.isTagged;

// New Field Data
const newFieldData = createTaggedDataFactory<SelectFormField>('new-field');
export type NewFieldData = ReturnType<
  typeof newFieldData.create<SelectFormField>
>;
export const getNewFieldData = (field: SelectFormField) =>
  newFieldData.create(field);
export const isNewFieldData = newFieldData.isTagged;
