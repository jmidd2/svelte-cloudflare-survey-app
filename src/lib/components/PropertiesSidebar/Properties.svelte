<script lang="ts">
import { PlusIcon, XIcon } from '@lucide/svelte';
import { toast } from 'svelte-sonner';
import { z } from 'zod/v4';
import { applyAction, enhance } from '$app/forms';
import EditFieldOptionList from '$lib/components/EditFieldOptionList.svelte';
import { Button } from '$lib/components/ui/button/index.js';
import { Input } from '$lib/components/ui/input/index.js';
import { Label } from '$lib/components/ui/label/index.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '$lib/components/ui/select/index.js';
import { Switch } from '$lib/components/ui/switch/index.js';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '$lib/components/ui/tabs/index.js';
import type { SelectFormField } from '$lib/server/db/schema.js';
import {
  FIELD_LABELS,
  fieldHasOptions,
  fieldSupportsPlaceholder,
} from '$lib/utils/index.js';
import { saveFieldSchema } from '$lib/validation-schema';
import { getSurveyEditor } from '$stores/survey-editor.svelte';

const editor = getSurveyEditor();
const selectedField = $derived(editor.selectedField);
let tabValue = $state('general');

let areAllValid = $derived.by(() => {
  const allValues = selectedField?.options?.map(opt => opt.val) ?? [];

  return new Set(allValues).size === allValues.length;
});

function parseFormData(formData: FormData) {
  return saveFieldSchema.safeParse({
    ...Object.fromEntries(formData.entries()),
    options: JSON.parse(formData.get('options')?.toString() ?? '[]'),
  });
}
</script>
{#if selectedField}
  <div class="lg:sticky lg:top-[65px] h-[calc(100vh-65px)] bg-card flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-border">
      <h2 class="font-semibold">Properties</h2>
      <Button onclick={() => { editor.selectedIndex = -1 }} variant="ghost" size="icon" class="size-8">
        <XIcon class="h-4 w-4" />
      </Button>
    </div>
<form
    class="flex-1 p-4 overflow-y-auto flex flex-col"
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
                  editor.error = z.prettifyError(updates.error);
                  editor.loading = false;
                  setTimeout(() => { toast.error(editor.error?? 'There was a problem.'); }, 1000);
                  return;
                }
                console.log('optimistic update', updates.data);
                editor.updateField(updates.data);
              }

              return async ({ result }) => {
                if (result.type === 'failure' && previousState) {
                  // Revert on failure
                  editor.updateField(previousState);
                  console.error('There was an error saving the field.', result.data);
                  if (result.data?.message && typeof result.data.message === 'string' && result.data.message.length > 0)
                    editor.error = result.data.message
                  else editor.error = 'There was an error saving the field.';
                  setTimeout(() => { toast.error(editor.error?? 'There was a problem.'); }, 1000);
                }

                await applyAction(result);
                editor.loading = false;
              };
            }}
>
  <input type="hidden" name="fieldId" value={selectedField.id}>
  <Tabs bind:value={tabValue} class="flex-1 flex flex-col">
    <TabsList class="grid w-full grid-cols-2 mb-4">
      <TabsTrigger value="general">General</TabsTrigger>
      <TabsTrigger
          value="options"
          disabled={!selectedField.options || selectedField.options.length === 0}
      >
        Options
      </TabsTrigger>
    </TabsList>
    <div class="flex-1 overflow-y-auto">
    <TabsContent value="general" class="space-y-4 mt-0">
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
    <TabsContent value="options" class="space-y-4 mt-0">
      {#if fieldHasOptions(selectedField)}
        <EditFieldOptionList {areAllValid} bind:options={selectedField.options}/>
        <Button variant="outline" type="button" onclick={() => { selectedField.options.push({ id: crypto.randomUUID(), val: 'string', label: 'string' }); }}>
          <PlusIcon/>
          Add Option
        </Button>
      {/if}
    </TabsContent>
    </div>
  </Tabs>
  <!-- Save Button - Fixed at bottom -->
  <div class="pt-4 border-t border-border mt-auto">
    <Button type="submit" class="w-full" disabled={editor.isLoading || !areAllValid}>
      {#if editor.isSaved}
        Saved!
      {:else if editor.isLoading}
        Saving
      {:else}
        Save
      {/if}
    </Button>
  </div>
</form>
  </div>
{/if}