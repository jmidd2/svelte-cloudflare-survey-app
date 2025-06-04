<script lang="ts">
import FormField from '$lib/components/FormField.svelte';
import { generateFormFieldData, isFieldData, saveSorted } from '$lib/dnd';
import { type SelectFormField } from '$lib/server/db/schema.js';
import { isHtmlFormField } from '$lib/utils';
import { pageState } from '$stores/pageState.svelte';
import { surveyManager } from '$stores/survey.svelte';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import type {
  BaseEventPayload,
  ElementDragType,
} from '@atlaskit/pragmatic-drag-and-drop/types';

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
  let indexOfTarget = surveyManager.fields.findIndex(
    task => task.id === targetData.fieldId
  );
  let newFieldId: string | undefined;

  if (indexOfTarget < 0) {
    return;
  }

  let copyOfFields = $state.snapshot(surveyManager.fields);
  let newFields: SelectFormField[];

  if (source.data.fieldId === 'preview') {
    console.log('adding new field');

    const targetFormId = copyOfFields[indexOfTarget].formId;

    if (!isHtmlFormField(source.data.elementType))
      throw new Error('not a HTML form tag');

    if (isHtmlFormField(source.data.elementType)) {
      const newField = await surveyManager.addFormField({
        id: 'temp-preview-id',
        formId: targetFormId,
        type: source.data.elementType,
        orderIndex: -1,
        ...generateFormFieldData(source.data.elementType),
      });

      newFieldId = newField.id;

      indexOfSource = copyOfFields.length;

      copyOfFields = [...copyOfFields, newField];
    }
  } else {
    // reordering existing items
    console.log('reordering');
    indexOfSource = surveyManager.fields.findIndex(
      task => task.id === sourceData.fieldId
    );

    if (indexOfSource < 0) {
      return;
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
    return { ...e, orderIndex: i + 1 };
  });

  pageState.state = 'loading';
  await saveSorted({
    sortedList: newFields,
    surveyId: copyOfFields[0].formId,
  });
  surveyManager.fields = newFields;
  if (newFieldId) {
    surveyManager.selectedIndex = surveyManager.fields.findIndex(
      item => item.id === newFieldId
    );
  } else if (surveyManager.selectedIndex > -1) {
    surveyManager.selectedIndex = surveyManager.fields.findIndex(
      item => item.id === sourceData.fieldId
    );
  }
  pageState.state = 'idle';
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
    {#each surveyManager.fields as field, index (field.id)}
        <FormField {index}
                   selected={surveyManager.selectedField?.id === field.id}
                   onclick={()=>{ surveyManager.selectedIndex = surveyManager.selectedField?.id === field.id ? -1 : index; }} {field} />
    {/each}
</div>
