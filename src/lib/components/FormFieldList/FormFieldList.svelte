<script lang="ts">
import { type FieldData, isFieldData, isNewFieldData } from '$lib/dnd';
import type { SelectFormField } from '$lib/server/db/schema.js';
import { getSurveyEditor } from '$stores/survey-editor.svelte';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/types';
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import type {
  BaseEventPayload,
  ElementDragType,
} from '@atlaskit/pragmatic-drag-and-drop/types';
import FormFieldItem from './FormFieldItem.svelte';

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

  if (
    !(
      (isFieldData(sourceData) || isNewFieldData(sourceData)) &&
      isFieldData(targetData)
    )
  )
    return;

  const closestEdgeOfTarget = extractClosestEdge(targetData);
  const indexOfTarget = findFieldIndex(targetData.fieldId);

  if (indexOfTarget < 0) return;

  if (isNewFieldData(sourceData)) {
    await handleNewFieldDrop(sourceData, closestEdgeOfTarget, indexOfTarget);
  } else {
    await handleFieldReorder(sourceData, closestEdgeOfTarget, indexOfTarget);
  }
}

function findFieldIndex(fieldId: string): number {
  return fields.findIndex(field => field.id === fieldId);
}

async function handleNewFieldDrop(
  sourceData: SelectFormField,
  closestEdgeOfTarget: Edge | null,
  indexOfTarget: number
): Promise<void> {
  try {
    await editor.addField(sourceData.type, closestEdgeOfTarget, indexOfTarget);
  } catch (e) {
    console.error(e);
  }
}

async function handleFieldReorder(
  sourceData: FieldData,
  closestEdgeOfTarget: Edge | null,
  indexOfTarget: number
): Promise<void> {
  const indexOfSource = findFieldIndex(sourceData.fieldId);
  if (indexOfSource < 0) return;

  const reorderedFields = reorderWithEdge({
    closestEdgeOfTarget,
    axis: 'vertical',
    list: fields,
    startIndex: indexOfSource,
    indexOfTarget,
  }).map((field, i) => ({ ...field, orderIndex: i + 1 }));

  await editor.saveReorder(reorderedFields);
}

// Set up drag monitor
$effect(() => {
  return monitorForElements({
    canMonitor: ({ source }) =>
      isFieldData(source.data) || isNewFieldData(source.data),
    onDrop: handleDrop,
  });
});
</script>

<div class="grid grid-cols-1 gap-y-4 p-2">
    {#each fields as field, index (field.id)}
        <FormFieldItem
                {field}
                {index}
        />
    {/each}
</div>