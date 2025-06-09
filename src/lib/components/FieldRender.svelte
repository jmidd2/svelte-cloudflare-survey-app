<script lang="ts">
import { Checkbox } from '$lib/components/ui/checkbox';
import { Input } from '$lib/components/ui/input';
import { Label } from '$lib/components/ui/label';
import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from '$lib/components/ui/select';
import { Textarea } from '$lib/components/ui/textarea';
import type { SelectFormField } from '$lib/server/db/schema';
import { fieldHasOptions } from '$lib/utils';
export interface FieldRendererProps {
  field: SelectFormField;
  value?: HTMLInputElement['value'] | HTMLTextAreaElement['value'];
  disabled?: boolean;
}
let { field, disabled, value }: FieldRendererProps = $props();
</script>

{#snippet textField({ field, value, disabled }: FieldRendererProps)}
  <Input
      type={field.type}
      {value}
      placeholder={field.placeholder}
      id={field.id}
      name={field.id}
      {disabled}
  />
{/snippet}

<!-- Textarea -->
{#snippet textareaField({ field, value, disabled }: FieldRendererProps)}
  <Textarea
      id={field.id}
      name={field.id}
      placeholder={field.placeholder}
      {value}
      {disabled}
  />
{/snippet}

<!-- Select dropdown -->
{#snippet selectField({ field, value, disabled }: FieldRendererProps)}
  <Select type="single" {value} name={field.id} {disabled}>
    <SelectTrigger class="w-full">
      {value ?? 'Select an option'}
    </SelectTrigger>
    <SelectContent>
      {#if fieldHasOptions(field)}
        {#each field.options as opt (opt.val)}
          <SelectItem value={opt.label} label={opt.label} />
        {/each}
      {:else}
        <SelectLabel>No Options</SelectLabel>
      {/if}
    </SelectContent>
  </Select>
{/snippet}

<!-- Radio group -->
{#snippet radioField({ field, value, disabled }: FieldRendererProps)}
  <RadioGroup {value} name={field.id} {disabled}>
    {#if fieldHasOptions(field)}
      {#each field.options as opt, index (opt.val)}
        <div class="flex items-center space-x-2">
          <RadioGroupItem
              class="peer"
              id={`${field.id}-${index}-${opt.val}`}
              value={opt.val}
              {disabled}
          />
          <Label class="peer-disabled:opacity-75" for={`${field.id}-${index}-${opt.val}`}>
            {opt.label}
          </Label>
        </div>
      {/each}
    {:else}
      <span>No options</span>
    {/if}
  </RadioGroup>
{/snippet}

<!-- Checkbox group -->
{#snippet checkboxField({ field, disabled }: FieldRendererProps)}
  <div class="grid gap-3">
    {#if fieldHasOptions(field)}
      {#each field.options as opt, index (opt.val)}
        <div class="flex items-center space-x-2">
          <Checkbox
              class="peer"
              id={`${field.id}-${index}-${opt.val}`}
              name={`${field.id}[]`}
              value={opt.val}
              {disabled}
          />
          <Label
              for={`${field.id}-${index}-${opt.val}`}
              class="peer-disabled:opacity-75"
          >
            {opt.label}
          </Label>
        </div>
      {/each}
    {:else}
      <span>No options</span>
    {/if}
  </div>
{/snippet}

<!-- Export snippets for use in other components -->
  {#if field.type === 'textarea'}
    {@render textareaField({ field, value, disabled })}
  {:else if field.type === 'select'}
    {@render selectField({ field, value, disabled })}
  {:else if field.type === 'radio'}
    {@render radioField({ field, value, disabled })}
  {:else if field.type === 'checkbox'}
    {@render checkboxField({ field, disabled })}
  {:else}
    {@render textField({ field, value, disabled })}
  {/if}
