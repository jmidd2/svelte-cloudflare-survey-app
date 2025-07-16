<script lang="ts">
import { ArrowLeft, Calendar, Filter, Search } from '@lucide/svelte';
import { page } from '$app/state';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '$lib/components/ui/accordion';
import { Button } from '$lib/components/ui/button';
import { Card, CardContent, CardHeader } from '$lib/components/ui/card';
import { Input } from '$lib/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '$lib/components/ui/select';

const { data } = $props();
const survey = $derived(data.survey);
const responses = $derived(data.responses);
const fields = $derived(data.fields);
const lineLimit = 3;
let searchQuery = $state('');
const FormStates = {
    ALL: 'All',
    ACTIVE: 'Active',
    DRAFT: 'Draft',
    ARCHIVED: 'Archived',
};
let selectedStatus = $state<keyof typeof FormStates>(FormStates.ALL);
$inspect(data);

// Add filtered responses derived state
// Try using $state instead of $derived
let filteredResponses = $state([]);

// Use $effect to handle the filtering
$effect(() => {
    if (!searchQuery.trim()) {
        filteredResponses = responses.map(response => ({
        ...response,
      matchingData: response.data, // Show all data when no search
    }));
    return;
    }

    const query = searchQuery.toLowerCase().trim();

    const filtered = responses
        .map(response => {
      // Find only the matching field-value pairs
        const matchingData = response.data.filter((entry, index) => {
        const fieldLabel = fields[index]?.label?.toLowerCase() || '';
        const fieldLabelMatch = fieldLabel.includes(query);

        const submittedValue =
            entry.submitted?.value?.toString().toLowerCase() || '';
        const valueMatch = submittedValue.includes(query);

        return fieldLabelMatch || valueMatch;
    });
    
    return {
        ...response,
        matchingData,
        originalDataLength: response.data.length,
    };
}).filter(response => response.matchingData.length > 0); // Only keep responses that have matches

filteredResponses = filtered;
});

//TODO: move to utils file
function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
    });
}

function fieldLabelFromFieldId(fieldId: string) {
    const field = fields.find(field => field.id === fieldId);
    return field ? field.label : '...';
}



</script>

