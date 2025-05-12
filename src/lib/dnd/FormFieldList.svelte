<script lang="ts">
import FormField from '$lib/dnd/FormField.svelte';
import type { SelectFormField } from '$lib/server/db/schema.js';
import { triggerPostMoveFlash } from '@atlaskit/pragmatic-drag-and-drop-flourish/trigger-post-move-flash';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { isFieldData } from './utils.js';

type Props = {
  fields: SelectFormField[];
  saveSorted: () => void;
};
let { fields = $bindable(), saveSorted }: Props = $props();

$effect(() => {
  return monitorForElements({
    canMonitor({ source }) {
      return isFieldData(source.data);
    },
    onDrop({ location, source }) {
      const target = location.current.dropTargets[0];
      if (!target) {
        return;
      }

      const sourceData = source.data;
      const targetData = target.data;

      if (!(isFieldData(sourceData) || isFieldData(targetData))) {
        return;
      }

      const indexOfSource = fields.findIndex(
        task => task.id === sourceData.fieldId
      );
      const indexOfTarget = fields.findIndex(
        task => task.id === targetData.fieldId
      );

      if (indexOfTarget < 0 || indexOfSource < 0) {
        return;
      }

      const closestEdgeOfTarget = extractClosestEdge(targetData);

      fields = reorderWithEdge({
        list: fields,
        startIndex: indexOfSource,
        indexOfTarget,
        closestEdgeOfTarget,
        axis: 'vertical',
      });
      const element = document.querySelector(
        `[data-task-id="${sourceData.fieldId}"]`
      );
      if (element instanceof HTMLElement) {
        triggerPostMoveFlash(element);
      }
      saveSorted();
    },
  });
});
</script>

<div class="pt-6 my-0 mx-auto w-[420px]">
    <div class="flex flex-col gap-2 p-2">
        {#each fields as field}
            <FormField {field} />
        {/each}
    </div>
</div>
