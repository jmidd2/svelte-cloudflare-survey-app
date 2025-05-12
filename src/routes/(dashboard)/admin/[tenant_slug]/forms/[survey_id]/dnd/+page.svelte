<script lang="ts">
import FormFieldList from '$lib/dnd/FormFieldList.svelte';

const { data } = $props();
let fields = $derived(data.fields ?? []);
type PageState = 'idle' | 'loading';
const idle: PageState = 'idle';
let pageState: PageState = $state(idle);
let message: null | string = $state(null);

async function saveSorted() {
  const sortedData = fields.map((val, index) => {
    return {
      orderIndex: index + 1,
      id: val.id,
    };
  });

  pageState = 'loading';
  const response = await fetch('/api/survey/order', {
    method: 'POST',
    body: JSON.stringify(sortedData),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (response.ok) {
    message = 'Saved';
  } else {
    message = 'Error';
  }
  pageState = 'idle';
  setTimeout(() => {
    message = null;
  }, 3000);
}
</script>

{#if pageState === 'loading'}
    loading...
{/if}
{#if pageState === 'idle' && message}
    {message}
{/if}
<div class="flex flex-col gap-2 p-2 text-black">
    <FormFieldList bind:fields={fields} {saveSorted}/>
</div>