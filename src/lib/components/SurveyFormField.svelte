<script lang="ts">
const { nextOrder, previousOrder, item, index, moveItem } = $props();

let acceptDrop = $state<'none' | 'top' | 'bottom'>('none');
const acceptDropTop = $derived(acceptDrop === 'top');
const acceptDropBottom = $derived(acceptDrop === 'bottom');
const acceptDropReset = $derived(acceptDrop === 'none');
function handleDragOver(e: DragEvent) {
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

function handleDrop(e: DragEvent) {
  e.stopPropagation();
  if (e.dataTransfer) {
    let transfer = JSON.parse(e.dataTransfer.getData('application/form-item'));

    let droppedOrder = acceptDrop === 'top' ? previousOrder : nextOrder;

    let moveOrder = (droppedOrder + item.orderIndex) / 2;

    console.log(
      moveOrder,

      droppedOrder,
      nextOrder,
      previousOrder,
      transfer
    );

    moveItem(moveOrder, transfer.index, transfer.id);
  }
  acceptDrop = 'none';
}

function handleDragStart(e: DragEvent) {
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

<li draggable="true" class="border-red-400" class:border-t={acceptDropTop} class:border-b={acceptDropBottom} class:border-none={acceptDropReset}
             ondragover={handleDragOver} ondragleave={handleDragLeave} ondrop={handleDrop}>
    <div draggable="true"
         ondragstart={handleDragStart}>
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
    </div>
</li>