<script lang="ts">
import { deserialize } from '$app/forms';
import {
  generateFormFieldData,
  isHtmlFormField,
  isSelectFormField,
  saveSorted,
} from '$lib';
import FormField from '$lib/components/FormField.svelte';
import { isFieldData } from '$lib/dnd';
import {
  type InsertFormField,
  type SelectFormField,
} from '$lib/server/db/schema.js';
import { triggerPostMoveFlash } from '@atlaskit/pragmatic-drag-and-drop-flourish/trigger-post-move-flash';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import type {
  BaseEventPayload,
  ElementDragType,
} from '@atlaskit/pragmatic-drag-and-drop/types';
import type { ActionResult } from '@sveltejs/kit';

type Props = {
  fields: SelectFormField[];
  selectedFormField: SelectFormField | null;
  pageState: 'idle' | 'loading';
};
let {
  fields = $bindable(),
  selectedFormField = $bindable(),
  pageState = $bindable(),
}: Props = $props();

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

  const result: ActionResult<{ data: SelectFormField }, { message: string }> =
    deserialize(await response.text());

  if (result.type === 'success' && isSelectFormField(result.data)) {
    return result.data;
  }

  throw new Error('a valid form field was not created');
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
  let newFields: SelectFormField[];

  if (source.data.fieldId === 'preview') {
    console.log('adding new field');

    const targetFormId = copyOfFields[indexOfTarget].formId;

    if (!isHtmlFormField(source.data.elementType))
      throw new Error('not a HTML form tag');

    const newField = await addFormField({
      id: 'temp-preview-id',
      formId: targetFormId,
      type: source.data.elementType,
      orderIndex: -1,
      ...generateFormFieldData(source.data.elementType),
    });

    indexOfSource = copyOfFields.length;

    copyOfFields = [...copyOfFields, newField];
  } else {
    // reordering existing items
    console.log('reordering');
    indexOfSource = fields.findIndex(task => task.id === sourceData.fieldId);

    if (indexOfSource < 0) {
      return;
    }

    const element = document.querySelector(
      `[data-task-id="${sourceData.fieldId}"]`
    );

    if (element instanceof HTMLElement) {
      triggerPostMoveFlash(element);
    }
  }

  const fMe = reorderWithEdge({
    closestEdgeOfTarget,
    axis: 'vertical',
    list: copyOfFields,
    startIndex: indexOfSource,
    indexOfTarget,
  });

  newFields = fMe.map((e, i) => {
    e.orderIndex = i + 1;
    return e;
  });

  pageState = 'loading';
  await saveSorted({
    sortedList: newFields,
    surveyId: copyOfFields[0].formId,
  });
  fields = newFields;
  pageState = 'idle';
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
        <FormField {index} selected={selectedFormField?.id === field.id} onclick={()=>{ if (selectedFormField?.id !== field.id) selectedFormField = field; console.log('form-field:', index)}} {field} saveSorted={async (removedId) => { await saveSorted({sortedList: fields, removedId, surveyId: fields[0].formId}) }}/>
    {/each}
</div>
