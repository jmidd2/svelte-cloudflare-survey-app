<script lang="ts">
import { Button } from '$lib/components/ui/button';
import { Input } from '$lib/components/ui/input';
import { Label } from '$lib/components/ui/label';
import DragHandle from '$lib/dnd/DragHandle.svelte';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { MinusCircle } from '@lucide/svelte';

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
    <div class="">
        <DragHandle size={15}></DragHandle>
    </div>
    <div class="">
        <Input class="w-full" id="option" name={`option-${index}`} type="text"
               value={opt.label}/>
    </div>
    <Button variant="destructive" type="button" class="hover:cursor-pointer group ml-auto mr-3"><span
            class="sr-only">Delete Option</span>
        <MinusCircle/>
    </Button>
</li>