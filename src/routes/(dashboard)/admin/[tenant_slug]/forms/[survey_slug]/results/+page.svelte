<script lang="ts">
import { ArrowLeft, Calendar, Filter, Search } from '@lucide/svelte';
import { page } from '$app/state';
import { Button } from '$lib/components/ui/button';
import { Card, CardContent, CardHeader } from '$lib/components/ui/card';
import { Input } from '$lib/components/ui/input';
import { Checkbox } from '$lib/components/ui/checkbox';
import PopoverTrigger from '$lib/components/ui/popover/popover-trigger.svelte';
import PopoverContent from '$lib/components/ui/popover/popover-content.svelte';
import { Popover } from '$lib/components/ui/popover';
  import { Separator } from '$lib/components/ui/separator/index.js';
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '$lib/components/ui/dialog/index.js';

const { data } = $props();
console.log(data)
const survey = $derived(data.survey);
const fields = $derived(data.responses || []); // Assuming the array of fields is in data.responses
const LATEST_LIMIT = 3;

let searchQuery = $state('');
let selectedFields = $state(new Set(fields.map(field => field.id))); // All fields selected by default

// Transform the data structure to get all unique submissions
const allSubmissions = $derived.by(() => {
    const submissionMap = new Map();
    
    fields.forEach(field => {
        field.fieldSubmissions?.forEach(submission => {
            const submissionId = submission.submissionId;
            if (!submissionMap.has(submissionId)) {
                submissionMap.set(submissionId, {
                    id: submissionId,
                    createdAt: submission.formSubmission.createdAt,
                    fields: new Map()
                });
            }
            
            submissionMap.get(submissionId).fields.set(field.id, {
                field: field,
                data: submission.data
            });
        });
    });
    
    return Array.from(submissionMap.values());
});

// Filter submissions based on search query and selected fields
const filteredSubmissions = $derived.by(() => {
    if (!searchQuery.trim() && selectedFields.size === fields.length) {
        return allSubmissions;
    }

    const query = searchQuery.toLowerCase().trim();

    return allSubmissions.filter(submission => {
        // Check if submission has any data for selected fields
        const hasSelectedFieldData = Array.from(selectedFields).some(fieldId => 
            submission.fields.has(fieldId)
        );
        
        if (!hasSelectedFieldData) return false;

        // If no search query, return all submissions with selected field data
        if (!query) return true;

        // Search within the submission data
        return Array.from(submission.fields.values()).some(fieldData => {
            if (!selectedFields.has(fieldData.field.id)) return false;
            
            const fieldLabel = fieldData.field.label?.toLowerCase() || '';
            const fieldValue = fieldData.data?.toString().toLowerCase() || '';
            
            return fieldLabel.includes(query) || fieldValue.includes(query);
        });
    });
});

function formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function getFieldValue(data: any, fieldType: string) {
    if (!data) return '-';
    
    switch (fieldType) {
        case "checkbox":
            // Assuming data could be an array or comma-separated string
            if (Array.isArray(data)) {
                return data.join(', ');
            }
            return data.toString();
        case "yes-no":
            return data ? "Yes" : "No";
        case "date":
            return formatDate(new Date(+data));
        default:
            return typeof data === "string" ? 
                (data.slice(0,1).toUpperCase() + data.slice(1)) : 
                data?.toString() || '-';
    }
}

