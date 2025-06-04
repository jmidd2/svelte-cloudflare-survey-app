<script lang="ts">
import { applyAction, enhance } from '$app/forms';
import { goto, invalidate } from '$app/navigation';
import { Button } from '$lib/components/ui/button';
import { Checkbox } from '$lib/components/ui/checkbox';
import { Input } from '$lib/components/ui/input';
import { Label } from '$lib/components/ui/label';
import { RadioGroup } from '$lib/components/ui/radio-group';
import { RadioGroupItem } from '$lib/components/ui/radio-group/index.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from '$lib/components/ui/select';
import { Textarea } from '$lib/components/ui/textarea';
import {
  canHaveOptions,
  getFieldData,
  hasOptions,
  isFieldData,
} from '$lib/dnd';
import type { SelectFormField } from '$lib/server/db/schema';
import { genSlug } from '$lib/utils';
import { pageState } from '$stores/pageState.svelte.js';
import { surveyManager } from '$stores/survey.svelte';
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
import { Trash2Icon } from '@lucide/svelte';
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
  onclick: () => void;
  index: number;
  selected: boolean;
};
let {
  field,
  onclick: handleClick,
  index,
  selected = $bindable(false),
}: Props = $props();

// Local state
let element: HTMLDivElement | undefined;
let dragHandle: HTMLDivElement | undefined;
const idleDragState: FieldState = { type: 'idle' };
let dragState = $state(idleDragState);
let value = $state(undefined);
const elementId = genSlug(field);

// Shared state

$effect(() => {
  if (element === undefined || dragHandle === undefined) return;
  return combine(
    draggable({
      element: dragHandle,
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
            dragState = { type: 'preview', container };
          },
        });
      },
      onDragStart() {
        dragState = { type: 'is-dragging' };
      },
      onDrop() {
        dragState = idleDragState;
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
        dragState = { type: 'is-dragging-over', closestEdge };
      },
      onDrag({ self, location }) {
        const closestEdge = extractClosestEdge(self.data);
        console.log('location');
        console.table(location);

        // Only need to update state if nothing has changed.
        // Prevents re-rendering.
        if (
          dragState.type !== 'is-dragging-over' ||
          dragState.closestEdge !== closestEdge
        ) {
          dragState = { type: 'is-dragging-over', closestEdge };
        }
      },
      onDragLeave() {
        dragState = idleDragState;
      },
      onDrop() {
        dragState = idleDragState;
      },
    })
  );
});
</script>


<div class={["relative  rounded-xl flex flex-col justify-between  border-3", selected && 'border-spark-primary', !selected && 'border-transparent']}
     onclick={handleClick}
     role="button"
     bind:this={element}
     onkeydown={() => {}}
     tabindex={index + 2}
     class:opacity-40={dragState.type === 'is-dragging'}
     data-field-id={field.id}>
    <div
            bind:this={dragHandle}
            class="flex text-lg border flex-row items-center py-2 px-4 pl-0 bg-muted/40 hover:bg-muted cursor-grab rounded-t-xl"
    >
        <DragHandle/>
        <span class="truncate flex-grow flex-shrink ml-3">{field.label}</span>
        <Status status={field.type}/>
    </div>
    <div class="p-4 flex flex-col border-x">
        {#if canHaveOptions(field)}
            {#if field.type === 'select'}
                <Select type="single" bind:value name={elementId}>
                    <SelectTrigger class="w-45">{value ?? 'Select an option'}</SelectTrigger>
                    <SelectContent>

                {#if hasOptions(field)}
                    {#each field.options as opt (opt.val)}
                        <SelectItem value={opt.label} label={opt.label}></SelectItem>
                    {/each}
                    {:else}
                    <SelectLabel>No Options</SelectLabel>
                {/if}
                    </SelectContent>
                </Select>
            {:else if field.type === 'radio'}
                <RadioGroup>
                    {#if hasOptions(field)}
                        {#each field.options as opt, index}
                            <div class="flex items-center space-x-2">
                                <RadioGroupItem id={`${index}-${opt.val}`} value={opt.val}></RadioGroupItem>
                                <Label for={`${index}-${opt.val}`}>{opt.label}</Label>
                            </div>
                        {/each}
                    {:else}
                        <span>No options</span>
                    {/if}
                </RadioGroup>
            {:else if field.type === 'checkbox'}
              <div class="grid gap-3">
                {#if hasOptions(field)}
                    {#each field.options as opt, index}
                        <div class="flex items-center space-x-2">
                            <Checkbox id={`${index}-${opt.val}`}/>
                            <Label for={`${index}-${opt.val}`}
                                   class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{opt.label}</Label>
                        </div>
                    {/each}
                {:else}
                    <span>No options</span>
                {/if}
              </div>
            {/if}
        {:else}
            {#if field.type === 'textarea'}
                <Textarea id={elementId} name={elementId} placeholder={field.placeholder}></Textarea>
            {:else}
                <Input type={field.type} value={undefined} placeholder={field.placeholder} id={elementId} name={elementId} />
            {/if}
        {/if}
    </div>
    <div class="py-2 gap-x-2 px-4 text-right border border-t-transparent rounded-b-xl align-middle flex justify-end items-center">
<!--        <Button>Save</Button>-->
        <form class="inline" method="post" action="?/deleteFormField" use:enhance={({ formElement, formData, action, cancel })=>{
          pageState.state = 'loading';
          return async ({result}) => {
                if (result.type === 'redirect') {
                    pageState.state = 'idle'
                    goto(result.location);
                } else {
                    await applyAction(result);
                    console.log('action result', result)
                    if (result.type === 'success' && result.data && typeof result.data.id === "string") {
                        surveyManager.removeField(index)
                    }
                }
                pageState.state = 'idle';
            }
        }}>
            <input type="hidden" name="fieldId" id="fieldId" value={field.id}>
            <Button type="submit"
                    variant="destructive"
                    class="cursor-pointer group inline-flex items-center">
                <span class="sr-only">Delete</span>
              <Trash2Icon/>
            </Button>
        </form>
    </div>
    {#if dragState.type === 'is-dragging-over' && dragState.closestEdge}
        <DropIndicator edge={dragState.closestEdge} gap={'22px'}/>
    {/if}
</div>
{#if dragState.type === 'preview'}
    <Portal target={dragState.container}>
        <DragPreview {field}/>
    </Portal>
{/if}