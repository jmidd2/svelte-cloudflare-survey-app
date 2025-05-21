import { applyAction, deserialize } from '$app/forms';
import { goto } from '$app/navigation';
import { sampleFormFieldLabels } from '$lib/sample';
import type { SelectFormField } from '$lib/server/db/schema';
import type { HtmlFormElements, SaveSortedFnArgs } from '$lib/types';
import type { ActionResult } from '@sveltejs/kit';

export function genSlug({ label, id }: Pick<SelectFormField, 'label' | 'id'>) {
  return `${label.toLowerCase().replaceAll(' ', '-')}-${id}`;
}

export function isHtmlFormField(
  fieldType: unknown
): fieldType is HtmlFormElements {
  return formElements.includes(<HtmlFormElements>fieldType);
}

export function isFormFieldData(data: unknown): data is SelectFormField {
  return (
    !!(data as SelectFormField).createdAt &&
    !!(data as SelectFormField).updatedAt &&
    !!(data as SelectFormField).id &&
    !!(data as SelectFormField).formId &&
    !!(data as SelectFormField).type &&
    !!(data as SelectFormField).label &&
    (data as SelectFormField).required !== undefined &&
    !!(data as SelectFormField).orderIndex
  );
}

export function isSelectFormField(field: unknown): field is SelectFormField {
  return (
    (field as SelectFormField).formId !== undefined &&
    (field as SelectFormField).id !== undefined &&
    (field as SelectFormField).type !== undefined &&
    isHtmlFormField((field as SelectFormField).type) &&
    (field as SelectFormField).label !== undefined &&
    (field as SelectFormField).required !== undefined &&
    (field as SelectFormField).placeholder !== undefined &&
    (field as SelectFormField).orderIndex !== undefined &&
    ((((field as SelectFormField).type === 'select' ||
      (field as SelectFormField).type === 'radio' ||
      (field as SelectFormField).type === 'checkbox') &&
      Array.isArray((field as SelectFormField).options)) ||
      (field as SelectFormField).options === null)
  );
}

export const formElements: HtmlFormElements[] = [
  'text',
  'checkbox',
  'date',
  'email',
  'number',
  'radio',
  'range',
  'tel',
  'textarea',
  'select',
] as const;

export const formElementTags: Record<HtmlFormElements, string> = {
  checkbox: 'Checkbox',
  date: 'Date',
  email: 'Email',
  number: 'Number',
  radio: 'Radio',
  range: 'Range',
  tel: 'Telephone',
  text: 'Textbox',
  textarea: 'Textarea',
  select: 'Select',
  'yes-no': 'Yes/No',
} as const;

export async function saveSorted({
  sortedList,
  surveyId,
  ...args
}: SaveSortedFnArgs): Promise<void> {
  let sortedData: { orderIndex: number; id: string }[] = [...sortedList];

  if (args?.removedId) {
    sortedData = sortedList
      .filter(e => e.id !== args.removedId)
      .map((val, index) => {
        return {
          orderIndex: index + 1,
          id: val.id,
        };
      });
  }

  const formData = new FormData();

  formData.set('formId', surveyId);

  formData.set(
    'sortedData',
    new Blob([JSON.stringify(sortedData)], { type: 'application/json' })
  );

  const response = await fetch('?/reorder', {
    method: 'POST',
    body: formData,
    headers: {
      'x-svelte-action': 'true',
    },
  });

  const result: ActionResult<{ lastUpdated: Date }, { message: string }> =
    deserialize(await response.text());

  if (result.type === 'redirect') {
    await goto(result.location);
  }

  if (result.type === 'success') {
    const data = result.data;
    console.log('response', data);
  }
  applyAction(result);
}

export function generateFormFieldData(
  type: HtmlFormElements
): Pick<SelectFormField, 'label' | 'placeholder' | 'required' | 'options'> {
  const label =
    sampleFormFieldLabels[
      Math.floor(Math.random() * sampleFormFieldLabels.length)
    ];

  const options = [
    { label: 'value 1', val: 'val-1' },
    { label: 'value 2', val: 'val-2' },
    { label: 'value 3', val: 'val-3' },
  ];

  const fieldData: Pick<
    SelectFormField,
    'label' | 'placeholder' | 'required' | 'options'
  > = {
    label,
    placeholder: label,
    required: false,
    options: null,
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
