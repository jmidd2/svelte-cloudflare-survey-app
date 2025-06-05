import { applyAction, deserialize } from '$app/forms';
import { goto } from '$app/navigation';
import { sampleFormFieldLabels } from '$lib/sample';
import type { SelectFormField } from '$lib/server/db/schema';
import type { HtmlFormElements, SaveSortedFnArgs } from '$lib/types';
import type { ActionResult } from '@sveltejs/kit';
import { v4 as uuid } from 'uuid';

const tlFieldDataKey = Symbol('toolbox-list-field');

export type ToolboxListFieldData = {
  [tlFieldDataKey]: true;
  fieldId: string;
};

export function getToolboxListFieldData(
  field: SelectFormField
): ToolboxListFieldData {
  return {
    [tlFieldDataKey]: true,
    fieldId: field.id,
  };
}

export function isToolboxListFieldData(
  data: Record<string | symbol, unknown>
): data is ToolboxListFieldData {
  return data[tlFieldDataKey] === true;
}
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

export type HasOptions = SelectFormField & {
  options: { val: string; label: string }[];
};

export function hasOptions(element: SelectFormField): element is HasOptions {
  return (
    canHaveOptions(element) && !!element.options && element.options.length > 0
  );
}

export function canHaveOptions(element: SelectFormField) {
  return (
    element.type === 'select' ||
    element.type === 'checkbox' ||
    element.type === 'radio'
  );
}

export function generateFormFieldData(type: HtmlFormElements) {
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
    'id' | 'label' | 'placeholder' | 'required' | 'options' | 'type'
  > = {
    id: uuid(),
    label,
    placeholder: label,
    required: false,
    options: null,
    type,
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
