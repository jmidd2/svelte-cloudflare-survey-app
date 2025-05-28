<script lang="ts">
import { formElements, isHtmlFormField } from '$lib';
import FormElement from '$lib/components/FormElement.svelte';
import FormFieldList from '$lib/components/FormFieldList.svelte';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import type { PageProps } from './$types';

type PageState = 'idle' | 'loading';
const idle: PageState = 'idle';

const { data, form: formProp }: PageProps = $props();
$inspect(formProp);
let formFields = $derived(data.fields);
const survey = $derived(data.survey);

let lastUpdate = $derived(formProp?.lastUpdated ?? survey.updatedAt);
let lastUpdateString = $derived(`${lastUpdate.toLocaleString()}`);

let showSavedAlert = $state(false);
let isActive = $derived(survey.active);

let pageState: PageState = $state(idle);
let errorMessage: null | string = $derived(
  formProp?.error ? formProp.message : null
);

$effect(() => {
  console.log(
    'state order',
    formFields.map(e => e.orderIndex)
  );
});

const isAdmin = $derived(
  data.session?.user ? data.session.user.roles.includes('admin') : false
);

let dropBox: HTMLDivElement | undefined;
let dragState: 'idle' | 'is-dragged-over' = $state('idle');

$effect(() => {
  if (!dropBox) return;

  dropTargetForElements({
    element: dropBox,
    onDragEnter: ({ source }) => {
      if (!source.data.elementType) return;
      dragState = 'is-dragged-over';
    },
    onDragLeave: () => {
      dragState = 'idle';
    },
    onDrop: ({ source }) => {
      dragState = 'idle';
      if (
        !(source.data.elementType && isHtmlFormField(source.data.elementType))
      )
        return;
    },
  });
});

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
        {lastUpdateString}
        {#if showSavedAlert}
            Saved!
        {/if}
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

{#if pageState === 'idle' && errorMessage}
    <p class="bg-red-500 text-white p-3">{errorMessage}</p>
{/if}

<div class="flex flex-1 overflow-hidden">
    <div class="w-64 border-r flex flex-col h-full">
        <ul>
            {#each formElements as element}
                <FormElement label={element}></FormElement>
            {/each}
        </ul>
    </div>
    <div bind:this={dropBox}
         class={['flex flex-1 flex-col', {'bg-amber-500/30 ': dragState === 'is-dragged-over'}]}>
        <div class="text-black overflow-y-auto">
            <FormFieldList bind:fields={formFields} bind:pageState={pageState} />
        </div>
    </div>
    <div class="w-80 border-l overflow-y-auto">
        Properties
    </div>
</div>

<style>

</style>