<script lang="ts">
import { deserialize } from '$app/forms';
import {
  formElements,
  isFormFieldData,
  isHtmlFormField,
  sampleFormFieldLabels,
} from '$lib';
import FormField from '$lib/dnd/FormField.svelte';
import type {
  InsertFormField,
  SelectFormField,
} from '$lib/server/db/schema.js';
import type { HtmlFormElements } from '$lib/types';
import { triggerPostMoveFlash } from '@atlaskit/pragmatic-drag-and-drop-flourish/trigger-post-move-flash';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/types';
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import type {
  BaseEventPayload,
  ElementDragType,
} from '@atlaskit/pragmatic-drag-and-drop/types';
import { v4 as uuid } from 'uuid';
import { isFieldData } from './utils.js';

function generateFormFieldData(
  type: HtmlFormElements,
  orderIndex: number,
  formId: string
): Exclude<SelectFormField, 'createdAt' | 'updatedAt'> {
  const label =
    sampleFormFieldLabels[
      Math.floor(Math.random() * sampleFormFieldLabels.length)
    ];

  const options = [
    { label: 'value 1', val: 'val-1' },
    { label: 'value 2', val: 'val-2' },
    { label: 'value 3', val: 'val-3' },
  ];

  let fieldData: SelectFormField = {
    id: uuid(),
    formId,
    type,
    label,
    placeholder: label,
    orderIndex,
    createdAt: new Date(Date.now()),
    updatedAt: new Date(Date.now()),
    required: false,
    options: null,
  };

  switch (type) {
    case 'checkbox':
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

async function addFormField(field: InsertFormField) {
  let formData = new FormData();
  for (const [key, value] of Object.entries(field)) {
    if (typeof value === 'string' || typeof value === 'number') {
      formData.set(key, value.toString());
    } else if (value instanceof Date) {
      formData.set(key, value.getTime().toString());
    } else if (key === 'options') {
      formData.set(
        key,
        new Blob([JSON.stringify(field[key])], { type: 'application/json' })
      );
    }
  }

  const response = await fetch('?/addFormField', {
    method: 'POST',
    body: formData,
    headers: {
      'x-svelte-action': 'true',
    },
  });
}

type Props = {
  fields: SelectFormField[];
  saveSorted: () => void;
};
let { fields = $bindable(), saveSorted }: Props = $props();

function modifyOrderIndex(
  list: typeof fields,
  source: BaseEventPayload<ElementDragType>['source'],
  indexOfTarget: number,
  closestEdgeOfTarget: Edge | null
) {
  const copy = $state.snapshot(list);
  let temp: SelectFormField = {
    id: 'preview',
    createdAt: new Date(Date.now()),
    updatedAt: new Date(Date.now()),
    formId: 'preview-form-id',
    type: formElements[0],
    label: 'This is a label',
    required: false,
    placeholder: 'placeholder',
    options: null,
    orderIndex: 0,
  };

  const targetOrderIndex = fields[indexOfTarget].orderIndex;
  const targetFormId = fields[indexOfTarget].formId;

  if (!isHtmlFormField(source.data.elementType))
    throw new Error('not a HTML form tag');

  if (closestEdgeOfTarget === 'top') {
    temp = generateFormFieldData(
      source.data.elementType,
      targetOrderIndex,
      targetFormId
    );
    for (const element of copy) {
      if (element.orderIndex >= targetOrderIndex) {
        element.orderIndex++;
      }
    }
    // new element will be orderIndex - 1 and increment indexOfTarget to end
  } else if (closestEdgeOfTarget === 'bottom') {
    temp = generateFormFieldData(
      source.data.elementType,
      targetOrderIndex + 1,
      targetFormId
    );
    // new element will be orderIndex + 1 and increment indexOfTarget + 1 to end
    for (const element of copy) {
      if (element.orderIndex > targetOrderIndex) {
        element.orderIndex++;
      }
    }
  }

  return { reorderedList: copy, newField: temp };
}

async function handleDrop({
  location,
  source,
}: BaseEventPayload<ElementDragType>) {
  const target = location.current.dropTargets[0];
  if (!target) {
    return;
  }

  const sourceData = source.data;
  const targetData = target.data;

  if (!(isFieldData(sourceData) || isFieldData(targetData))) {
    return;
  }
  const closestEdgeOfTarget = extractClosestEdge(targetData);

  let indexOfSource = -1;
  let indexOfTarget = fields.findIndex(task => task.id === targetData.fieldId);

  if (indexOfTarget < 0) {
    return;
  }

  if (source.data.fieldId === 'preview') {
    const { reorderedList, newField } = modifyOrderIndex(
      fields,
      source,
      indexOfTarget,
      closestEdgeOfTarget
    );

    fields = reorderWithEdge({
      list: [...reorderedList, newField],
      startIndex: fields.length,
      indexOfTarget,
      closestEdgeOfTarget,
      axis: 'vertical',
    });

    await addFormField(newField);
  } else {
    indexOfSource = fields.findIndex(task => task.id === sourceData.fieldId);

    if (indexOfSource < 0) {
      return;
    }

    fields = reorderWithEdge({
      list: fields,
      startIndex: indexOfSource,
      indexOfTarget,
      closestEdgeOfTarget,
      axis: 'vertical',
    });

    const element = document.querySelector(
      `[data-task-id="${sourceData.fieldId}"]`
    );

    if (element instanceof HTMLElement) {
      triggerPostMoveFlash(element);
    }
  }

  saveSorted();
}

$effect(() => {
  return monitorForElements({
    canMonitor({ source }) {
      return isFieldData(source.data);
    },
    onDrop: handleDrop,
  });
});
</script>

<div class="grid grid-cols-1 gap-y-4 p-2">
    {#each fields as field, index}
        <FormField bind:field={fields[index]}/>
    {/each}
</div>