function toggleFieldSelection(fieldId: string) {
    if (selectedFields.has(fieldId)) {
        selectedFields.delete(fieldId);
    } else {
        selectedFields.add(fieldId);
    }
    selectedFields = new Set(selectedFields); // Trigger reactivity
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
        <h1 class="text-3xl font-bold text-foreground">{survey.title} - Results</h1>
        <p class="text-muted-foreground mt-1">{survey.description}</p>
    </div>
    
    
    <Card class="mb-4 max-w-[50rem] mx-auto">
        <CardContent class="px-6">
            <div class="flex flex-col sm:flex-row gap-4">
                <div class="relative flex-1">
                    <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search results by question or answer..."
                        bind:value={searchQuery}
                        class="pl-10"
                    />
                </div>

                <Popover>
                    <PopoverTrigger class="w-full sm:w-48 inline-flex items-center justify-center gap-2 bg-background border border-input rounded-md px-3 py-2 text-sm">
                        <Filter class="h-4 w-4" />
                        Select Questions ({selectedFields.size}/{fields.length})
                    </PopoverTrigger>
                    <PopoverContent  align="start" class="w-60">
                        <div class="space-y-2">
                            <div class="font-medium text-sm mb-3">Select questions to display:</div>
                            {#each fields as field}
                                <div class="flex items-center space-x-2">
                                    <Checkbox 
                                        checked={selectedFields.has(field.id)}
                                        onCheckedChange={() => toggleFieldSelection(field.id)}
                                    />
                                    <button type="button" class="text-sm text-start cursor-pointer flex-1" onclick={() => toggleFieldSelection(field.id)}>
                                        {field.label}
                                    </button>
                                </div>
                            {/each}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </CardContent>
    </Card>

    {#if searchQuery.length > 0}
        <p class="text-sm text-muted-foreground mb-4 text-center">
            Found {filteredSubmissions.length} result{filteredSubmissions.length !== 1 ? "s" : ""} 
            {#if searchQuery}for "{searchQuery}"{/if}
        </p>
    {/if}

    <!-- Display results in a grid of tables, one per selected field    -->
    <div class="mx-auto max-w-[50rem] grid lg:grid-cols-1 sm:grid-cols-1 xl:grid-cols-1 gap-4 max-h-[calc(100vh-404px)]" >
        {#each fields.filter(field => selectedFields.has(field.id)) as field, i}
            <Dialog >
                <DialogTrigger>
                    <Card class=" {i === fields.length -1 ? 'mb-4' : ''}">
                        <CardHeader class=" py-1">
                            <h3 class="font-medium text-center">{field.label}</h3>
                </CardHeader>
                <!-- <Separator /> -->
                <CardContent class="p-0">
                    <div class="max-h-96">
                        <div class="grid grid-cols-[1fr_auto_1fr]">
                            <div class=" content-center text-center text-2xl">
                                <div class="inline-flex items-end gap-x-2">{searchQuery ? filteredSubmissions.length : field.fieldSubmissions.length}
                                    {#if (searchQuery && filteredSubmissions.length > 1) || (!searchQuery && field.fieldSubmissions.length > 1)}
                                        <p class="text-sm text-gray-400">submissions</p>
                                    {:else}
                                        <p class="text-sm text-gray-400">submission</p>
                                    {/if}
                                </div>
                            </div>
                            <Separator orientation="vertical"/>
                            <div>
                                <p class="mb-4 italic text-sm">Latest Responses:</p>
                                {#each filteredSubmissions
                                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                        .filter(submission => submission.fields.get(field.id))
                                        .slice(0, LATEST_LIMIT) as submission}
                                        {@const fieldData = submission.fields.get(field.id)}
                                    
                                        <div class=" grid grid-cols-[auto_1fr] mx-4 mb-2 pb-2 not-last:border-b">
                                            <p class="inline-flex items-center gap-x-2 px-2 rounded-lg border bg-accent/50 text-white/50"><Calendar class="w-4 h-4"/>{formatDate(submission.createdAt)}</p>
                                            <p class="p-2 text-sm font-medium ">
                                                {getFieldValue(fieldData.data, field.type)}
                                            </p>
                                        </div>
                                {/each}
                                {#if filteredSubmissions.filter(s => s.fields.has(field.id)).length === 0}
                                <div>
                                    <p colspan="2" class="p-4 text-center text-muted-foreground text-sm">
                                        No responses found
                                    </p>
                                </div>
                                {/if}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>
                    <h3 class="font-medium text-center">{field.label}</h3>
                </DialogTitle>
            </DialogHeader>
            <div class="w-full border rounded-xl">
                <table class="w-full">
                    <thead class="bg-accent">
                        <tr class="text-center">
                            <th>#</th>
                            <th>Answer</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each field.fieldSubmissions.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)) as entry, index}
                        <tr class="text-center">
                            <td class="border-r border-b">{index + 1}</td>
                            <td class="border-b ">{field.type === 'date'? formatDate(+entry.data) : entry.data}</td>
                        </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </DialogContent>
            </Dialog>
        {/each}
    </div>

    {#if filteredSubmissions.length === 0 && (searchQuery.length > 0 || selectedFields.size < fields.length)}
        <Card class="p-8 text-center max-w-[50rem] mx-auto">
            <p class="text-muted-foreground">
                No results found. Try adjusting your search or field selection.
            </p>
        </Card>
    {/if}
</div>