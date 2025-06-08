<script lang="ts">
import { formElementTags, formElements } from '$lib';
import FormField from '$lib/components/FormField.svelte';
import Portal from '$lib/dnd/Portal.svelte';
import { getNewFieldData, isNewFieldData } from '$lib/dnd/utils';
import type { SelectFormField } from '$lib/server/db/schema';
import type { HtmlFormElements } from '$lib/types';
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { preserveOffsetOnSource } from '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import type { Icon as IconType } from '@lucide/svelte';

type Props = {
  element: HtmlFormElements;
  label: string;
  icon: typeof IconType;
};

let { label, element: elementType, icon: Icon }: Props = $props();
let dragElement: HTMLLIElement | undefined;
let elementState: 'idle' | 'is-dragging' | 'preview' | 'is-dragging-over' =
  $state('idle');

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

let container: HTMLElement | undefined;

$effect(() => {
  if (!dragElement) return;
  draggable({
    element: dragElement,
    onGenerateDragPreview: ({ nativeSetDragImage, location, source }) => {
      if (!dragElement) return;
      if (!isNewFieldData(source.data)) return;
      previewData.type = source.data.type;
      previewData.placeholder = formElementTags[source.data.type];
      previewData.label = formElementTags[source.data.type];

      if (
        source.data.type === 'radio' ||
        source.data.type === 'select' ||
        source.data.type === 'checkbox'
      ) {
        previewData.options = [
          { label: 'Option 1', val: 'val-1' },
          { label: 'Option 2', val: 'val-2' },
          { label: 'Option 3', val: 'val-3' },
        ];
      }
      // console.log(args);
      setCustomNativeDragPreview({
        nativeSetDragImage,
        getOffset: preserveOffsetOnSource({
          element: dragElement,
          input: location.current.input,
        }),
        render(test) {
          console.log(test);
          elementState = 'preview';
          container = test.container;
        },
      });
    },
    getInitialData: () => getNewFieldData(previewData),
    onDragStart: () => {
      elementState = 'is-dragging';
    },
    onDrop: () => {
      elementState = 'idle';
    },
  });
});
</script>


<li bind:this={dragElement}
    class={['border flex items-center p-2 rounded-md cursor-grab hover:bg-accent', {'bg-background': elementState !== 'idle', 'border-transparent border-solid': elementState === 'idle'}]}>
    <Icon class="h-4 w-4 mr-2" />
    <span>{label}</span></li>
{#if elementState === 'preview'}
    <Portal target={container}>
        <FormField field={previewData}></FormField>
    </Portal>
{/if}
<style>

</style>