<script lang="ts">
import { formElementTags, formElements } from '$lib';
import FormField from '$lib/components/FormField.svelte';
import Portal from '$lib/dnd/Portal.svelte';
import { getFieldData } from '$lib/dnd/utils';
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

let { label, element, icon: Icon }: Props = $props();
let dragElement: HTMLLIElement | undefined;
let elementState: 'idle' | 'is-dragging' | 'preview' | 'is-dragging-over' =
  $state('idle');

const previewData = $state({
  id: 'preview',
  createdAt: new Date(Date.now()),
  updatedAt: new Date(Date.now()),
  formId: 'preview-form-id',
  type: formElements[0],
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
      previewData.type = source.data.elementType;
      previewData.placeholder =
        formElementTags[source.data.elementType as HtmlFormElements];
      previewData.label =
        formElementTags[source.data.elementType as HtmlFormElements];

      if (
        source.data.elementType === 'radio' ||
        source.data.elementType === 'select' ||
        source.data.elementType === 'checkbox'
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
    getInitialData: () => ({
      elementType: label,
      ...getFieldData(previewData),
    }),
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
    class={['border flex items-center p-2 rounded-md cursor-move hover:bg-accent hover:text-black', {'bg-background': elementState !== 'idle', 'border-transparent border-solid': elementState === 'idle'}]}>
    <Icon class="h-4 w-4 mr-2" />
    <span>{label}</span></li>
{#if elementState === 'preview'}
    <Portal target={container}>
        <FormField field={previewData}></FormField>
    </Portal>
{/if}
<style>

</style>