<script lang="ts">
import { applyAction, enhance } from '$app/forms';
import { goto, invalidate } from '$app/navigation';
import EditFieldOptionList from '$lib/components/EditFieldOptionList.svelte';
import { getFieldData, isFieldData } from '$lib/dnd';
import type { SelectFormField } from '$lib/server/db/schema';
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
import DragHandle from '../dnd/DragHandle.svelte';
import DropIndicator from '../dnd/DropIndicator.svelte';
import Portal from '../dnd/Portal.svelte';
import DragPreview from './DragPreview.svelte';
import Status from './Status.svelte';

interface FieldState {
  type: 'idle' | 'preview' | 'is-dragging' | 'is-dragging-over';
  container?: HTMLElement;
  closestEdge?: Edge | null;
}

type Props = {
  field: SelectFormField;
  saveSorted: (removeId: string) => Promise<void>;
};
let { field, saveSorted }: Props = $props();

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
      onDrag({ self, location }) {
        const closestEdge = extractClosestEdge(self.data);
        console.log('location');
        console.table(location);

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

function hasOptions(element: SelectFormField) {
  return (
    canHaveOptions(element) && !!element.options && element.options.length > 0
  );
}

function canHaveOptions(element: SelectFormField) {
  return (
    element.type === 'select' ||
    element.type === 'checkbox' ||
    element.type === 'radio'
  );
}
</script>

<div class="relative bg-white rounded-xl flex flex-col justify-between text-black hover:cursor-grab"
     class:opacity-40={state.type === 'is-dragging'}
     data-field-id={field.id}
     bind:this={element}>
    <div
            class="flex text-lg flex-row items-center py-2 px-4 pl-0 hover:bg-slate-100 rounded-t-xl"
    >
        <DragHandle/>
        <span class="truncate flex-grow flex-shrink ml-3">{field.label}</span>
        <!--        <span class="text-sm">{field.orderIndex}</span>-->
        <Status status={field.type}/>
    </div>
    <div class="p-4 flex flex-col">
        <form>
            <input type="hidden" value={field.id}/>
            <div class="flex flex-col my-4">
                <label for="label">Label</label>
                <input type="text" id="label" name="label" value={field.label}>
            </div>
            <div class="flex flex-col my-4">
                <label for="placeholder">Placeholder</label>
                <input type="text" id="placeholder" name="placeholder" value={field.placeholder}>
            </div>
            <div class="flex items-center gap-3 my-4">
                <label for="required">Field Required?</label>
                <input type="checkbox" id="required" name="required" checked={field.required}>
            </div>
            {#if canHaveOptions(field)}
                <div class="flex flex-col my-4 border border-spark-secondary-500 rounded-2xl">
                    <h3 class="ml-4 text-lg font-bold mt-2 mb-1">Options</h3>
                    {#if !!field.options && field.options.length > 0}
                        <EditFieldOptionList options={field.options}></EditFieldOptionList>
                    {/if}
                    <button type="button" class="my-3 ml-4 mr-auto hover:cursor-pointer">Add Option</button>
                </div>
            {/if}
        </form>
    </div>
    <div class="py-2 px-4 text-right border-t border-t-slate-200 rounded-b-xl bg-slate-50 align-middle flex justify-end items-center">
        Save
        <form class="inline" method="post" action="?/deleteFormField" use:enhance={({ formElement, formData, action, cancel })=>{
            return async ({result}) => {
                if (result.type === 'redirect') {
                    goto(result.location);
                } else {
                    await applyAction(result);
                    console.log('action result', result)
                    if (result.type === 'success' && result.data && typeof result.data.id === "string") {
                        await saveSorted(result.data.id)
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