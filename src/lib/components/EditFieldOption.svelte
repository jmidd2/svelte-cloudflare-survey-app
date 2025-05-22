<script lang="ts">
import DragHandle from '$lib/dnd/DragHandle.svelte';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

type Props = {
  option: { val: string; label: string };
  index: number;
};

const { option: opt, index }: Props = $props();

let element: HTMLLIElement;

$effect(() => {
  if (!element) return;

  return combine(
    draggable({
      element,
      getInitialData() {
        // return getTaskData(task)
        return { id: Symbol() };
      },
      onGenerateDragPreview({ nativeSetDragImage }) {
        // setCustomNativeDragPreview({
        //     nativeSetDragImage,
        //     getOffset: pointerOutsideOfPreview({
        //         x: '16px',
        //         y: '8px',
        //     }),
        //     render({ container }) {
        //         state = { type: 'preview', container };
        //     },
        // });
      },
      onDragStart() {},
      onDrop() {},
    }),

    dropTargetForElements({
      element,
      canDrop({ source }) {
        return true;
      },
      getData({ input }) {
        return input;
      },
      getIsSticky() {
        return true;
      },
      onDragEnter({ self }) {
        console.log('on drag enter');
      },
      onDrag({ self, location }) {
        console.log('location');
        console.table(location);
      },
      onDragLeave() {},
      onDrop() {},
    })
  );
});
</script>

<li bind:this={element} class="items-center grid grid-cols-[20px_1fr_40px] gap-2 align-middle">
    <div class="mt-5">
        <DragHandle size={15}></DragHandle>
    </div>
    <div>
        <label for="option">Label</label>
        <input class="w-full" id="option" name={`option-${index}`} type="text"
               value={opt.label}>
    </div>
    <button type="button" class="hover:cursor-pointer group ml-auto mr-3 mt-7"><span
            class="sr-only">Delete Option</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
             viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round"
             stroke-linejoin="round"
             class="block group-hover:hidden">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M19.875 6.27c.7 .398 1.13 1.143 1.125 1.948v7.284c0 .809 -.443 1.555 -1.158 1.948l-6.75 4.27a2.269 2.269 0 0 1 -2.184 0l-6.75 -4.27a2.225 2.225 0 0 1 -1.158 -1.948v-7.285c0 -.809 .443 -1.554 1.158 -1.947l6.75 -3.98a2.33 2.33 0 0 1 2.25 0l6.75 3.98h-.033z"/>
            <path d="M9 12h6"/>
        </svg>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
             viewBox="0 0 24 24"
             fill="currentColor"
             class="hidden group-hover:block">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M13.666 1.429l6.75 3.98l.096 .063l.093 .078l.106 .074a3.22 3.22 0 0 1 1.284 2.39l.005 .204v7.284c0 1.175 -.643 2.256 -1.623 2.793l-6.804 4.302c-.98 .538 -2.166 .538 -3.2 -.032l-6.695 -4.237a3.23 3.23 0 0 1 -1.678 -2.826v-7.285c0 -1.106 .57 -2.128 1.476 -2.705l6.95 -4.098c1 -.552 2.214 -.552 3.24 .015m1.334 9.571h-6a1 1 0 0 0 0 2h6a1 1 0 0 0 0 -2"/>
        </svg>
    </button>
</li>