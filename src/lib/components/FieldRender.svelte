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
  id?: string;
  name?: string;
}
let { field, disabled, value, id, name }: FieldRendererProps = $props();
</script>

{#snippet textField({ field, value, disabled, id, name }: FieldRendererProps)}
  <Input
      type={field.type}
      {value}
      placeholder={field.placeholder}
      id={id ?? field.id}
      name={name ?? field.id}
      {disabled}
      required={field.required}
  />
{/snippet}

<!-- Textarea -->
{#snippet textareaField({ field, value, disabled, id, name }: FieldRendererProps)}
  <Textarea
      id={id ?? field.id}
      name={name ?? field.id}
      placeholder={field.placeholder}
      {value}
      {disabled}
      required={field.required}
  />
{/snippet}

<!-- Select dropdown -->
{#snippet selectField({ field, value, disabled, id, name }: FieldRendererProps)}
  <Select type="single" {value} name={name ?? field.id} {disabled} required={field.required}>
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
{#snippet radioField({ field, value, disabled, id, name }: FieldRendererProps)}
  <RadioGroup {value} name={name ?? field.id} {disabled} required={field.required}>
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
{#snippet checkboxField({ field, disabled, id, name }: FieldRendererProps)}
  <div class="grid gap-3">
    {#if fieldHasOptions(field)}
      {#each field.options as opt, index (opt.val)}
        <div class="flex items-center space-x-2">
          <Checkbox
              class="peer"
              required={field.required}
              id={id ?? `${field.id}-${index}-${opt.val}`}
              name={name ?? `${field.id}[]`}
              value={opt.val}
              {disabled}
          />
          <Label
              for={id ?? `${field.id}-${index}-${opt.val}`}
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
    {@render textareaField({ field, value, disabled, id, name })}
  {:else if field.type === 'select'}
    {@render selectField({ field, value, disabled, id, name })}
  {:else if field.type === 'radio'}
    {@render radioField({ field, value, disabled, id, name })}
  {:else if field.type === 'checkbox'}
    {@render checkboxField({ field, disabled, id, name })}
  {:else}
    {@render textField({ field, value, disabled, id, name })}
  {/if}
