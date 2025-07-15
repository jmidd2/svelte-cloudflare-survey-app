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
  console.log('Effect running - searchQuery:', searchQuery);

  if (!searchQuery.trim()) {
    console.log('No search query, using all responses');
    filteredResponses = responses.map(response => ({
      ...response,
      matchingData: response.data, // Show all data when no search
    }));
    return;
  }

  console.log('Filtering with query:', searchQuery);
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
    })
    .filter(response => response.matchingData.length > 0); // Only keep responses that have matches
  console.log(filtered);
  console.log('Setting filtered results:', filtered.length);
  filteredResponses = filtered;
});

// Additional debug effect
$effect(() => {
  console.log(
    'Debug effect - filteredResponses length:',
    filteredResponses.length
  );
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

    <!-- Show results count when searching -->
    {#if searchQuery.length > 0}
        <p class="text-sm text-muted-foreground mb-4">
            Found {filteredResponses.length} result{filteredResponses.length !== 1
            ? "s"
            : ""} for "{searchQuery}"
        </p>

    <!-- Use filteredResponses instead of responses -->
    {#each filteredResponses as response}
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
                    <div class="grid grid-cols-[auto_1fr] gap-2 mb-1 truncate">
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
                    <div class="grid gap-2 mb-1" style="grid-template-columns: {labelWidth} 1fr;">
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
