<script lang="ts">
import { isToolboxListFieldData } from '$lib/dnd';
import { getSurveyEditor } from '$stores/survey-editor.svelte';
import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { reorderWithEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/reorder-with-edge';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import ToolboxFormFieldListItem from './ToolboxFormFieldListItem.svelte';

// Get editor from context
const editor = getSurveyEditor();

// Reactive references
const fields = $derived(editor.fields);

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

      const indexOfSource = fields.findIndex(
        item => item.id === sourceData.fieldId
      );
      const indexOfTarget = fields.findIndex(
        item => item.id === targetData.fieldId
      );

      if (indexOfSource < 0 || indexOfTarget < 0) return;

      const reorderedFields = reorderWithEdge({
        closestEdgeOfTarget,
        axis: 'vertical',
        list: fields,
        startIndex: indexOfSource,
        indexOfTarget,
      }).map((field, i) => ({ ...field, orderIndex: i + 1 }));

      // Update via editor
      await editor.saveReorder(reorderedFields);
      // await editor.reorderFieldsOnServer(reorderedFields);
    },
  });
});
</script>

<ul class="space-y-2 pt-5">
    {#each fields as formField, index}
        <ToolboxFormFieldListItem {formField} {index} />
    {/each}
</ul>