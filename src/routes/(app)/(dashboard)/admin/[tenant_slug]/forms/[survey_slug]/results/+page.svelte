<script lang="ts">
import { Calendar } from "@lucide/svelte";

import { Card, CardContent, CardHeader } from "$lib/components/ui/card";
import {
    Accordion,
    AccordionTrigger,
    AccordionItem,
    AccordionContent,
} from "$lib/components/ui/accordion";

const { data } = $props();
const survey = $derived(data.survey);
const responses = $derived(data.responses);
const fields = $derived(data.fields);
const lineLimit = 3;
$inspect(data);

function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
    });
}
</script>

<div class="px-4 py-3">
    <h1 class="text-3xl font-bold text-foreground">{survey.title}</h1>
    <p class="mb-2">Results</p>
    {#each responses as response}
        <Card class="hover:shadow-lg transition-shadow gap-0 mb-2">
            <CardHeader class="flex justify-between mb-3">
                <div
                    class="flex items-center gap-x-2 text-gray-200 border px-2 rounded-lg bg-gray-500/30 -ml-1"
                >
                    <Calendar class="h-4 w-4" />
                    <p>{formatDate(response.createdAt)}</p>
                </div>
            </CardHeader>
            <CardContent>
            <div class="grid grid-cols-[auto_1fr] gap-2 mb-1">
                {#each response.data.slice(0, lineLimit) as entry, index}
                    <p class="font-semibold">{fields[index].label}:</p>
                    <p>{entry.submitted.value}</p>
                {/each}
            </div>
            {#if response.data.length > lineLimit}
                <Accordion type="single" collapsible class="w-full">
                    <AccordionItem value="additional-items">
                        <AccordionTrigger
                            class="py-2 px-0 text-gray-100 italic hover:no-underline"
                        >
                        +{response.data.length - lineLimit} more
                        </AccordionTrigger>
                        <AccordionContent>
                        <div class="grid grid-cols-[auto_1fr] gap-2 mb-1">
                            {#each response.data.slice(lineLimit) as entry, index}
                                <p class="font-semibold">
                                    {fields[index + lineLimit].label}:
                                </p>
                                <p>{entry.submitted.value}</p>
                            {/each}
                        </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            {/if}
            </CardContent>
        </Card>
    {/each}
</div>
