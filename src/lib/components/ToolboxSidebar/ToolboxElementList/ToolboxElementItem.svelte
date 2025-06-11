<script lang="ts">
import { FormFieldItem } from '$lib/components/FormFieldList';
import {
  Portal,
  createActions,
  getNewFieldData,
  isNewFieldData,
} from '$lib/dnd';
import { FieldStateManager } from '$lib/dnd/field-state-manager.svelte';
import type { SelectFormField } from '$lib/server/db/schema';
import type { FormFieldType } from '$lib/types';
import { FIELD_LABELS } from '$lib/utils';
import type { Icon as IconType } from '@lucide/svelte';
import type { Attachment } from 'svelte/attachments';

type Props = {
  element: FormFieldType;
  label: string;
  icon: typeof IconType;
};

let { label, element: elementType, icon: Icon }: Props = $props();
const fieldStateManager = new FieldStateManager();

const previewData: SelectFormField = $state({
  id: 'preview',
  createdAt: new Date(Date.now()),
  updatedAt: new Date(Date.now()),
  formId: 'preview-form-id',
  type: elementType,
  label: 'This is a label',
  required: false,
  placeholder: 'placeholder',
  options: null,
  orderIndex: 0,
});

const { createDraggable } = createActions({
  onGenerateDragPreview: ({ container, source }) => {
    if (!source) return;
    if (!isNewFieldData(source.data)) return;
    previewData.type = source.data.type;
    previewData.placeholder = FIELD_LABELS[source.data.type];
    previewData.label = FIELD_LABELS[source.data.type];

    if (
      source.data.type === 'radio' ||
      source.data.type === 'select' ||
      source.data.type === 'checkbox'
    ) {
      previewData.options = [
        { id: crypto.randomUUID(), label: 'Option 1', val: 'val-1' },
        { id: crypto.randomUUID(), label: 'Option 2', val: 'val-2' },
        { id: crypto.randomUUID(), label: 'Option 3', val: 'val-3' },
      ];
    }
    fieldStateManager.generatePreview(container);
  },
  onDragStart: () => {
    fieldStateManager.startDrag();
  },
  onDrop: () => {
    if (fieldStateManager.isIdle) return;
    fieldStateManager.drop();
  },
  getData: () => getNewFieldData(previewData),
  canDrop: () => false,
  previewPosition: 'center',
});

function attachDraggable(): Attachment {
  return element => createDraggable(element);
}
</script>
<li
    {@attach attachDraggable()}
    class={['border flex items-center p-2 rounded-md cursor-grab hover:bg-accent', {'bg-background': !fieldStateManager.isIdle, 'border-transparent border-solid': fieldStateManager.isIdle}]}>
    <Icon class="size-5 mr-2" />
    <span>{label}</span></li>
{#if fieldStateManager.isPreview}
    <Portal target={fieldStateManager.container}>
        <FormFieldItem index={-1} field={previewData}></FormFieldItem>
    </Portal>
{/if}
<style>

</style>