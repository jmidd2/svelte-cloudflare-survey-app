<script lang="ts">
import DragPreview from '$lib/components/DragPreview.svelte';
import Status from '$lib/components/Status.svelte';
import { Button } from '$lib/components/ui/button';
import { Checkbox } from '$lib/components/ui/checkbox';
import { Input } from '$lib/components/ui/input';
import { Label } from '$lib/components/ui/label';
import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group';
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
import DragHandle from '$lib/dnd/DragHandle.svelte';
import DropIndicator from '$lib/dnd/DropIndicator.svelte';
import Portal from '$lib/dnd/Portal.svelte';
import type { SelectFormField } from '$lib/server/db/schema';
import { genSlug } from '$lib/utils';
import { getSurveyEditor } from '$stores/survey-editor.svelte';
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

interface FieldState {
  type: 'idle' | 'preview' | 'is-dragging' | 'is-dragging-over';
  container?: HTMLElement;
  closestEdge?: Edge | null;
}

interface Props {
  field: SelectFormField;
  index: number;
  selected: boolean;
}

const { field, index, selected }: Props = $props();

// Get editor from context
const editor = getSurveyEditor();

let element = $state<HTMLDivElement>();
let dragHandle = $state<HTMLDivElement>();
let dragState = $state<FieldState>({ type: 'idle' });

const elementId = genSlug(field);

// Handle click
function handleClick() {
  editor.selectField(index);
}

// Handle delete
async function handleDelete() {
  await editor.deleteField(field.id);
}

// Set up drag and drop
$effect(() => {
  if (!element || !dragHandle) return;

  return combine(
    draggable({
      element: dragHandle,
      getInitialData: () => getFieldData(field),
      onGenerateDragPreview({ nativeSetDragImage }) {
        setCustomNativeDragPreview({
          nativeSetDragImage,
          getOffset: pointerOutsideOfPreview({ x: '16px', y: '8px' }),
          render({ container }) {
            dragState = { type: 'preview', container };
          },
        });
      },
      onDragStart() {
        dragState = { type: 'is-dragging' };
      },
      onDrop() {
        dragState = { type: 'idle' };
      },
    }),
    dropTargetForElements({
      element,
      canDrop({ source }) {
        return source.element !== element && isFieldData(source.data);
      },
      getData({ input }) {
        const data = getFieldData(field);
        return attachClosestEdge(data, {
          element: element!,
          input,
          allowedEdges: ['top', 'bottom'],
        });
      },
      getIsSticky: () => true,
      onDragEnter({ self }) {
        const closestEdge = extractClosestEdge(self.data);
        dragState = { type: 'is-dragging-over', closestEdge };
      },
      onDrag({ self }) {
        const closestEdge = extractClosestEdge(self.data);
        if (
          dragState.type !== 'is-dragging-over' ||
          dragState.closestEdge !== closestEdge
        ) {
          dragState = { type: 'is-dragging-over', closestEdge };
        }
      },
      onDragLeave() {
        dragState = { type: 'idle' };
      },
      onDrop() {
        dragState = { type: 'idle' };
      },
    })
  );
});
</script>

<div
        class={[
    "relative rounded-xl flex flex-col justify-between border-3",
    selected && 'border-spark-primary',
    !selected && 'border-transparent'
  ].join(' ')}
        onclick={handleClick}
        role="button"
        bind:this={element}
        onkeydown={() => {}}
        tabindex={index + 2}
        class:opacity-40={dragState.type === 'is-dragging'}
        data-field-id={field.id}
>
    <div
            bind:this={dragHandle}
            class="flex text-lg border flex-row items-center py-2 px-4 pl-0 bg-muted/40 hover:bg-muted cursor-grab rounded-t-xl"
    >
        <DragHandle />
        <span class="truncate flex-grow flex-shrink ml-3">{field.label}</span>
        <Status status={field.type} />
    </div>

    <div class="p-4 flex flex-col border-x">
        <!-- Field preview content remains the same -->
        {#if canHaveOptions(field)}
            {#if field.type === 'select'}
                <Select disabled name={elementId}>
                    <SelectTrigger class="w-45">Select an option</SelectTrigger>
                    <SelectContent>
                        {#if hasOptions(field)}
                            {#each field.options as opt}
                                <SelectItem value={opt.val} label={opt.label} />
                            {/each}
                        {:else}
                            <SelectLabel>No Options</SelectLabel>
                        {/if}
                    </SelectContent>
                </Select>
            {:else if field.type === 'radio'}
                <RadioGroup disabled>
                    {#if hasOptions(field)}
                        {#each field.options as opt, i}
                            <div class="flex items-center space-x-2">
                                <RadioGroupItem id={`${i}-${opt.val}`} value={opt.val} disabled />
                                <Label for={`${i}-${opt.val}`}>{opt.label}</Label>
                            </div>
                        {/each}
                    {:else}
                        <span>No options</span>
                    {/if}
                </RadioGroup>
            {:else if field.type === 'checkbox'}
                <div class="grid gap-3">
                    {#if hasOptions(field)}
                        {#each field.options as opt, i}
                            <div class="flex items-center space-x-2">
                                <Checkbox id={`${i}-${opt.val}`} disabled />
                                <Label for={`${i}-${opt.val}`}>{opt.label}</Label>
                            </div>
                        {/each}
                    {:else}
                        <span>No options</span>
                    {/if}
                </div>
            {/if}
        {:else if field.type === 'textarea'}
            <Textarea disabled placeholder={field.placeholder} />
        {:else}
            <Input type={field.type} disabled placeholder={field.placeholder} />
        {/if}
    </div>

    <div class="py-2 gap-x-2 px-4 text-right border border-t-transparent rounded-b-xl align-middle flex justify-end items-center">
        <Button
                type="button"
                variant="destructive"
                onclick={handleDelete}
                disabled={editor.isLoading}
        >
            <span class="sr-only">Delete</span>
            <Trash2Icon />
        </Button>
    </div>

    {#if dragState.type === 'is-dragging-over' && dragState.closestEdge}
        <DropIndicator edge={dragState.closestEdge} gap="22px" />
    {/if}
</div>

{#if dragState.type === 'preview'}
    <Portal target={dragState.container}>
        <DragPreview {field} />
    </Portal>
{/if}