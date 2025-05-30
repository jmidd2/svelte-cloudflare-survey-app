<script lang="ts">
import { enhance } from '$app/forms';
import type { SelectFormFieldWithHash } from '$lib/server/db/schema';
import { isHtmlFormField } from '$lib/utils';

const { data, form } = $props();

const survey = $derived(data.survey);
$inspect(data.survey);
$inspect(form);

function createSlug({ label, hash }: SelectFormFieldWithHash) {
  console.log(label, hash);
  return `${label.toLowerCase().replaceAll(' ', '-')}-${hash}`;
}
</script>
<div>
    <h1>{survey.title}</h1>
    <p>{survey.description}</p>
    {#if form}
        <div class:bg-red-700={!form.success} class:bg-green-600={form.success} class="my-2 rounded-xl px-4 py-2">
            {#if form.success}
                Form submitted!
            {:else}
                {#if form.status === 404}
                    Survey not found
                {:else if form.status === 400}
                    Please fill out all required fields
                {/if}
            {/if}
        </div>
    {/if}
    <form method="post" use:enhance>
        {#each survey.fields as field}
            <div class="p-2 flex flex-col">
                <label class="font-lg"
                       for={createSlug(field)}>{field.label}
                    {#if field.required}<span class="text-red-500 font-bold">*</span>{/if}
                </label>
                {#if isHtmlFormField(field.type)}
                    {#if (field.type === 'radio' || field.type === 'checkbox') && field.options}
                        {#each field.options as {val, label}, index}
                            <div>
                                <input type={field.type}
                                       required={field.required}
                                       id={`${createSlug(field)}-${index}`}
                                       name={createSlug(field)} value={val}>
                                <label for={`${createSlug(field)}-${index}`}>{label}</label>
                            </div>
                        {/each}
                        <!--{:else if field.type === 'checkbox'}-->
                        <!--    <div>-->
                        <!--        <input type="checkbox" id={`${field.label.toLowerCase().replaceAll(' ', '-')}`}-->
                        <!--               name={field.label.toLowerCase().replaceAll(' ', '-')}>-->
                        <!--        <label for={`${field.label.toLowerCase().replaceAll(' ', '-')}`}>{field.label}</label>-->
                        <!--    </div>-->
                    {:else if field.type === 'textarea'}
                        <textarea name={createSlug(field)}
                                  required={field.required}
                                  id={createSlug(field)}></textarea>
                    {:else if field.type === 'select'}
                        <select name={createSlug(field)}
                                required={field.required}
                                id={createSlug(field)}>
                            {#if field.options}
                                {#each field.options as item}
                                    <option value={item.val}>{item.label}</option>
                                {/each}
                            {/if}
                        </select>
                    {:else}
                        <input name={createSlug(field)}
                               required={field.required}
                               id={createSlug(field)} type={field.type}
                               placeholder={field.placeholder}/>
                    {/if}
                {/if}
            </div>
        {/each}
        <div>
            <button type="submit" class="bg-spark-primary py-2 px-3 rounded">Submit</button>
        </div>
    </form>
</div>

<style>
    input, select, textarea {
        color: black;
    }
</style>