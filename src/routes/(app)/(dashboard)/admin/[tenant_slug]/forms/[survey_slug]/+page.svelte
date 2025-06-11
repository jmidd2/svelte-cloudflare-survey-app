<script lang="ts">
import { applyAction, enhance } from '$app/forms';
import EditFieldOptionList from '$lib/components/EditFieldOptionList.svelte';
import { FormFieldList } from '$lib/components/FormFieldList';
import { ToolboxSidebar } from '$lib/components/ToolboxSidebar';
import { Button } from '$lib/components/ui/button';
import { Input } from '$lib/components/ui/input';
import { Label } from '$lib/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '$lib/components/ui/select/index.js';
import { Switch } from '$lib/components/ui/switch';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '$lib/components/ui/tabs';
import type { SelectFormField } from '$lib/server/db/schema';
import {
  FIELD_LABELS,
  fieldHasOptions,
  fieldSupportsPlaceholder,
} from '$lib/utils';
import { SurveyEditor, setSurveyEditor } from '$stores/survey-editor.svelte';
import { CheckCheckIcon, PlusIcon } from '@lucide/svelte';
import { slide } from 'svelte/transition';
import type { PageProps } from './$types';
import { saveFieldSchema } from './schema';

const { data, form: formProp }: PageProps = $props();

// Create the survey editor instance
const editor = new SurveyEditor(data.survey, data.fields);
setSurveyEditor(editor);

// Update editor data when server data changes
$effect(() => {
  editor.fields = [...data.fields];
  editor.survey = data.survey;
});

let tabValue = $state('general');

// Reactive values from the editor
const selectedField = $derived(editor.selectedField);
const isLoading = $derived(editor.isLoading);

function parseFormData(formData: FormData) {
  return saveFieldSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    options: JSON.parse(formData.get('options')?.toString() ?? '[]'),
  });
}

let areAllValid = $derived.by(() => {
  const allValues = selectedField?.options?.map(opt => opt.val) ?? [];

  return new Set(allValues).size === allValues.length;
});

$inspect(editor.isSaved);
</script>
<div class="flex flex-1 overflow-hidden">
  <div class="w-64 border-r border-spark-secondary-600 flex flex-col h-full">
    <ToolboxSidebar/>
  </div>
  <div class="flex flex-1 flex-col">
    <div class="flex-1 p-6 overflow-auto bg-muted/10">
      <div class="max-w-4xl mx-auto p-6 rounded-lg shadow-sm border">
        <div class="mb-3">
          <h1 class="flex flex-col text-2xl mb-2">
            {editor.survey?.title}
            <span class="text-sm text-muted-foreground">
              Survey #{editor.survey?.id}
            </span>
          </h1>
          <p>{editor.survey?.description}</p>
          <div class="text-muted-foreground text-sm flex items-center gap-2 my-1">
            <p>
            Last Update: {editor.survey ? new Date(editor.survey.updatedAt).toLocaleString() : ''}
            </p>
            <div class="flex gap-2 items-center justify-center text-green-600">
              {#if editor.isLoading}
                <div class="text-accent-foreground">
                <svg class="ml-1 size-4 animate-spin inline" xmlns="http://www.w3.org/2000/svg" fill="none"
                     viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                </div>
              {/if}
              {#if editor.isSaved}
              <CheckCheckIcon class="size-5"></CheckCheckIcon>
              Saved!
                {/if}
            </div>
          </div>
        </div>
        <FormFieldList/>
      </div>
    </div>
  </div>
  {#if selectedField}
    <form
        class="w-100 border-l bg-muted/20 p-4 overflow-y-auto grid grid-rows-[auto_1fr_auto]"
        transition:slide={{ axis: 'x' }}
        method="post"
        action="?/save-field"
        use:enhance={({formData, cancel}) => {
            editor.loading = true;
              let previousState: Partial<SelectFormField> | null = null;

              if (editor.selectedField) {
                // Backup current state
                previousState = { ...editor.selectedField };

                formData.set('fieldId', editor.selectedField.id);
                formData.set('type', editor.selectedField.type);
                formData.set('label', editor.selectedField.label);
                formData.set('required', editor.selectedField.required ? 'on' : 'off' );
                formData.set('options', JSON.stringify(editor.selectedField.options ?? []));
                if (editor.selectedField.placeholder && editor.selectedField.placeholder.length > 0)
                  formData.set('placeholder', editor.selectedField.placeholder);

                // Apply optimistic update
                const updates = parseFormData(formData);
                if (updates.error) {
                  console.error('There was an error parsing the form data.', updates.error);
                  cancel();
                  editor.loading = false;
                  return;
                }
                console.log('optimistic update', updates.data);
                editor.updateField(updates.data);

                formData.set('test', 'test');
              }

              return async ({ result }) => {
                if (result.type === 'failure' && previousState) {
                  // Revert on failure
                  editor.updateField(previousState);
                  console.error('There was an error saving the field.', result.data);
                }

                await applyAction(result);
                editor.loading = false;
              };
            }}
    >
      <input type="hidden" name="fieldId" value={selectedField.id}>
      <h2 class="font-semibold mb-4">Properties</h2>
      <Tabs bind:value={tabValue}>
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger
              value="options"
              disabled={!selectedField.options || selectedField.options.length === 0}
          >
            Options
          </TabsTrigger>
        </TabsList>
        <TabsContent value="general" class="space-y-4 pt-4">
          <div class="space-y-2">
            <Label for="type">Type</Label>
            <Select type="single" name="type" bind:value={selectedField.type}>
              <SelectTrigger class="w-full">{FIELD_LABELS[selectedField.type]}</SelectTrigger>
              <SelectContent>
                {#each Object.entries(FIELD_LABELS) as [k, v]}
                  <SelectItem value={k}>{v}</SelectItem>
                {/each}
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label for="label">Label</Label>
            <Input
                id="label"
                name="label"
                bind:value={selectedField.label}
            />
          </div>
          {#if fieldSupportsPlaceholder(selectedField.type)}
            <div class="space-y-2">
              <Label for="placeholder">Placeholder</Label>
              <Input
                  id="placeholder"
                  name="placeholder"
                  bind:value={selectedField.placeholder}
              />
            </div>
          {/if}
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <Label for="required">Required</Label>
              <Switch
                  id="required"
                  name="required"
                  bind:checked={selectedField.required}
              />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="options" class="space-y-4 pt-4">
          {#if fieldHasOptions(selectedField)}
            <EditFieldOptionList {areAllValid} bind:options={selectedField.options}/>
            <Button variant="outline" type="button" onclick={() => { selectedField.options.push({ id: crypto.randomUUID(), val: 'string', label: 'string' }); }}>
              <PlusIcon/>
              Add Option
            </Button>
          {/if}
        </TabsContent>
      </Tabs>
      <div>
        <Button type="submit" class="w-full" disabled={isLoading || !areAllValid}>
          {#if editor.isSaved}
            Saved!
            {:else if isLoading}
            Saving
            {:else}
            Save
            {/if}
          <!--{isLoading ? 'Saving...' : 'Save'}-->
        </Button>
      </div>
    </form>
  {/if}
</div>