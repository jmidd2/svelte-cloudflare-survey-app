<script lang="ts">
import type { HtmlFormElements } from '$lib/types';
import { draggable } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

type Props = {
  label: HtmlFormElements;
};

let { label }: Props = $props();
let element: HTMLLIElement | undefined;
let state: 'idle' | 'is-dragging' | 'preview' | 'is-dragging-over' =
  $state('idle');

$effect(() => {
  if (!element) return;
  draggable({
    element,
    getInitialData: () => ({ elementType: label }),
    onDragStart: () => {
      state = 'is-dragging';
    },
    onDrop: () => {
      state = 'idle';
    },
  });
});
</script>

<li bind:this={element} class={['border', {'border-white border-dashed opacity-75 bg-slate-200/40': state !== 'idle', 'border-transparent border-solid': state === 'idle'}]}>{label}</li>

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