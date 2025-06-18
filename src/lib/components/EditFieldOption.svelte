<script lang="ts">
import { Button } from '$lib/components/ui/button';
import { Input } from '$lib/components/ui/input';
import {
  createActions,
  DropIndicator,
  FieldStateManager,
  getSelectedItemOptData,
  isSelectedItemOptData,
  Portal,
} from '$lib/dnd';
import DragHandle from '$lib/dnd/DragHandle.svelte';
import { MinusCircle } from '@lucide/svelte';
import type { Attachment } from 'svelte/attachments';

type Props = {
  option: { id: string; val: string; label: string };
  index: number;
  handleDelete: (index: number) => void;
  isValid: boolean;
};

let {
  option: opt,
  index,
  handleDelete,
  isValid: globalIsValid,
}: Props = $props();

const dragStateManager = new FieldStateManager();
let dragState = $state(dragStateManager.currentState);

const { createDraggable, createDropTargetForElements } = createActions({
  canDrop: data => isSelectedItemOptData(data),
  getData: () => getSelectedItemOptData(opt),
  onDragEnter: edge => {
    dragStateManager.updateEdge(edge);
  },
  onDrag: edge => {
    if (dragState !== 'draggingOver' || dragStateManager.closestEdge !== edge) {
      dragStateManager.updateEdge(edge);
    }
  },
  onDragLeave: () => {
    dragStateManager.cancel();
  },
  onDrop: () => {
    if (dragStateManager.isIdle) return;
    dragStateManager.drop();
  },
  onDragStart: () => {
    dragStateManager.startDrag();
  },
  onGenerateDragPreview: ({ container }) => {
    dragStateManager.generatePreview(container);
  },
  previewPosition: 'start',
});

function attachDraggable(): Attachment {
  return element => createDraggable(element);
}
function attachDropTarget(): Attachment {
  return element => createDropTargetForElements(element);
}

let isValid = $derived(globalIsValid);
function handleInput(
  e: Event & {
    currentTarget: EventTarget & HTMLInputElement;
  }
) {
  const newVal = encodeURIComponent(
    e.currentTarget.value.trim().replaceAll(' ', '-').toLocaleLowerCase()
  );

  // if (!validateOptions(newVal, opt.id)) {
  //   isValid = false;
  //   return;
  // }
  //
  // isValid = true;
  opt.val = newVal;
}
</script>

<li {@attach attachDropTarget()} class="relative items-center grid grid-cols-[20px_1fr_40px] gap-x-2 align-middle">
  {#if import.meta.env.DEV}
    <span class="text-xs text-muted-foreground col-span-2 col-start-2 mb-1.5">{decodeURIComponent(opt.val)}</span>
  {/if}
  <div class="hover:cursor-grab" {@attach attachDraggable()}>
        <DragHandle size={15}></DragHandle>
    </div>
    <div class="">
        <Input aria-invalid={!isValid} class="w-full" id="options" name="options" type="text"
               oninput={handleInput}
               bind:value={opt.label}/>
    </div>
    <Button variant="outline-destructive" size="icon" type="button" class="hover:cursor-pointer group ml-auto mr-3" onclick={() => { handleDelete(index); }}><span
            class="sr-only">Delete Option</span>
        <MinusCircle/>
    </Button>
  {#if dragStateManager.isDraggingOver && dragStateManager.closestEdge}
    <DropIndicator class="col-span-3" edge={dragStateManager.closestEdge} gap="12px" />
  {/if}
</li>

{#if dragStateManager.isPreview}
  <Portal target={dragStateManager.container}>
    <div class="w-64 items-center grid grid-cols-[20px_1fr_40px] gap-2 align-middle">
      <div class="">
        <DragHandle size={15}></DragHandle>
      </div>
      <div class="">
        <Input class="w-full" id="options" name="options" type="text"
               value={opt.label}/>
      </div>
      <Button variant="outline-destructive" size="icon" type="button" class="hover:cursor-pointer group ml-auto mr-3" onclick={() => { handleDelete(index); }}><span
          class="sr-only">Delete Option</span>
        <MinusCircle/>
      </Button>
    </div>
  </Portal>
  {/if}