<script lang="ts">
import type { FormFieldType } from '$lib/types';
import { ALL_FIELD_TYPES, FIELD_DATA } from '$lib/utils';
import { type Icon as IconType } from '@lucide/svelte';
import ToolboxElementItem from './ToolboxElementItem.svelte';

const draggableFormElements = new Map<
  FormFieldType,
  { label: string; icon: typeof IconType }
>();

for (const element of ALL_FIELD_TYPES) {
  draggableFormElements.set(element, FIELD_DATA[element]);
}
</script>
<ul class="space-y-2">
    {#each draggableFormElements as [element, {icon, label}]}
        <ToolboxElementItem {element} {label} {icon} />
    {/each}
</ul>