<script lang="ts">
import { applyAction, deserialize, enhance } from '$app/forms';
import { goto, invalidate, invalidateAll } from '$app/navigation';
import { isHtmlFormField } from '$lib';
import type { SelectFormField } from '$lib/server/db/schema';
import type { SaveSortedFnArgs } from '$lib/types';
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
  saveSorted: (args?: SaveSortedFnArgs) => Promise<void>;
};
let { field = $bindable(), saveSorted }: Props = $props();

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
        console.log('on drag enter');
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
</script>

<div class="relative bg-white rounded-xl flex flex-col justify-between text-black"
     class:opacity-40={state.type === 'is-dragging'}>
    <div
            data-field-id={field.id}
            bind:this={element}
            class="flex text-sm flex-row items-center py-2 px-4 pl-0 hover:bg-slate-100 hover:cursor-grab rounded-t-xl"
    >
        <DragHandle/>
        <span class="truncate flex-grow flex-shrink">{field.label}</span>{field.orderIndex}
        <Status status={field.type}/>
    </div>
    <div class="p-2 flex flex-col">
        <label
                for={field.label.toLowerCase().replaceAll(' ', '-')}>{field.label}</label>
        {#if isHtmlFormField(field.type)}
            {#if (field.type === 'radio' || field.type === 'checkbox') && field.options}
                {#each field.options as {val, label}, index}
                    <div>
                        <input type={field.type} id={`${field.label.toLowerCase().replaceAll(' ', '-')}-${index}`}
                               name={field.label.toLowerCase().replaceAll(' ', '-')} value={val}>
                        <label for={`${field.label.toLowerCase().replaceAll(' ', '-')}-${index}`}>{label}</label>
                    </div>
                {/each}
                <!--{:else if field.type === 'checkbox'}-->
                <!--    <div>-->
                <!--        <input type="checkbox" id={`${field.label.toLowerCase().replaceAll(' ', '-')}`}-->
                <!--               name={field.label.toLowerCase().replaceAll(' ', '-')}>-->
                <!--        <label for={`${field.label.toLowerCase().replaceAll(' ', '-')}`}>{field.label}</label>-->
                <!--    </div>-->
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
            {:else}
                <input id={field.label.toLowerCase().replaceAll(' ', '-')} type={field.type}
                       placeholder={field.placeholder}/>
            {/if}
        {/if}
    </div>
    <div class="py-2 px-4 text-right border-t border-t-slate-200 rounded-b-xl bg-slate-50">
        <form class="inline" method="post" action="?/deleteFormField" use:enhance={({ formElement, formData, action, cancel })=>{
            return async ({result}) => {
                if (result.type === 'redirect') {
                    goto(result.location);
                } else {
                    await applyAction(result);
                    console.log('action result', result)
                    if (result.type === 'success' && result.data && typeof result.data.id === "string") {
                        await saveSorted({removedId: result.data.id})
                        await invalidate('survey-fields:latest')
                    }
                }
            }
        }}>
            <input type="hidden" name="fieldId" id="fieldId" value={field.id}>
            <button type="submit"
                    class="text-red-400 hover:text-red-600 rounded p-1 cursor-pointer group inline-flex items-center">
                <span class="sr-only">Delete</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="block group-hover:hidden" width="26" height="26"
                     viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                     stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M4 7h16"/>
                    <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"/>
                    <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"/>
                    <path d="M10 12l4 4m0 -4l-4 4"/>
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="currentColor"
                     class="hidden group-hover:block">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M20 6a1 1 0 0 1 .117 1.993l-.117 .007h-.081l-.919 11a3 3 0 0 1 -2.824 2.995l-.176 .005h-8c-1.598 0 -2.904 -1.249 -2.992 -2.75l-.005 -.167l-.923 -11.083h-.08a1 1 0 0 1 -.117 -1.993l.117 -.007h16zm-9.489 5.14a1 1 0 0 0 -1.218 1.567l1.292 1.293l-1.292 1.293l-.083 .094a1 1 0 0 0 1.497 1.32l1.293 -1.292l1.293 1.292l.094 .083a1 1 0 0 0 1.32 -1.497l-1.292 -1.293l1.292 -1.293l.083 -.094a1 1 0 0 0 -1.497 -1.32l-1.293 1.292l-1.293 -1.292l-.094 -.083z"/>
                    <path d="M14 2a2 2 0 0 1 2 2a1 1 0 0 1 -1.993 .117l-.007 -.117h-4l-.007 .117a1 1 0 0 1 -1.993 -.117a2 2 0 0 1 1.85 -1.995l.15 -.005h4z"/>
                </svg>
            </button>
        </form>
    </div>
    {#if state.type === 'is-dragging-over' && state.closestEdge}
        <DropIndicator edge={state.closestEdge} gap={'16px'}/>
    {/if}
</div>
{#if state.type === 'preview'}
    <Portal target={state.container}>
        <DragPreview {field}/>
    </Portal>
{/if}