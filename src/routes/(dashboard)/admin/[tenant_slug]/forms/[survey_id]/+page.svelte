<script lang="ts">
import FormFieldList from '$lib/dnd/FormFieldList.svelte';

const { data } = $props();

let formFields = $state(data.fields);
const survey = $derived(data.survey);
let lastUpdate = $derived(survey.updatedAt.toLocaleDateString());
let isActive = $derived(survey.active);
type PageState = 'idle' | 'loading';
const idle: PageState = 'idle';
let pageState: PageState = $state(idle);
let message: null | string = $state(null);

const isAdmin = $derived(
  data.session?.user ? data.session.user.roles.includes('admin') : false
);

async function saveSorted() {
  const sortedData = formFields.map((val, index) => {
    return {
      orderIndex: index + 1,
      id: val.id,
    };
  });

  pageState = 'loading';
  const response = await fetch('/api/survey/order', {
    method: 'POST',
    body: JSON.stringify({ formId: survey.id, sortedData }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (response.ok) {
    const data = await response.json();
    console.log('response', data);
    if (data?.lastUpdated) {
      lastUpdate = new Date(data.lastUpdated).toLocaleDateString();
    }
    message = 'Saved';
  } else {
    message = 'Error';
  }

  setTimeout(() => {
    message = null;
    pageState = 'idle';
  }, 3000);
}

$inspect(formFields);
</script>
<div class="border-b pb-2 mb-2">
    <h1 class="flex flex-col text-2xl mb-2">{survey.title} <span class="text-sm">Survey #{data.id}</span></h1>
    <p>{survey.description}</p>
</div>
<div class="inline-flex items-center">
    Last Update:
    {#if pageState === 'loading'}
        saving
        <svg class="ml-1 size-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
             viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {:else}
        {lastUpdate}
    {/if}
</div>
<div class="border-b">
    <h2>Settings</h2>
    <div class="flex gap-2 items-center">
        <label for="active">Active: </label>
        <input type="checkbox"
               bind:checked={isActive}
               name="active" id="active"
               disabled={!isAdmin}/></div>
    <div>
        {#if survey.settings}
            {#each Object.entries(survey.settings) as [key, val], index}
                <p>{key}: {val}</p>
            {/each}
        {/if}
    </div>
</div>

{#if pageState === 'idle' && message}
    {message}
{/if}
<div class="text-black">
    <FormFieldList bind:fields={formFields} {saveSorted}/>
</div>