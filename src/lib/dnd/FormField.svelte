<script lang="ts">
import type { SelectFormField } from '$lib/server/db/schema';
import type { HtmlFormElements } from '$lib/types';
import {
  attachClosestEdge,
  extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import type { Edge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/types';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import {
  draggable,
  dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import DragHandle from './DragHandle.svelte';
import DragPreview from './DragPreview.svelte';
import DropIndicator from './DropIndicator.svelte';
import Portal from './Portal.svelte';
import Status from './Status.svelte';
import { getFieldData, isFieldData } from './utils';

interface FieldState {
  type: 'idle' | 'preview' | 'is-dragging' | 'is-dragging-over';
  container?: HTMLElement;
  closestEdge?: Edge | null;
}

type Props = {
  field: SelectFormField;
};
let { field }: Props = $props();

let element: HTMLDivElement | undefined;
const idle: FieldState = { type: 'idle' };
let state = $state(idle);

$effect(() => {
  if (element === undefined) return;
  return combine(
    draggable({
      element,
      getInitialData() {
        // return getTaskData(task)
        return getFieldData(field);
      },
      onGenerateDragPreview({ nativeSetDragImage }) {
        setCustomNativeDragPreview({
          nativeSetDragImage,
          getOffset: pointerOutsideOfPreview({
            x: '16px',
            y: '8px',
          }),
          render({ container }) {
            state = { type: 'preview', container };
          },
        });
      },
      onDragStart() {
        state = { type: 'is-dragging' };
      },
      onDrop() {
        state = idle;
      },
    }),

    dropTargetForElements({
      element,
      canDrop({ source }) {
        // not allowing dropping on yourself
        if (source.element === element) {
          return false;
        }
        // only allowing tasks to be dropped on me
        return isFieldData(source.data);
        // return source.element.hasAttribute('data-task-id')
      },
      getData({ input }) {
        const data = getFieldData(field);
        return attachClosestEdge(data, {
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          element: element!,
          input,
          allowedEdges: ['top', 'bottom'],
        });
      },
      getIsSticky() {
        return true;
      },
      onDragEnter({ self }) {
        const closestEdge = extractClosestEdge(self.data);
        state = { type: 'is-dragging-over', closestEdge };
      },
      onDrag({ self }) {
        const closestEdge = extractClosestEdge(self.data);

        // Only need to update state if nothing has changed.
        // Prevents re-rendering.
        if (
          state.type !== 'is-dragging-over' ||
          state.closestEdge !== closestEdge
        ) {
          state = { type: 'is-dragging-over', closestEdge };
        }
      },
      onDragLeave() {
        state = idle;
      },
      onDrop() {
        state = idle;
      },
    })
  );
});

function isHtmlInput(type: HtmlFormElements) {
  return type !== 'textarea' && type !== 'select';
}
</script>

<div class="relative">
    <div class="bg-white rounded">
        <div
                data-field-id={field.id}
                bind:this={element}
                class:opacity-40={state.type === 'is-dragging'}
                class={`flex text-sm
                flex-row items-center
                border border-solid border-spark-secondary  p-2 pl-0
                hover:bg-slate-100 hover:cursor-grab`}
        >
            <DragHandle/>
            <span class="truncate flex-grow flex-shrink">{field.label}</span>
            <Status status={field.type}/>
        </div>
        <div class="p-2 flex-col" class:flex={field.type !== 'checkbox' && field.type !== 'radio'}>
            <label for={field.label.toLowerCase().replaceAll(' ', '-')}>{field.label}</label>
            {#if isHtmlInput(field.type)}
                {#if field.type === 'radio'}
                    {#if field.options}
                        {#each field.options as {val, label}, index}
                            <label for={`${field.label.toLowerCase().replaceAll(' ', '-')}-${index}`}>{label}</label>
                            <input type="radio" id={`${field.label.toLowerCase().replaceAll(' ', '-')}-${index}`} name={field.label.toLowerCase().replaceAll(' ', '-')} value={val}>
                            {/each}
                        {/if}
                    {:else}
                <input id={field.label.toLowerCase().replaceAll(' ', '-')} type={field.type} placeholder={field.placeholder} />
                    {/if}
            {:else if field.type === 'textarea'}
                <textarea id={field.label.toLowerCase().replaceAll(' ', '-')}></textarea>
            {:else if field.type === 'select'}
                <select id={field.label.toLowerCase().replaceAll(' ', '-')}>
                    {#if field.options}
                        {#each field.options as item}
                            <option value={item.val}>{item.label}</option>
                        {/each}
                    {/if}
                </select>
            {/if}
        </div>
    </div>
    {#if state.type === 'is-dragging-over' && state.closestEdge}
        <DropIndicator edge={state.closestEdge} gap={'8px'}/>
    {/if}
</div>
{#if state.type === 'preview'}
    <Portal target={state.container}>
        <DragPreview {field}/>
    </Portal>
{/if}