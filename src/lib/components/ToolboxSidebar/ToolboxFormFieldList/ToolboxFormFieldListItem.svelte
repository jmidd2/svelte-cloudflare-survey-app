<script lang="ts">
import { Badge } from '$lib/components/ui/badge/index.js';
import { getToolboxListFieldData, isToolboxListFieldData } from '$lib/dnd';
import DropIndicator from '$lib/dnd/DropIndicator.svelte';
import { createActions } from '$lib/dnd/create-actions';
import {
  type FieldState,
  FieldStateManager,
} from '$lib/dnd/field-state-manager.svelte';
import type { SelectFormField } from '$lib/server/db/schema';
import { FIELD_LABELS } from '$lib/utils';
import { getSurveyEditor } from '$stores/survey-editor.svelte';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import { GripVertical } from '@lucide/svelte';
import type { Attachment } from 'svelte/attachments';

interface Props {
  formField: SelectFormField;
  index: number;
}

const { formField, index }: Props = $props();

// Get editor from context
const editor = getSurveyEditor();

// Reactive state
const selectedField = $derived(editor.selectedField);
const isSelected = $derived(selectedField?.id === formField.id);

const fieldStateManager = new FieldStateManager();
let fieldState = $state<FieldState>(fieldStateManager.currentState);

function handleClick() {
  if (fieldStateManager.isIdle) {
    editor.selectField(index);
  }
}

function attachDraggable(): Attachment {
  const { createDraggable, createDropTargetForElements } = createActions({
    getData() {
      return getToolboxListFieldData(formField);
    },
    onDragStart() {
      fieldStateManager.startDrag();
    },
    onDrop() {
      if (fieldStateManager.isIdle) return;
      fieldStateManager.drop();
    },
    canDrop(data) {
      return isToolboxListFieldData(data);
    },
    onDragEnter(edge) {
      fieldStateManager.updateEdge(edge);
    },
    onDrag(edge) {
      if (
        fieldState !== 'draggingOver' ||
        fieldStateManager.closestEdge !== edge
      ) {
        fieldStateManager.updateEdge(edge);
      }
    },
    onDragLeave() {
      fieldStateManager.cancel();
    },
  });

  return element =>
    combine(createDraggable(element), createDropTargetForElements(element));
}
</script>

<li {@attach attachDraggable()}>
    <div class={["relative cursor-grab overflow-visible line-clamp-1 flex border rounded-lg p-1 text-xs items-center", isSelected || fieldStateManager.isDragging ? 'border-spark-primary' : 'border-transparent' ]}
            onclick={handleClick}
            role="button"
            tabindex={index + 30}
            onkeydown={() => {}}
    >
        <GripVertical class="size-3" />
        <p class="truncate text-ellipsis flex-1 ml-1 mr-2">{formField.label}</p>
        <Badge class="text-[10px]" variant="secondary">
            {FIELD_LABELS[formField.type]}
        </Badge>

        {#if fieldStateManager.isDraggingOver && fieldStateManager.closestEdge}
            <DropIndicator edge={fieldStateManager.closestEdge} gap="10px" />
        {/if}
    </div>
</li>