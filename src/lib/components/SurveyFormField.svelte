<script lang="ts">
import { enhance } from '$app/forms';
import { invalidateAll } from '$app/navigation';
import type { PageProps } from './$types';

const {
  nextOrder: nextOrderIndex,
  previousOrder: previousOrderIndex,
  item,
  index,
  moveItem,
  form,
}: PageProps = $props();

let acceptDrop = $state<'none' | 'top' | 'bottom'>('none');
const acceptDropTop = $derived(acceptDrop === 'top');
const acceptDropBottom = $derived(acceptDrop === 'bottom');
const acceptDropReset = $derived(acceptDrop === 'none');
let formDom: HTMLFormElement;

let itemUpdate = $state<{ id: string; orderIndex: number }>({
  id: '',
  orderIndex: 0,
});

function handleDragOver(
  e: DragEvent & {
    currentTarget: EventTarget & HTMLLIElement;
  }
) {
  if (e.dataTransfer?.types.includes('application/form-item')) {
    e.preventDefault();
    e.stopPropagation();
    let rect = e.currentTarget?.getBoundingClientRect();
    let midpoint = (rect.top + rect.bottom) / 2;
    acceptDrop = e.clientY <= midpoint ? 'top' : 'bottom';
  }
}

function handleDragLeave() {
  acceptDrop = 'none';
}

function handleDrop(
  e: DragEvent & {
    currentTarget: EventTarget & HTMLLIElement;
  }
) {
  e.stopPropagation();
  if (e.dataTransfer) {
    let transfer = JSON.parse(e.dataTransfer.getData('application/form-item'));

    let droppedOrderIndex =
      acceptDrop === 'top' ? previousOrderIndex : nextOrderIndex;

    let newOrderIndex = (droppedOrderIndex + item.orderIndex) / 2;

    console.log(
      newOrderIndex,
      droppedOrderIndex,
      nextOrderIndex,
      previousOrderIndex,
      transfer
    );

    moveItem(newOrderIndex, transfer.index, transfer.id);

    // saveSorted();

    // itemUpdate = {
    //   id: transfer.id,
    //   orderIndex: newOrderIndex,
    // };

    // formDom.requestSubmit();

    // const data = new FormData();
    // data.set('id', transfer.id);
    // data.set('orderIndex', newOrderIndex.toString());
    //
    // fetch('/api/survey/order', {
    //   method: 'POST',
    //   body: data,
    //   headers: {
    //     'x-sveltekit-action': 'true',
    //   },
    // });

    invalidateAll();
  }
  acceptDrop = 'none';
}

function handleDragStart(
  e: DragEvent & {
    currentTarget: EventTarget & HTMLFormElement;
  }
) {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData(
      'application/form-item',
      JSON.stringify({ ...item, index })
    );
  }
}

$effect(() => {
  console.log('survey redrawing');
});
</script>

<li draggable="true" class="border-red-400" class:border-t={acceptDropTop} class:border-b={acceptDropBottom}
    class:border-none={acceptDropReset}
    ondragover={handleDragOver} ondragleave={handleDragLeave} ondrop={handleDrop}>
    <form bind:this={formDom} draggable="true" method="POST" use:enhance
          ondragstart={handleDragStart}>
        <input type="hidden" bind:value={itemUpdate.id} name="id" id="id"/>
        <input type="hidden" bind:value={itemUpdate.orderIndex} name="orderIndex" id="orderIndex"/>
        {item.label}
        {#if item.type === 'textarea'}
            <textarea></textarea>
        {:else if item.type === 'select'}
            <select>
                {#if Array.isArray(item.options)}
                    {#each item.options as option}
                        <option>{JSON.stringify(option)}</option>
                    {/each}
                {:else}
                    <option>{JSON.stringify(item.options)}</option>
                {/if}
            </select>
        {:else}
            <input type={item.type}
                   placeholder={item.placeholder}/>
        {/if}
    </form>
</li>