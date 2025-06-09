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
  ALL_FIELD_TYPES,
  FIELD_LABELS,
  fieldHasOptions,
  fieldSupportsPlaceholder,
} from '$lib/utils';
import { SurveyEditor, setSurveyEditor } from '$stores/survey-editor.svelte';
import { PlusIcon } from '@lucide/svelte';
import { slide } from 'svelte/transition';
import { z } from 'zod/v4';
import type { PageProps } from './$types';

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
  const schema = z.object({
    type: z.enum(ALL_FIELD_TYPES),
    label: z.string(),
    placeholder: z.string().optional(),
    required: z.stringbool(),
  });

  return schema.safeParse(Object.fromEntries(formData.entries()));
}
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
          <p class="text-muted-foreground text-sm">
            Last Update: {editor.survey ? new Date(editor.survey.updatedAt).toLocaleString() : ''}
            {#if isLoading}
              <svg class="ml-1 size-5 animate-spin inline" xmlns="http://www.w3.org/2000/svg" fill="none"
                   viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            {/if}
          </p>
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
        action="/?save-field"
        use:enhance={({formData, cancel}) => {
              let previousState: Partial<SelectFormField> | null = null;

              if (editor.selectedIndex >= 0) {
                // Backup current state
                previousState = { ...editor.selectedField };

                // Apply optimistic update
                const updates = parseFormData(formData);
                if (updates.error) {
                  cancel();
                  return;
                }

                editor.updateField(updates.data);
              }

              return async ({ result }) => {
                if (result.type === 'failure' && previousState) {
                  // Revert on failure
                  editor.updateField(previousState);
                  console.error('There was an error saving the field.', result.data);
                }

                await applyAction(result);
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
            <EditFieldOptionList options={selectedField.options}/>
            <Button variant="outline" type="button">
              <PlusIcon/>
              Add Option
            </Button>
          {/if}
        </TabsContent>
      </Tabs>
      <div>
        <Button type="submit" class="w-full" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  {/if}
</div>