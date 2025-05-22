<script lang="ts">
import EditFieldOption from '$lib/components/EditFieldOption.svelte';
import DragHandle from '$lib/dnd/DragHandle.svelte';
import type { SelectFormField } from '$lib/server/db/schema';
import {
  dropTargetForElements,
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
type Props = {
  options: SelectFormField['options'];
};
const { options } = $props();

let element: HTMLUListElement;
function isOptionData(data: unknown) {
  return true;
}

$effect(() => {
  return monitorForElements({
    canMonitor({ source }) {
      return isOptionData(source.data);
    },
    onDrop: function ({ location, source }) {
      console.log('fieldoptions-dropped location');
      console.table(location);
      console.log('fieldoptions-dropped location');
      console.table(source);
    },
  });
});

$effect(() => {
  if (!element) return;

  dropTargetForElements({
    element,
    onDragEnter: () => {},
    onDragLeave: () => {},
    onDrop: () => {},
  });
});
</script>

<ul bind:this={element} class="flex flex-col gap-2">
    {#each options as opt, index}
        <EditFieldOption option={opt} {index}></EditFieldOption>
    {/each}
</ul>