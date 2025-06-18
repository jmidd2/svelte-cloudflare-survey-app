<script lang="ts">
import EditFieldOption from '$lib/components/EditFieldOption.svelte';
import { isSelectedItemOptData } from '$lib/dnd';
import type { SelectFormField } from '$lib/server/db/schema';
import {
  dropTargetForElements,
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';

type Props = {
  options: SelectFormField['options'];
  areAllValid: boolean;
};
let { options = $bindable(), areAllValid }: Props = $props();

let element: HTMLUListElement;

$effect(() => {
  return monitorForElements({
    canMonitor({ source }) {
      return isSelectedItemOptData(source.data);
    },
    onDrop: function ({ location, source }) {
      if (!options) return;
      const target = location.current.dropTargets[0];
      if (!target) return;

      const sourceData = source.data;
      const targetData = target.data;

      if (
        !(
          isSelectedItemOptData(sourceData) || isSelectedItemOptData(targetData)
        )
      )
        return;

      console.log(sourceData, targetData);

      const closestEdgeOfTarget = extractClosestEdge(targetData);

      const indexOfSource = options.findIndex(
        item => item.id === sourceData.id
      );
      const indexOfTarget = options.findIndex(
        item => item.id === targetData.id
      );

      if (indexOfSource < 0 || indexOfTarget < 0) return;

      options = reorderWithEdge({
        closestEdgeOfTarget,
        axis: 'vertical',
        list: options,
        startIndex: indexOfSource,
        indexOfTarget,
      });
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

function handleDelete(index: number) {
  options?.splice(index, 1);
}
</script>

{#if options && options.length > 0}
<ul bind:this={element} class="flex flex-col gap-y-3">
    {#each options as opt, index}
      {@const currentValues = options.filter(o=>o.id !== opt.id).map(o => o.val)}
        <EditFieldOption option={opt} {index} isValid={!currentValues.includes(opt.val)} {handleDelete}></EditFieldOption>
    {/each}
</ul>
{/if}
{#if !areAllValid}
  <p class="text-red-400">All options must be unique</p>
{/if}