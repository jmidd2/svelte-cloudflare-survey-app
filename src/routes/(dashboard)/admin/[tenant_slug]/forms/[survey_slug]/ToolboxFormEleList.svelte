<script lang="ts">
import { isToolboxListFieldData, saveSorted } from '$lib/dnd';
import type { SelectFormField } from '$lib/server/db/schema';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import ToolboxFormEleListItem from './ToolboxFormEleListItem.svelte';

type Props = {
  formFields: SelectFormField[];
  selectedFieldIndex: number;
  selectedFormField: SelectFormField | null;
};

let {
  formFields = $bindable(),
  selectedFieldIndex = $bindable(),
  selectedFormField,
}: Props = $props();

let dragState: 'idle' | 'is-dragged-over' = $state('idle');

$effect(() => {
  return monitorForElements({
    canMonitor({ source }) {
      return isToolboxListFieldData(source.data);
    },
    async onDrop({ source, location }) {
      const target = location.current.dropTargets[0];
      if (!target) return;

      const sourceData = source.data;
      const targetData = target.data;

      if (
        !(
          isToolboxListFieldData(sourceData) ||
          isToolboxListFieldData(targetData)
        )
      )
        return;

      const closestEdgeOfTarget = extractClosestEdge(targetData);

      const indexOfSource = formFields.findIndex(
        item => item.id === sourceData.fieldId
      );
      let indexOfTarget = formFields.findIndex(
        item => item.id === targetData.fieldId
      );

      if (indexOfSource < 0 || indexOfTarget < 0) return;

      const reorderFormFields = reorderWithEdge({
        closestEdgeOfTarget,
        axis: 'vertical',
        list: formFields,
        startIndex: indexOfSource,
        indexOfTarget,
      });

      console.log('dropped', reorderFormFields);
      await saveSorted({
        sortedList: reorderFormFields,
        surveyId: formFields[0].formId,
      });
      formFields = reorderFormFields;
      if (selectedFieldIndex > -1)
        selectedFieldIndex = formFields.findIndex(
          item => item.id === sourceData.fieldId
        );
    },
  });
});
</script>

<ul class={["space-y-2 pt-5", {'bg-red-500': dragState === 'is-dragged-over'}]}>
  {#each formFields as formField, index}
    <ToolboxFormEleListItem {selectedFormField} bind:selectedFieldIndex {index} {formField} />
  {/each}
</ul>