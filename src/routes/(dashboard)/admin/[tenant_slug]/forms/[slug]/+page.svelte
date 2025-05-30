<script lang="ts">
import FormFieldList from '$lib/components/FormFieldList.svelte';
import { Input } from '$lib/components/ui/input';
import { Label } from '$lib/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '$lib/components/ui/select';
import { Switch } from '$lib/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
import { TabsContent } from '$lib/components/ui/tabs/index.js';
import type { SelectFormField } from '$lib/server/db/schema';
import { isHtmlFormField } from '$lib/utils';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
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

$effect(() => {
  const selectedDiv = document.querySelector(
    `[data-field-id="${selectedFormField?.id}"]`
  );

  if (!selectedDiv) return;

  selectedDiv.scrollIntoView({ block: 'center', behavior: 'smooth' });
});
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
    <ToolboxSidebar {formFields} bind:selectedFormField />
    <div bind:this={dropBox}
         class={['flex flex-1 flex-col']}>
        <div class="flex-1 p-6 overflow-auto bg-muted/10">
            <div class="max-w-4xl mx-auto p-6 rounded-lg shadow-sm border">
                <h1 class="flex flex-col text-2xl mb-2">{survey.title} <span class="text-sm text-muted-foreground">Survey #{survey.id}</span>
                </h1>
                <p>{survey.description}</p>
                <FormFieldList bind:selectedFormField={selectedFormField} bind:fields={formFields}
                               bind:pageState={pageState}/>
            </div>
        </div>
    </div>
    <div class="w-100 border-l bg-muted/20 p-4 overflow-y-auto">
        <h2 class="font-semibold mb-4">Properties</h2>
        <Tabs value="general">
            <TabsList class="grid w-full grid-cols-4">
                <TabsTrigger value="general" class="hover:cursor-pointer">General</TabsTrigger>
                <TabsTrigger value="specific" class="hover:cursor-pointer">Specific</TabsTrigger>
                <TabsTrigger value="validation" class="hover:cursor-pointer">Validation</TabsTrigger>
                <TabsTrigger value="interaction" class="hover:cursor-pointer">Interaction</TabsTrigger>
            </TabsList>
            <TabsContent value="general" class="space-y-4 pt-4">
                <div class="space-y-2 ">
                    <Label for="label">Label</Label>
                    <Input id="label" class="" value={selectedFormField?.label} placeholder={selectedFormField?.label}/>
                </div>

                <div class="space-y-2">
                    <Label for="placeholder">Placeholder</Label>
                    <Input id="placeholder"/>
                </div>

                <div class="space-y-2">
                    <Label for="defaultValue">Default Value</Label>
                    <Input id="defaultValue"/>
                </div>

                <div class="space-y-2">
                    <div class="flex items-center justify-between">
                        <Label for="isVisible">Visible</Label>
                        <Switch id="isVisible"/>
                    </div>
                </div>

                <div class="flex items-center justify-between">
                    <Label for="isEnabled">Enabled</Label>
                    <Switch id="isEnabled"/>
                </div>
                <div class="flex items-center justify-between relative">
                    <Label for="isEnabled">Enabled</Label>
                    <Select type="single">
                        <SelectTrigger class="w-[180px]"></SelectTrigger>
                        <SelectContent strategy="absolute">
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </TabsContent>
            <TabsContent value="specific" class="space-y-4 pt-4">
                Specific
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