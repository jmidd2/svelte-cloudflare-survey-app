<script lang="ts">
import EditFieldOptionList from '$lib/components/EditFieldOptionList.svelte';
import FormFieldList from '$lib/components/FormFieldList.svelte';
import { Button } from '$lib/components/ui/button';
import { Input } from '$lib/components/ui/input';
import { Label } from '$lib/components/ui/label';
import { Switch } from '$lib/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
import { TabsContent } from '$lib/components/ui/tabs/index.js';
import { canHaveOptions } from '$lib/dnd';
import type { SelectFormField } from '$lib/server/db/schema';
import { isHtmlFormField } from '$lib/utils';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { PlusIcon } from '@lucide/svelte';
import type { PageProps } from './$types';
import ToolboxSidebar from './ToolboxSidebar.svelte';

type PageState = 'idle' | 'loading';
const idle: PageState = 'idle';

const { data, form: formProp }: PageProps = $props();
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

let selectedFormField: SelectFormField | null = $state(null);

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
let tabValue = $state('general');
$effect(() => {
  const selectedDiv = document.querySelector(
    `[data-field-id="${selectedFormField?.id}"]`
  );

  if (!selectedDiv || formFields.length < 1) return;

  if (
    tabValue === 'options' &&
    (!selectedFormField?.options ||
      (selectedFormField.options && selectedFormField?.options.length === 0))
  )
    tabValue = 'general';

  selectedDiv.scrollIntoView({ block: 'center', behavior: 'smooth' });
});

function hasPlaceholder(field: SelectFormField) {
  return !canHaveOptions(field);
}
</script>
<div class="border-b pb-2 mb-2 hidden">
  <h1 class="flex flex-col text-2xl mb-2">{survey.title} <span class="text-sm">Survey #{survey.id}</span></h1>
  <p>{survey.description}</p>
</div>
<div class="items-center hidden">
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
<div class="border-b hidden">
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
  <ToolboxSidebar bind:formFields bind:selectedFormField/>
  <div bind:this={dropBox}
       class={['flex flex-1 flex-col']}>
    <div class="flex-1 p-6 overflow-auto bg-muted/10">
      <div class="max-w-4xl mx-auto p-6 rounded-lg shadow-sm border">
        <div class="mb-3">
          <h1 class="flex flex-col text-2xl mb-2">{survey.title} <span
              class="text-sm text-muted-foreground">Survey #{survey.id}</span></h1>
          <p>{survey.description}</p>
          <p class="text-muted-foreground text-sm">Last Update:
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
          </p>
        </div>
        <FormFieldList bind:selectedFormField={selectedFormField} bind:fields={formFields}
                       bind:pageState={pageState}/>
      </div>
    </div>
  </div>
  <div class="w-100 border-l bg-muted/20 p-4 overflow-y-auto">
    <h2 class="font-semibold mb-4">Properties</h2>
    <Tabs bind:value={tabValue}>
      <TabsList class="grid w-full grid-cols-4">
        <TabsTrigger value="general" class="hover:cursor-pointer">General</TabsTrigger>
        <TabsTrigger value="options" disabled={!selectedFormField?.options || selectedFormField?.options.length === 0} class="hover:cursor-pointer">Options</TabsTrigger>
        <TabsTrigger value="validation" class="hover:cursor-pointer">Validation</TabsTrigger>
        <TabsTrigger value="interaction" class="hover:cursor-pointer">Interaction</TabsTrigger>
      </TabsList>
      <TabsContent value="general" class="space-y-4 pt-4">
        {#if selectedFormField}
          <div class="space-y-2 ">
            <Label for="label">Label</Label>
            <Input id="label" class="" value={selectedFormField?.label} placeholder={selectedFormField?.label}/>
          </div>
          {#if hasPlaceholder(selectedFormField)}
            <div class="space-y-2">
              <Label for="placeholder">Placeholder</Label>
              <Input id="placeholder" value={selectedFormField?.placeholder}
                     placeholder={selectedFormField?.placeholder}/>
            </div>
          {/if}
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <Label for="isRequired">Required</Label>
              <Switch id="isRequired" bind:checked={selectedFormField.required}/>
            </div>
          </div>
        {/if}
      </TabsContent>
      <TabsContent value="options" class="space-y-4 pt-4">

        {#if selectedFormField}
          {#if canHaveOptions(selectedFormField)}
            {#if !!selectedFormField.options && selectedFormField.options.length > 0}
              <EditFieldOptionList options={selectedFormField.options}></EditFieldOptionList>
            {/if}
            <Button variant="outline" type="button" class="my-3 ml-4 mr-auto flex justify-around items-center hover:cursor-pointer">
              <PlusIcon/>
              Add Option
            </Button>
          {:else}
            <p>This type cannot have options</p>
          {/if}
        {/if}
      </TabsContent>
      <TabsContent value="validation" class="space-y-4 pt-4">
        Validation
      </TabsContent>
      <TabsContent value="interaction" class="space-y-4 pt-4">
        Interaction
      </TabsContent>
    </Tabs>
  </div>
</div>

<style>

</style>