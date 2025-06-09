import { sampleFormFieldLabels } from '$lib/sample';
import type { SelectFormField } from '$lib/server/db/schema';
import type { FormFieldType } from '$lib/types';
import { v4 as uuid } from 'uuid';

export function generatePreviewFieldData(
  type: FormFieldType,
  formId: string
): SelectFormField {
  const label =
    sampleFormFieldLabels[
      Math.floor(Math.random() * sampleFormFieldLabels.length)
    ];

  const options = [
    { label: 'value 1', val: 'val-1' },
    { label: 'value 2', val: 'val-2' },
    { label: 'value 3', val: 'val-3' },
  ];

  const fieldData: SelectFormField = {
    id: uuid(),
    label,
    placeholder: label,
    required: false,
    options: null,
    type,
    createdAt: new Date(),
    updatedAt: new Date(),
    formId,
    orderIndex: -1,
  };

  switch (type) {
    case 'checkbox':
      fieldData.options = options;
      break;
    case 'date':
      break;
    case 'email':
      fieldData.placeholder = 'email@email.com';
      break;
    case 'number':
      fieldData.placeholder = '10';
      break;
    case 'radio':
      fieldData.options = options;
      break;
    case 'range':
      break;
    case 'tel':
      fieldData.placeholder = '111-222-3333';
      break;
    case 'text':
      break;
    case 'textarea':
      break;
    case 'select':
      fieldData.options = options;
      break;
    default:
      break;
  }

  return fieldData;
}
