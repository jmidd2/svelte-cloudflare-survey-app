<script lang="ts">
import { generateFormFieldData, isFieldData } from '$lib/dnd';
import type { SelectFormField } from '$lib/server/db/schema.js';
import { isHtmlFormField } from '$lib/utils';
import { getSurveyEditor } from '$stores/survey-editor.svelte';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import type {
  BaseEventPayload,
  ElementDragType,
} from '@atlaskit/pragmatic-drag-and-drop/types';
import { v4 as uuid } from 'uuid';
import FormField from './FormField.svelte';

// Get editor from context
const editor = getSurveyEditor();

// Reactive references to editor state
const fields = $derived(editor.fields);
const selectedIndex = $derived(editor.selectedIndex);
const surveyId = $derived(editor.survey?.id);

// Handle drag and drop
async function handleDrop({
  location,
  source,
}: BaseEventPayload<ElementDragType>) {
  const target = location.current.dropTargets[0];
  if (!(target && surveyId)) return;

  const sourceData = source.data;
  const targetData = target.data;

  if (!(isFieldData(sourceData) && isFieldData(targetData))) return;

  const closestEdgeOfTarget = extractClosestEdge(targetData);
  const indexOfTarget = fields.findIndex(
    task => task.id === targetData.fieldId
  );

  if (indexOfTarget < 0) return;

  let reorderedFields: SelectFormField[];

  // Adding new field from toolbox
  if (
    sourceData.fieldId === 'preview' &&
    isHtmlFormField(sourceData.elementType)
  ) {
    try {
      await editor.addField(
        sourceData.elementType,
        closestEdgeOfTarget,
        indexOfTarget
      );
    } catch (e) {
      console.error(e);
    }
    // const fieldData = generateFormFieldData(sourceData.elementType);
    //
    // const newFieldId = uuid();
    // // Add field via editor
    // const result = await editor.addField({
    //   type: sourceData.elementType,
    //   orderIndex: -1,
    //   ...fieldData,
    //   id: newFieldId,
    // });

    // add with at end with bad orderIndex

    // reorder

    // save

    // if (!result?.success) {
    //   console.error('Failed to add field:', result?.error);
    // }
  } else {
    // Reordering existing fields
    const indexOfSource = fields.findIndex(
      task => task.id === sourceData.fieldId
    );
    if (indexOfSource < 0) return;

    reorderedFields = reorderWithEdge({
      closestEdgeOfTarget,
      axis: 'vertical',
      list: fields,
      startIndex: indexOfSource,
      indexOfTarget,
    }).map((field, i) => ({ ...field, orderIndex: i + 1 }));

    // Update local state immediately
    await editor.saveReorder(reorderedFields);

    // Submit to server
    // await editor.reorderFieldsOnServer(reorderedFields);
  }
}

// Set up drag monitor
$effect(() => {
  return monitorForElements({
    canMonitor: ({ source }) => isFieldData(source.data),
    onDrop: handleDrop,
  });
});
</script>

<div class="grid grid-cols-1 gap-y-4 p-2">
    {#each fields as field, index (field.id)}
        <FormField
                {field}
                {index}
                selected={selectedIndex === index}
        />
    {/each}
</div>