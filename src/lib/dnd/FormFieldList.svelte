<script lang="ts">
import { deserialize } from '$app/forms';
import { formElements, isFormFieldData, sampleFormFieldLabels } from '$lib';
import FormField from '$lib/dnd/FormField.svelte';
import type {
  InsertFormField,
  SelectFormField,
} from '$lib/server/db/schema.js';
import type { HtmlFormElements } from '$lib/types';
import { triggerPostMoveFlash } from '@atlaskit/pragmatic-drag-and-drop-flourish/trigger-post-move-flash';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
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

  // if (response.ok) {
  //     const result = deserialize(await response.text());
  //     console.log(result);
  //     if (result.status === 200) {
  //         if (
  //             result.type === 'success' &&
  //             result.data &&
  //             isFormFieldData(result.data)
  //         ) {
  //             formFields.push(result.data);
  //         }
  //     }
  // }
}

type Props = {
  fields: SelectFormField[];
  saveSorted: () => void;
};
let { fields = $bindable(), saveSorted }: Props = $props();

$effect(() => {
  return monitorForElements({
    canMonitor({ source }) {
      return isFieldData(source.data);
    },
    async onDrop({ location, source }) {
      const target = location.current.dropTargets[0];
      if (!target) {
        return;
      }

      const sourceData = source.data;
      const targetData = target.data;

      if (!(isFieldData(sourceData) || isFieldData(targetData))) {
        return;
      }
      console.log(location, target, source);

      let indexOfSource = -1;
      let indexOfTarget = -1;
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

      if (source.data.fieldId === 'preview') {
        console.log('preview');
        indexOfTarget = fields.findIndex(
          task => task.id === targetData.fieldId
        );

        if (indexOfTarget < 0) {
          return;
        }

        const copy = $state.snapshot(fields);

        const targetOrderIndex = fields[indexOfTarget].orderIndex;
        const targetFormId = fields[indexOfTarget].formId;

        const closestEdgeOfTarget = extractClosestEdge(targetData);

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

        const list = [...copy, temp];
        console.log(list);

        fields = reorderWithEdge({
          list,
          startIndex: fields.length,
          indexOfTarget,
          closestEdgeOfTarget,
          axis: 'vertical',
        });
        await addFormField(temp);
      } else {
        indexOfSource = fields.findIndex(
          task => task.id === sourceData.fieldId
        );
        indexOfTarget = fields.findIndex(
          task => task.id === targetData.fieldId
        );

        if (indexOfTarget < 0 || indexOfSource < 0) {
          return;
        }

        const closestEdgeOfTarget = extractClosestEdge(targetData);

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
    },
  });
});
</script>

<div class="grid grid-cols-1 gap-y-4 p-2">
    {#each fields as field}
        <FormField {field}/>
    {/each}
</div>
