<script lang="ts">
import { ShareDialog } from '$lib/components/dialogs';
import { Badge } from '$lib/components/ui/badge';
import { Button } from '$lib/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '$lib/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '$lib/components/ui/dropdown-menu';
import { Input } from '$lib/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '$lib/components/ui/select';
import type { SelectForm } from '$lib/server/db/schema';
import { surveyDialogManager } from '$stores/SurveyDialog.svelte';
import {
  Calendar,
  ChartColumnIcon,
  Eye,
  FileText,
  Filter,
  MoreHorizontal,
  PencilIcon,
  Plus,
  Search,
  ShareIcon,
} from '@lucide/svelte';

const { data } = $props();

const tenantSlug = $derived(data.tenant.slug);
const tenantName = $derived(data.tenant.name);
const forms = $derived(data.forms);
const isAdmin = $derived(data.isAdmin);

// Track which survey is being shared
let currentSurvey = $state<SelectForm | null>(null);
let searchQuery = $state('');
let selectedStatus = $state('all');

function openShareDialog(survey: SelectForm) {
  currentSurvey = survey;
  surveyDialogManager.openDialog('share');
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Filter forms based on search and status
const filteredForms = $derived.by(() => {
  let filtered = forms;

  if (searchQuery) {
    filtered = filtered.filter(
      form =>
        form.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        form.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  if (selectedStatus !== 'all') {
    filtered = filtered.filter(
      form => (form.status || 'active') === selectedStatus
    );
  }

  return filtered;
});
</script>

<svelte:head>
  <title>Forms - {tenantName}</title>
</svelte:head>

<div class="p-6 space-y-6">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 class="text-3xl font-bold text-foreground">Forms</h1>
      <p class="text-muted-foreground mt-1">
        Create and manage forms for {tenantName}
      </p>
    </div>

    {#if isAdmin}
      <Button href={`/admin/${tenantSlug}/forms/new`} class="flex items-center gap-2">
        <Plus class="h-4 w-4" />
        Create Form
      </Button>
    {/if}
  </div>

  <!-- Search and Filter -->
  <Card>
    <CardContent class="p-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="relative flex-1">
          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
              placeholder="Search forms by title or description..."
              bind:value={searchQuery}
              class="pl-10"
          />
        </div>

        <Select bind:value={selectedStatus}>
          <SelectTrigger class="w-full sm:w-48">
            <Filter class="h-4 w-4 mr-2" />
            {selectedStatus === 'all' ? 'All Status' : selectedStatus}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CardContent>
  </Card>

  <!-- Forms Grid -->
  {#if filteredForms?.length > 0}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each filteredForms as survey}
        <Card class="hover:shadow-lg transition-shadow group">
          <CardHeader class="pb-4">
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <CardTitle class="text-lg truncate mb-1">{survey.title}</CardTitle>
                <div class="flex items-center gap-2">
                  <Badge variant="secondary" class="text-xs">
                    {survey.status || 'Active'}
                  </Badge>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button variant="ghost" size="sm" class="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onclick={() => openShareDialog(survey)}>
                    <ShareIcon class="h-4 w-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  <DropdownMenuItem href={`/admin/${tenantSlug}/forms/${survey.slug}/results`}>
                    <ChartColumnIcon class="h-4 w-4 mr-2" />
                    View Results
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem class="text-destructive">
                    Delete Form
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent class="pt-0">
            {#if survey.description}
              <CardDescription class="text-sm mb-4 line-clamp-2">
                {survey.description}
              </CardDescription>
            {/if}

            <div class="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <div class="flex items-center gap-1">
                <Calendar class="h-4 w-4" />
                <span>{formatDate(survey.updatedAt)}</span>
              </div>
              <div class="flex items-center gap-1">
                <Eye class="h-4 w-4" />
                <span>0 responses</span> <!-- Replace with actual data -->
              </div>
            </div>

            <Button
                href={`/admin/${tenantSlug}/forms/${survey.slug}`}
                class="w-full"
                variant="outline"
            >
              <PencilIcon class="w-4 h-4 mr-2" />
              Edit Form
            </Button>
          </CardContent>
        </Card>
      {/each}
    </div>
  {:else}
    <Card>
      <CardContent class="p-12 text-center">
        <FileText class="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 class="text-xl font-medium text-foreground mb-2">
          {searchQuery || selectedStatus !== 'all' ? 'No forms found' : 'No forms yet'}
        </h3>
        <p class="text-muted-foreground mb-6">
          {searchQuery || selectedStatus !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating your first form to collect responses from your audience.'}
        </p>
        {#if isAdmin && !searchQuery && selectedStatus === 'all'}
          <Button href={`/admin/${tenantSlug}/forms/new`}>
            <Plus class="h-4 w-4 mr-2" />
            Create Your First Form
          </Button>
        {/if}
      </CardContent>
    </Card>
  {/if}
</div>

<!-- Share Dialog for current survey -->
{#if currentSurvey}
  <ShareDialog survey={currentSurvey} />
{/if}
