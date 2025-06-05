<script lang="ts">
import { formElementTags } from '$lib';
import { Badge } from '$lib/components/ui/badge/index.js';
import { getToolboxListFieldData, isToolboxListFieldData } from '$lib/dnd';
import DropIndicator from '$lib/dnd/DropIndicator.svelte';
import type { SelectFormField } from '$lib/server/db/schema';
import { getSurveyEditor } from '$stores/survey-editor.svelte';
import {
  attachClosestEdge,
  extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/types';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { GripVertical } from '@lucide/svelte';

interface FieldState {
  type: 'idle' | 'preview' | 'is-dragging' | 'is-dragging-over';
  container?: HTMLElement;
  closestEdge?: Edge | null;
}

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

let dragState = $state<FieldState>({ type: 'idle' });
let draggableElement = $state<HTMLLIElement | null>(null);

function handleClick() {
  if (dragState.type === 'idle') {
    editor.selectField(index);
  }
}

$effect(() => {
  if (!draggableElement) return;

  return combine(
    draggable({
      element: draggableElement,
      getInitialData() {
        return getToolboxListFieldData(formField);
      },
      onDragStart() {
        dragState = { type: 'is-dragging' };
      },
      onDrop() {
        dragState = { type: 'idle' };
      },
    }),
    dropTargetForElements({
      element: draggableElement,
      canDrop({ source }) {
        if (source.element === draggableElement) return false;
        return isToolboxListFieldData(source.data);
      },
      getData({ input }) {
        const data = getToolboxListFieldData(formField);
        return attachClosestEdge(data, {
          element: draggableElement!,
          input,
          allowedEdges: ['top', 'bottom'],
        });
      },
      getIsSticky() {
        return true;
      },
      onDragEnter({ self }) {
        dragState = {
          type: 'is-dragging-over',
          closestEdge: extractClosestEdge(self.data),
        };
      },
      onDrag({ self }) {
        const closestEdge = extractClosestEdge(self.data);
        if (
          dragState.type !== 'is-dragging-over' ||
          dragState.closestEdge !== closestEdge
        ) {
          dragState = { type: 'is-dragging-over', closestEdge };
        }
      },
      onDragLeave() {
        dragState = { type: 'idle' };
      },
      onDrop() {
        dragState = { type: 'idle' };
      },
    })
  );
});
</script>

<li bind:this={draggableElement}>
    <div
            class={[
      "relative cursor-grab overflow-visible line-clamp-1 flex border rounded-lg p-1 text-xs items-center",
      isSelected || dragState.type === 'is-dragging' ? 'border-spark-primary' : 'border-transparent'
    ].join(' ')}
            onclick={handleClick}
            role="button"
            tabindex={index + 30}
            onkeydown={() => {}}
    >
        <GripVertical class="size-3" />
        <p class="truncate text-ellipsis flex-1 ml-1 mr-2">{formField.label}</p>
        <Badge class="text-[10px]" variant="secondary">
            {formElementTags[formField.type]}
        </Badge>

        {#if dragState.type === 'is-dragging-over' && dragState.closestEdge}
            <DropIndicator edge={dragState.closestEdge} gap="10px" />
        {/if}
    </div>
</li>