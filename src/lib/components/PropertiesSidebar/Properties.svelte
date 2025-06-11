<script lang="ts">
import { applyAction } from '$app/forms';
import { enhance } from '$app/forms';
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
import { PlusIcon, XIcon } from '@lucide/svelte';

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
<form
    class="border-l h-full bg-muted/20 p-4 overflow-y-auto grid grid-rows-[auto_1fr_auto]"
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
  <h2 class="font-semibold mb-4 flex items-center justify-between">Properties<Button onclick={() => { editor.selectedIndex = -1 }} variant="ghost" size="icon" class="size-8"><XIcon /></Button></h2>
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
  <div class="mt-4">
    <Button type="submit" class="w-full" disabled={editor.isLoading || !areAllValid}>
      {#if editor.isSaved}
        Saved!
      {:else if editor.isLoading}
        Saving
      {:else}
        Save
      {/if}
      <!--{isLoading ? 'Saving...' : 'Save'}-->
    </Button>
  </div>
</form>
{/if}