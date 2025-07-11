<script lang="ts">

import {Card, CardContent} from '$lib/components/ui/card';


const { data } = $props();
const survey = $derived(data.survey);
const responses = $derived(data.responses);
const fields = $derived(data.fields);
$inspect(data);

</script>
<div class="px-4 py-3">
<h1 class="text-3xl font-bold text-foreground">{survey.title}</h1>
<p class="mb-2">Results</p>
{#each responses as response}
    <Card class="hover:shadow-lg transition-shadow gap-0 mb-2">
        <CardContent>

            {#each response.data as entry, index}
            <div class="grid grid-cols-[auto_1fr] gap-2 mb-1">
                <p class="font-semibold">{fields[index].label}:</p>
                <p>{entry.submitted.value}</p>
            </div>
            {/each}
        </CardContent>
    </Card>
{/each}
</div>