<script lang="ts">
import FieldRender from '$lib/components/FieldRender.svelte';
import Status from '$lib/components/Status.svelte';
import { Button } from '$lib/components/ui/button';
import {
  DragHandle,
  DragPreview,
  DropIndicator,
  type FieldState,
  FieldStateManager,
  Portal,
  createActions,
  getFieldData,
  isFieldData,
  isNewFieldData,
} from '$lib/dnd';
import type { SelectFormField } from '$lib/server/db/schema';
import { genSlug } from '$lib/utils';
import { getSurveyEditor } from '$stores/survey-editor.svelte';
import { Trash2Icon } from '@lucide/svelte';
import type { Attachment } from 'svelte/attachments';

interface Props {
  field: SelectFormField;
  index: number;
}

const { field, index }: Props = $props();

// Get editor from context
const editor = getSurveyEditor();
const fieldStateManager = new FieldStateManager();

let fieldState = $derived<FieldState>(fieldStateManager.currentState);
const selected = $derived(editor.selectedIndex === index);

const elementId = genSlug(field);

// Handle click
function handleClick() {
  editor.selectField(index);
}

// Handle delete
async function handleDelete() {
  await editor.deleteField(field.id);
}

const { createDraggable, createDropTargetForElements } = createActions({
  onGenerateDragPreview({ container }) {
    fieldStateManager.generatePreview(container);
  },
  onDragStart() {
    fieldStateManager.startDrag();
  },
  canDrop(data) {
    return isNewFieldData(data) || isFieldData(data);
  },
  getData() {
    return getFieldData(field);
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
  onDrop() {
    if (fieldState === 'idle') return;
    fieldStateManager.drop();
  },
});

function attachDraggable(): Attachment {
  return element => createDropTargetForElements(element);
}

function attachDragHandle(): Attachment {
  return element => createDraggable(element);
}
</script>

<div
        class={["relative rounded-xl flex flex-col justify-between border-3", selected && 'border-spark-primary', !selected && 'border-transparent']}
        onclick={handleClick}
        role="button"
        {@attach attachDraggable()}
        onkeydown={() => {}}
        tabindex={index + 2}
        class:opacity-40={fieldStateManager.isDragging}
        data-field-id={field.id}
>
    <div
            {@attach attachDragHandle()}
            class="flex text-lg border flex-row items-center py-2 px-4 pl-0 bg-muted/40 hover:bg-muted cursor-grab rounded-t-xl"
    >
        <DragHandle />
        <span class="truncate flex-grow flex-shrink ml-3">{field.label}</span>
        <Status status={field.type} />
    </div>

    <div class="p-4 flex flex-col border-x">
      <FieldRender {field} disabled />
    </div>

    <div class="py-2 gap-x-2 px-4 text-right border border-t-transparent rounded-b-xl align-middle flex justify-end items-center">
        <Button
                type="button"
                variant="destructive"
                onclick={handleDelete}
                disabled={editor.isLoading}
        >
            <span class="sr-only">Delete</span>
            <Trash2Icon />
        </Button>
    </div>

    {#if fieldStateManager.isDraggingOver && fieldStateManager.closestEdge}
        <DropIndicator edge={fieldStateManager.closestEdge} gap="22px" />
    {/if}
</div>

{#if fieldStateManager.isPreview}
    <Portal target={fieldStateManager.container}>
      <DragPreview {field} />
    </Portal>
{/if}