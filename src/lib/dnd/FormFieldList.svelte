<script lang="ts">
import { formElements, isHtmlFormField, sampleFormFieldLabels } from '$lib';
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
  saveSorted: (
    sortedData?: { orderIndex: number; id: string }[]
  ) => Promise<void>;
};
let { fields = $bindable(), saveSorted }: Props = $props();

function addNewFieldToArray(
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

  const targetOrderIndex = list[indexOfTarget].orderIndex;
  const targetFormId = list[indexOfTarget].formId;

  if (!isHtmlFormField(source.data.elementType))
    throw new Error('not a HTML form tag');

  if (closestEdgeOfTarget === 'top') {
    temp = generateFormFieldData(
      source.data.elementType,
      targetOrderIndex,
      targetFormId
    );
    // for (const element of copy) {
    //   if (element.orderIndex >= targetOrderIndex) {
    //     element.orderIndex++;
    //   }
    // }
    // new element will be orderIndex - 1 and increment indexOfTarget to end
  } else if (closestEdgeOfTarget === 'bottom') {
    temp = generateFormFieldData(
      source.data.elementType,
      targetOrderIndex + 1,
      targetFormId
    );
    // new element will be orderIndex + 1 and increment indexOfTarget + 1 to end
    // for (const element of copy) {
    //   if (element.orderIndex > targetOrderIndex) {
    //     element.orderIndex++;
    //   }
    // }
  }

  const newCopy = reorderArray(
    copy,
    -1,
    indexOfTarget,
    temp,
    closestEdgeOfTarget
  );

  return { list: newCopy, field: temp };
}

function reorderArray(
  list,
  sourceIndex,
  targetIndex,
  element,
  edge?: Edge | null
) {
  let copy = [...list];

  console.log(
    sourceIndex >= 0 ? 'modify' : 'add',
    { length: copy.length, source: sourceIndex, target: targetIndex, edge },
    element
  );

  if (sourceIndex < 0) {
    // new element is from a preview
    if (targetIndex === 0) {
      console.log('add @ beginning');
      copy = [element, ...copy];
    } else if (targetIndex === copy.length) {
      console.log('add @ end');
      copy = [...copy, element];
    } else {
      console.log('add in middle');
      if (edge === 'top') {
        copy = [
          ...copy.slice(0, targetIndex),
          element,
          ...copy.slice(targetIndex),
        ];
      } else if (edge === 'bottom') {
        copy = [
          ...copy.slice(0, targetIndex + 1),
          element,
          ...copy.slice(targetIndex + 1),
        ];
      }
    }
  } else if (targetIndex + 1 === copy.length) {
    console.log('target is end');
    copy = [...copy.filter(e => e.id !== element.id), element];
  } else if (sourceIndex === 0) {
    console.log('source is beginning');
    copy = [...copy.slice(1, targetIndex), element, ...copy.slice(targetIndex)];
  } else {
    if (targetIndex === 0) {
      console.log('target is beginning');
      copy = [element, ...copy.filter(e => e.id !== element.id)];
    } else {
      console.log('target is middle');
      if (sourceIndex > targetIndex) {
        // move up
        copy = [
          ...copy.slice(0, targetIndex),
          element,
          ...copy.filter(e => e.id !== element.id).slice(targetIndex),
        ];
      } else if (sourceIndex < targetIndex) {
        // move down
        copy = [
          ...copy.filter(e => e.id !== element.id).slice(0, targetIndex),
          element,
          ...copy.slice(targetIndex + 1),
        ];
      }
    }
  }

  for (let i = 0; i < copy.length; i++) {
    copy[i].orderIndex = i + 1;
  }

  return copy;
}

function modifyOrder(
  list: typeof fields,
  indexOfSource: number,
  indexOfTarget: number,
  closestEdgeOfTarget: Edge | null
) {
  let copy = $state.snapshot(list);

  const targetOrderIndex = list[indexOfTarget].orderIndex;
  const sourceField = copy[indexOfSource];

  if (closestEdgeOfTarget === 'top') {
    sourceField.orderIndex = targetOrderIndex;
  } else if (closestEdgeOfTarget === 'bottom') {
    sourceField.orderIndex = targetOrderIndex + 1;
  }

  copy = reorderArray(copy, indexOfSource, indexOfTarget, sourceField);

  return copy;
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

  let copyOfFields = $state.snapshot(fields);
  let newFields = [];

  if (source.data.fieldId === 'preview') {
    console.log('adding new field');
    // New field being added
    const { list, field } = addNewFieldToArray(
      copyOfFields,
      source,
      indexOfTarget,
      closestEdgeOfTarget
    );

    newFields = list;

    await addFormField(field);
  } else {
    // reordering existing items
    console.log('reordering');
    indexOfSource = fields.findIndex(task => task.id === sourceData.fieldId);

    if (indexOfSource < 0) {
      return;
    }

    newFields = modifyOrder(
      copyOfFields,
      indexOfSource,
      indexOfTarget,
      closestEdgeOfTarget
    );

    const element = document.querySelector(
      `[data-task-id="${sourceData.fieldId}"]`
    );

    if (element instanceof HTMLElement) {
      triggerPostMoveFlash(element);
    }
  }
  console.log(
    'new fields',
    newFields,
    newFields.map(e => e.orderIndex)
  );
  await saveSorted(newFields);
  fields = newFields;
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
