<script lang="ts">
import { isHtmlFormField } from '$lib';

const { data } = $props();

const survey = $derived(data.survey);
$inspect(data.survey);
</script>
<div>
    <h1>{survey.title}</h1>
    <p>{survey.description}</p>
    <form method="post">
        {#each survey.fields as field}
            <div class="p-2 flex flex-col">
                <label
                        for={field.label.toLowerCase().replaceAll(' ', '-')}>{field.label}</label>
                {#if isHtmlFormField(field.type)}
                    {#if (field.type === 'radio' || field.type === 'checkbox') && field.options}
                        {#each field.options as {val, label}, index}
                            <div>
                                <input type={field.type}
                                       id={`${field.label.toLowerCase().replaceAll(' ', '-')}-${index}`}
                                       name={field.label.toLowerCase().replaceAll(' ', '-')} value={val}>
                                <label for={`${field.label.toLowerCase().replaceAll(' ', '-')}-${index}`}>{label}</label>
                            </div>
                        {/each}
                        <!--{:else if field.type === 'checkbox'}-->
                        <!--    <div>-->
                        <!--        <input type="checkbox" id={`${field.label.toLowerCase().replaceAll(' ', '-')}`}-->
                        <!--               name={field.label.toLowerCase().replaceAll(' ', '-')}>-->
                        <!--        <label for={`${field.label.toLowerCase().replaceAll(' ', '-')}`}>{field.label}</label>-->
                        <!--    </div>-->
                    {:else if field.type === 'textarea'}
                        <textarea name={field.label.toLowerCase().replaceAll(' ', '-')}
                                  id={field.label.toLowerCase().replaceAll(' ', '-')}></textarea>
                    {:else if field.type === 'select'}
                        <select name={field.label.toLowerCase().replaceAll(' ', '-')}
                                id={field.label.toLowerCase().replaceAll(' ', '-')}>
                            {#if field.options}
                                {#each field.options as item}
                                    <option value={item.val}>{item.label}</option>
                                {/each}
                            {/if}
                        </select>
                    {:else}
                        <input name={field.label.toLowerCase().replaceAll(' ', '-')}
                               id={field.label.toLowerCase().replaceAll(' ', '-')} type={field.type}
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