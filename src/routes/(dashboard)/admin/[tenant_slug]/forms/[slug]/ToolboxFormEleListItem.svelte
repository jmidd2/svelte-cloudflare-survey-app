<script lang="ts">
import { formElementTags } from '$lib';
import DragPreview from '$lib/components/DragPreview.svelte';
import { Badge } from '$lib/components/ui/badge/index.js';
import { getToolboxListFieldData, isToolboxListFieldData } from '$lib/dnd';
import DropIndicator from '$lib/dnd/DropIndicator.svelte';
import Portal from '$lib/dnd/Portal.svelte';
import type { SelectFormField } from '$lib/server/db/schema';
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

let { selectedFormField = $bindable(), formField } = $props();

const idleState: FieldState = $state({ type: 'idle' });
const isDraggingState: FieldState = $state({ type: 'is-dragging' });
const isOverState: FieldState = $state({ type: 'is-dragging-over' });
const previewState: FieldState = $state({ type: 'preview' });

let dragState: FieldState = $state(idleState);

let draggableElement: HTMLLIElement | null = $state(null);

$effect(() => {
  if (!draggableElement) return;

  return combine(
    draggable({
      element: draggableElement,
      getInitialData() {
        return getToolboxListFieldData(formField);
      },
      onDragStart() {
        dragState = isDraggingState;
      },
      onDrop() {
        dragState = idleState;
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
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
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
          closestEdge: extractClosestEdge(self.data),
          ...isOverState,
        };
      },
      onDrag({ self }) {
        const closestEdge = extractClosestEdge(self.data);
        if (
          dragState.type !== 'is-dragging-over' ||
          dragState.closestEdge !== closestEdge
        )
          dragState = { closestEdge, ...isOverState };
      },
      onDragLeave() {
        dragState = idleState;
      },
      onDrop() {
        dragState = idleState;
      },
    })
  );
});
</script>

<li bind:this={draggableElement} onclick={() => { selectedFormField = formField }}
    class={["relative cursor-grab overflow-visible line-clamp-1 flex border rounded-lg p-1 text-xs items-center", {'border-spark-primary':selectedFormField?.id === formField.id || dragState.type === 'is-dragging'}]}>
  <GripVertical class="size-3"></GripVertical>
  <p class="truncate text-ellipsis flex-1 ml-1 mr-2">{formField.label}</p>
  <Badge class="text-[10px]" variant="secondary">{formElementTags[formField.type]}</Badge>
  {#if dragState.type === 'is-dragging-over' && dragState.closestEdge}
    <DropIndicator edge={dragState.closestEdge} gap={'10px'}/>
  {/if}
<!--  <DropIndicator edge={'bottom'} gap={'10px'}/>-->
</li>