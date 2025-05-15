<script lang="ts">
import { formElementTags, formElements } from '$lib';
import FormField from '$lib/dnd/FormField.svelte';
import Portal from '$lib/dnd/Portal.svelte';
import { getFieldData } from '$lib/dnd/utils';
import type { HtmlFormElements } from '$lib/types';
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { preserveOffsetOnSource } from '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';

type Props = {
  label: HtmlFormElements;
};

let { label }: Props = $props();
let element: HTMLLIElement | undefined;
let state: 'idle' | 'is-dragging' | 'preview' | 'is-dragging-over' =
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
  if (!element) return;
  draggable({
    element,
    onGenerateDragPreview: ({ nativeSetDragImage, location, source }) => {
      if (!element) return;
      previewData.type = source.data.elementType;
      previewData.placeholder =
        formElementTags[source.data.elementType as HtmlFormElements];
      previewData.label =
        formElementTags[source.data.elementType as HtmlFormElements];

      if (
        source.data.elementType === 'radio' ||
        source.data.elementType === 'select'
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
          element,
          input: location.current.input,
        }),
        render(test) {
          console.log(test);
          state = 'preview';
          container = test.container;
        },
      });
    },
    getInitialData: () => ({
      elementType: label,
      ...getFieldData(previewData),
    }),
    onDragStart: () => {
      state = 'is-dragging';
    },
    onDrop: () => {
      state = 'idle';
    },
  });
});
</script>

<li bind:this={element}
    class={['border', {'border-white border-dashed opacity-75 bg-slate-200/40': state !== 'idle', 'border-transparent border-solid': state === 'idle'}]}>{label}</li>
{#if state === 'preview'}
    <Portal target={container}>
        <FormField field={previewData}></FormField>
    </Portal>
{/if}
<style>
    li {
        padding: 0.5rem;
        margin: 0 1rem;
        text-align: center;

        &:hover {
            border-color: white;
            cursor: pointer;
        }
    }
</style>