<script lang="ts">
import { deserialize } from '$app/forms';
import {
  formElements,
  isFormFieldData,
  isHtmlFormField,
  sampleFormFieldLabels,
} from '$lib';
import FormElement from '$lib/components/FormElement.svelte';
import FormFieldList from '$lib/dnd/FormFieldList.svelte';
import {
  type InsertFormField,
  type SelectFormField,
} from '$lib/server/db/schema';
import type { HtmlFormElements, SaveSortedFnArgs } from '$lib/types';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { v4 as uuid } from 'uuid';

type PageState = 'idle' | 'loading';
const idle: PageState = 'idle';

const { data } = $props();

let formFields = $derived(data.fields);
const survey = $derived(data.survey);

let lastUpdate = $derived(survey.updatedAt);
let lastUpdateString = $derived(`${lastUpdate.toLocaleString()}`);

let showSavedAlert = $state(false);
let isActive = $derived(survey.active);

let pageState: PageState = $state(idle);
let errorMessage: null | string = $state(null);

const highestDropIndex = $derived(
  formFields.reduce((prev, curr) => {
    if (curr.orderIndex > prev) return curr.orderIndex;
    return prev;
  }, 0)
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

async function saveSorted(args?: SaveSortedFnArgs) {
  let data: { orderIndex: number; id: string }[] = [];
  if (args?.sortedData) {
    data = args.sortedData;
  } else if (args?.removedId) {
    data = formFields
      .filter(e => e.id !== args.removedId)
      .map((val, index) => {
        return {
          orderIndex: index + 1,
          id: val.id,
        };
      });
  } else {
    data = formFields.map((val, index) => {
      return {
        orderIndex: index + 1,
        id: val.id,
      };
    });
  }

  pageState = 'loading';
  const response = await fetch('/api/survey/order', {
    method: 'POST',
    body: JSON.stringify({ formId: survey.id, sortedData: data }),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (response.ok) {
    const data = await response.json();
    console.log('response', data);
    if (data?.lastUpdated) {
      lastUpdate = new Date(data.lastUpdated);
    }
  } else {
    errorMessage = 'Error';
  }

  setTimeout(() => {
    showSavedAlert = true;
    pageState = 'idle';
  }, 1500);

  setTimeout(() => {
    showSavedAlert = false;
  }, 3000);
}

let dropBox: HTMLDivElement | undefined;
let dragState: 'idle' | 'is-dragged-over' = $state('idle');
let elementBeingDropped = $state('');

function generateFormFieldData(
  type: HtmlFormElements
): Exclude<SelectFormField, 'createdAt' | 'updatedAt'> {
  const label =
    sampleFormFieldLabels[
      Math.floor(Math.random() * sampleFormFieldLabels.length)
    ];

  const options = [
    { label: 'value 1', val: 'val-1' },
    { label: 'value 2', val: 'val-2' },
    { label: 'value 3', val: 'val-3' },
  ];

  let fieldData: SelectFormField = {
    id: uuid(),
    formId: survey.id,
    type,
    label,
    placeholder: label,
    orderIndex: highestDropIndex + 1,
    createdAt: new Date(Date.now()),
    updatedAt: new Date(Date.now()),
    required: false,
    options: null,
  };

  switch (type) {
    case 'checkbox':
      fieldData.options = options;
      break;
    case 'date':
      break;
    case 'email':
      fieldData.placeholder = 'email@email.com';
      break;
    case 'number':
      fieldData.placeholder = '10';
      break;
    case 'radio':
      fieldData.options = options;
      break;
    case 'range':
      break;
    case 'tel':
      fieldData.placeholder = '111-222-3333';
      break;
    case 'text':
      break;
    case 'textarea':
      break;
    case 'select':
      fieldData.options = options;
      break;
    default:
      break;
  }

  return fieldData;
}

$effect(() => {
  if (!dropBox) return;

  dropTargetForElements({
    element: dropBox,
    onDragEnter: ({ source }) => {
      if (!source.data.elementType) return;
      elementBeingDropped = source.data.elementType as string;
      dragState = 'is-dragged-over';
    },
    onDragLeave: () => {
      elementBeingDropped = '';
      dragState = 'idle';
    },
    onDrop: ({ location, source }) => {
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
    {errorMessage}
{/if}
<div class="grid grid-cols-[auto_1fr]">
    <div>
        <ul>
            {#each formElements as element}
                <FormElement label={element}></FormElement>
            {/each}
        </ul>
    </div>
    <div bind:this={dropBox}
         class={['rounded-xl border-dashed border p-4 my-4', {'bg-amber-500/30 ': dragState === 'is-dragged-over'}]}>
        <p class="text-center font-bold">Drag elements here</p>
        <div class="text-black mt-2">
            <FormFieldList bind:fields={formFields} {saveSorted}/>
        </div>
    </div>
</div>

<style>

</style>