<div class="p-6 space-y-8">
  <div class="flex items-center gap-4 mb-4">
    <Button variant="ghost" size="sm" href={`/admin/${data.tenant?.slug}/forms`} class="gap-2">
      <ArrowLeft class="h-4 w-4" />
      Back to Forms
    </Button>
  </div>
    <div class="flex flex-col">
        <h1 class="text-3xl font-bold text-foreground">{survey.title}</h1>
        <p class="text-muted-foreground mt-1">{survey.description}</p>
    </div>
    <p class="text-xl font-semibold mb-4">Results</p>
    <Card class="mb-4">
        <CardContent class="px-6">
            <div class="flex flex-col sm:flex-row gap-4">
                <div class="relative flex-1">
                    <Search
                        class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
                    />
                    <Input
                        placeholder="Search results by question or answer..."
                        bind:value={searchQuery}
                        class="pl-10"
                    />
                </div>

                <Select type="single" bind:value={selectedStatus} >
                    <SelectTrigger class="w-full sm:w-48">
                        <Filter class="h-4 w-4 mr-2" />
                        {selectedStatus === FormStates.ALL ? "All" : selectedStatus}
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Archived">Archived</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </CardContent>
    </Card>
    <!-- This is the table version of the survey results. Needs to be fixed to scroll properly at all screen sizes -->
    <!-- <Card class="p-0 bg-background border-none">
        <CardContent class="p-0">
            <div class="max-w-[2250px] ">
                <div class="w-full overflow-x-auto rounded-xl border bg-card">
                    <div class="min-w-max">
                        <table class="w-full">
                            <thead class="bg-accent/50 text-lg">
                                <tr class="grid py-2" style="grid-template-columns: repeat({data.fields.length + 1}, minmax(350px, 1fr))">
                                    {#each data.fields as entry, index}
                                    {#if index === 0}
                                    <th class="text-left">Date/Time Submitted</th>
                                    {/if}
                                    <th class="text-left">{fieldLabelFromFieldId(entry.id)}</th>
                                    {/each}
                                </tr>
                            </thead>
                            <tbody>
                                {#each responses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) as response}
                                <tr class="grid text-center" style="grid-template-columns: repeat({data.fields.length + 1}, 1fr)">
                                    <td class="border-b flex justify-center py-2">
                                        <p class="py-1 text-gray-200 border px-2 rounded-lg bg-gray-500/30 inline-flex gap-x-2">
                                            <Calendar class="text-gray-300" />
                                            {formatDate(new Date(response.createdAt))}
                                        </p>
                                    </td>
                                    {#each data.fields as field}
                                    {@const submittedEntry = response.data.find(entry => entry.field.id === field.id)}
                                    <td class="border-b content-center {!submittedEntry && 'text-gray-500'}">
                                        {submittedEntry ? submittedEntry.submitted.value : 'N/A'}
                                    </td>
                                    {/each}
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card> -->
    
    
    <!-- Show results count when searching -->
    {#if searchQuery.length > 0}
    <p class="text-sm text-muted-foreground mb-4">
        Found {filteredResponses.length} result{filteredResponses.length !== 1
        ? "s"
            : ""} for "{searchQuery}"
        </p>

    <!-- Use filteredResponses instead of responses -->
    {#each filteredResponses as response}
        {@const maxLabelLength = Math.max(...fields.map(field => field.label.length))}
        {@const labelWidth = `${maxLabelLength * 0.6}rem`}
        <Card class="hover:shadow-lg transition-shadow space-y-4 mb-2">
            <CardHeader class="flex justify-between mb-3">
                <div
                    class="flex items-center gap-x-2 text-gray-200 border px-2 rounded-lg bg-gray-500/30 -ml-1"
                    >
                    <Calendar class="h-4 w-4" />
                    <p>{formatDate(response.createdAt)}</p>
                </div>
            </CardHeader>
                <CardContent>
                    <div class="flex flex-col items-center md:grid md:grid-cols-[auto_1fr] gap-2 mb-1" style="grid-template-columns: {labelWidth} auto;">
                        {#if response.matchingData.length > 0}
                            {#each response.matchingData as entry, index}
                                <p class="text-gray-400 truncate">{fieldLabelFromFieldId(entry.field.id)}:</p>
                                <p class="font-semibold">{entry.submitted.value}</p>
                            {/each}
                        {:else}
                            {#each response.data.slice(0, lineLimit) as entry, index}
                                <p class="text-gray-400 truncate">{fieldLabelFromFieldId(entry.field.id)}:</p>
                                <p class="font-semibold">{entry.submitted.value}</p>
                            {/each}
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
                        {/if}
                    </div>
                </CardContent>
            </Card>
        {:else}
            {#if searchQuery.length > 0}
                <Card class="p-8 text-center">
                    <p class="text-muted-foreground">
                    No results found for "{searchQuery}"
                    </p>
                </Card>
            {/if}
        {/each}
    {/if}
    {#if !searchQuery}
        {#each responses as response}
            {@const maxLabelLength = Math.max(...fields.map(field => field.label.length))}
            {@const labelWidth = `${maxLabelLength * 0.6}rem`}
            <Card class="hover:shadow-lg transition-shadow space-y-4 mb-4">
                <CardHeader class="flex justify-between mb-3">
                        <div
                        class="flex items-center gap-x-2 text-gray-200 border px-2 rounded-lg bg-gray-500/30 -ml-1"
                        >
                        <Calendar class="h-4 w-4" />
                        <p>{formatDate(response.createdAt)}</p>
                    </div>
                </CardHeader>
                <CardContent>
                    <div class="flex flex-col items-center md:grid md:grid-cols-[auto_1fr] gap-2 mb-1" style="grid-template-columns: {labelWidth} auto;">
                        {#each response.data.slice(0, lineLimit) as entry, index}
                            <p class="text-gray-400 truncate">{fieldLabelFromFieldId(entry.field.id)}:</p>
                            <p class="font-semibold">{entry.submitted.value}</p>
                        {/each}

                        {#if response.data.length > lineLimit}
                            <Accordion type="single" collapsible class="w-full col-span-2">
                                <AccordionItem value="additional-items">
                                    <AccordionTrigger
                                    class="py-2 px-0 text-gray-100 italic hover:no-underline"
                                    >
                                    +{response.data.length - lineLimit} more
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div class="grid gap-2 mb-1" style="grid-template-columns: {labelWidth} 1fr;">
                                            {#each response.data.slice(lineLimit) as entry, index}
                                            <p class="text-gray-400 truncate">
                                                {fieldLabelFromFieldId(entry.field.id)}:
                                            </p>
                                            <p class="font-semibold">{entry.submitted.value}</p>
                                            {/each}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        {/if}
                    </div>
                </CardContent>
            </Card>
        {/each}
    {/if}
</div>
