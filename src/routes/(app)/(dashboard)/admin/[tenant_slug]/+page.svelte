<script lang="ts">
import { page } from '$app/state';
import { EditCreateFormDialog, ShareDialog } from '$lib/components/dialogs';
import { Badge } from '$lib/components/ui/badge';
import { Button } from '$lib/components/ui/button';
import { Card, CardContent } from '$lib/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '$lib/components/ui/dropdown-menu';
import type { SelectForm } from '$lib/server/db/schema';
import { addFormSchema } from '$lib/validation-schema';
import { pageState } from '$stores/pageState.svelte';
import { formDialogManager } from '$stores/SurveyDialog.svelte';
import {
  ArrowRight,
  Calendar,
  ChartColumnIcon,
  Clock,
  Eye,
  FileText,
  MoreHorizontal,
  PencilIcon,
  Plus,
  ShareIcon,
  TrendingUp,
  Users,
} from '@lucide/svelte';
import { toast } from 'svelte-sonner';
import { superForm } from 'sveltekit-superforms';
import { zod4Client } from 'sveltekit-superforms/adapters';

const { data } = $props();

const tenantSlug = $derived(data.tenant.slug);
const tenantName = $derived(data.tenant.name);
const forms = $derived(data.forms);
const isAdmin = $derived(data.isAdmin);

const addForm = superForm(data.addForm, {
  id: 'add-form',
  resetForm: false,
  validators: zod4Client(addFormSchema),
  validationMethod: 'oninput',
  onError({ result }) {
    pageState.isLoading = false;
    toast.error(result.error.message);
  },
  onSubmit: () => {
    pageState.isLoading = true;
  },
  onResult: ({ result: { type, status } }) => {
    if (type === 'redirect' && status === 303) {
      pageState.isLoading = false;
      pageState.isSaved = true;
      formDialogManager.closeDialog();
      // toast.success('Form Saved!');
    }
    console.log('onResult', type, status);
  },
  onUpdated: ({ form: { valid, message, data } }) => {
    pageState.isLoading = false;
    formDialogManager.closeDialog();
    if (valid) {
      pageState.isSaved = true;
      // toast.success('Form Saved!');
    }

    if (!valid && message?.type === 'error' && message.text) {
      toast.error(message.text);
    }
  },
});

// Track which survey is being shared
let currentSurvey = $state<SelectForm | null>(null);

function openShareDialog(survey: SelectForm) {
  currentSurvey = survey;
  formDialogManager.openDialog('share');
}

function openAddDialog() {
  formDialogManager.openDialog('edit');
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Mock stats - replace with real data
const stats = $derived({
  totalForms: forms.length,
  totalSubmissions: 0, // Replace with actual data
  totalMembers: data.memberCount || 0,
  activeThisMonth: 0, // Replace with actual data
});

const recentActivity = $derived([
  // {
  //   type: 'form_created',
  //   title: 'New form created',
  //   description: 'Contact Form was created',
  //   time: '2 hours ago',
  //   icon: FileText,
  // },
  // {
  //   type: 'member_joined',
  //   title: 'New member joined',
  //   description: 'John Doe joined the organization',
  //   time: '1 day ago',
  //   icon: Users,
  // },
]);
</script>

<svelte:head>
  <title>Dashboard - {tenantName}</title>
</svelte:head>

<div class="p-6 space-y-8">
  <!-- Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 class="text-3xl font-bold text-foreground">Dashboard</h1>
      <p class="text-muted-foreground mt-1">
        Welcome back! Here's what's happening with {tenantName}.
      </p>
    </div>

    <!--{#if isAdmin}-->
    <!--  <Button onclick={openAddDialog} class="flex items-center gap-2">-->
    <!--    <Plus class="h-4 w-4" />-->
    <!--    Create Form-->
    <!--  </Button>-->
    <!--{/if}-->
  </div>

<!--  &lt;!&ndash; Stats Overview &ndash;&gt;-->
<!--  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">-->
<!--    <Card>-->
<!--      <CardContent class="p-6">-->
<!--        <div class="flex items-center justify-between">-->
<!--          <div>-->
<!--            <p class="text-sm font-medium text-muted-foreground">Total Forms</p>-->
<!--            <p class="text-3xl font-bold text-foreground">{stats.totalForms}</p>-->
<!--          </div>-->
<!--          <div class="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">-->
<!--            <FileText class="h-6 w-6 text-primary" />-->
<!--          </div>-->
<!--        </div>-->
<!--        <div class="mt-4 flex items-center text-sm">-->
<!--          <TrendingUp class="h-4 w-4 text-green-600 mr-1" />-->
<!--          <span class="text-green-600 font-medium">+2</span>-->
<!--          <span class="text-muted-foreground ml-1">this month</span>-->
<!--        </div>-->
<!--      </CardContent>-->
<!--    </Card>-->

<!--    <Card>-->
<!--      <CardContent class="p-6">-->
<!--        <div class="flex items-center justify-between">-->
<!--          <div>-->
<!--            <p class="text-sm font-medium text-muted-foreground">Total Submissions</p>-->
<!--            <p class="text-3xl font-bold text-foreground">{stats.totalSubmissions}</p>-->
<!--          </div>-->
<!--          <div class="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">-->
<!--            <ChartColumnIcon class="h-6 w-6 text-blue-600 dark:text-blue-400" />-->
<!--          </div>-->
<!--        </div>-->
<!--        <div class="mt-4 flex items-center text-sm">-->
<!--          <TrendingUp class="h-4 w-4 text-green-600 mr-1" />-->
<!--          <span class="text-green-600 font-medium">+12%</span>-->
<!--          <span class="text-muted-foreground ml-1">vs last month</span>-->
<!--        </div>-->
<!--      </CardContent>-->
<!--    </Card>-->

<!--    <Card>-->
<!--      <CardContent class="p-6">-->
<!--        <div class="flex items-center justify-between">-->
<!--          <div>-->
<!--            <p class="text-sm font-medium text-muted-foreground">Team Members</p>-->
<!--            <p class="text-3xl font-bold text-foreground">{stats.totalMembers}</p>-->
<!--          </div>-->
<!--          <div class="h-12 w-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">-->
<!--            <Users class="h-6 w-6 text-green-600 dark:text-green-400" />-->
<!--          </div>-->
<!--        </div>-->
<!--        <div class="mt-4 flex items-center text-sm">-->
<!--          <span class="text-muted-foreground">-->
<!--            <a href={`/admin/${tenantSlug}/members`} class="text-primary hover:underline">-->
<!--              Manage team →-->
<!--            </a>-->
<!--          </span>-->
<!--        </div>-->
<!--      </CardContent>-->
<!--    </Card>-->

<!--    <Card>-->
<!--      <CardContent class="p-6">-->
<!--        <div class="flex items-center justify-between">-->
<!--          <div>-->
<!--            <p class="text-sm font-medium text-muted-foreground">Active This Month</p>-->
<!--            <p class="text-3xl font-bold text-foreground">{stats.activeThisMonth}</p>-->
<!--          </div>-->
<!--          <div class="h-12 w-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">-->
<!--            <Clock class="h-6 w-6 text-purple-600 dark:text-purple-400" />-->
<!--          </div>-->
<!--        </div>-->
<!--        <div class="mt-4 flex items-center text-sm">-->
<!--          <span class="text-muted-foreground">Forms with recent activity</span>-->
<!--        </div>-->
<!--      </CardContent>-->
<!--    </Card>-->
<!--  </div>-->

  <div class="flex flex-col-reverse lg:grid lg:grid-cols-3 gap-8">
    <!-- Forms Section -->
    <div class="lg:col-span-2 space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-foreground">Recent Forms</h2>
        <Button variant="outline" href={`/admin/${tenantSlug}/forms`}>
          View All
        </Button>
      </div>

      {#if forms.length > 0}
        <div class="space-y-4">
          {#each forms.slice(0, 5) as survey}
            <Card class="hover:shadow-md transition-shadow">
              <CardContent class="px-6">
                <div class="flex items-start justify-between">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-2">
                      <h3 class="text-lg font-semibold text-foreground truncate">
                        {survey.title}
                      </h3>
                      <Badge variant="secondary" class="text-xs">
                        {survey.status || 'Active'}
                      </Badge>
                    </div>

                    {#if survey.description}
                      <p class="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {survey.description}
                      </p>
                    {/if}

                    <div class="flex items-center gap-4 text-sm text-muted-foreground">
                      <div class="flex items-center gap-1">
                        <Calendar class="h-4 w-4" />
                        <span>Updated {formatDate(survey.updatedAt)}</span>
                      </div>
                      <div class="flex items-center gap-1">
                        <Eye class="h-4 w-4" />
                        <span>0 responses</span> <!-- Replace with actual data -->
                      </div>
                    </div>
                  </div>

                  <div class="flex flex-col gap-2 ml-4">
                    <Button variant="secondary" size="sm" href={`/admin/${tenantSlug}/forms/${survey.slug}`}>
                      <PencilIcon class="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="default" size="sm" onclick={() => openShareDialog(survey)}>
                      <ShareIcon class="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button variant="outline" size="sm" href={`/admin/${tenantSlug}/forms/${survey.slug}`}>
                      <a class="inline-flex items-center" href={`/admin/${tenantSlug}/forms/${survey.slug}/results`}>
                        <ChartColumnIcon class="h-4 w-4 mr-2" />
                        View Results
                      </a>
                    </Button>

<!--                    <DropdownMenu>-->
<!--                      <DropdownMenuTrigger>-->
<!--                        <Button variant="ghost" size="sm" class="h-8 w-8 p-0">-->
<!--                          <MoreHorizontal class="h-4 w-4" />-->
<!--                        </Button>-->
<!--                      </DropdownMenuTrigger>-->
<!--                      <DropdownMenuContent align="start">-->
<!--                        <DropdownMenuItem class="hover:cursor-pointer" onclick={() => openShareDialog(survey)}> -->
<!--                          <ShareIcon class="h-4 w-4 mr-2" />-->
<!--                          Share-->
<!--                        </DropdownMenuItem>-->
<!--                        <DropdownMenuItem>-->
<!--                          <a class="inline-flex items-center" href={`/admin/${tenantSlug}/forms/${survey.slug}/results`}> -->
<!--                          <ChartColumnIcon class="h-4 w-4 mr-2" />-->
<!--                          View Results-->
<!--                          </a>-->
<!--                        </DropdownMenuItem>-->
<!--                      </DropdownMenuContent>-->
<!--                    </DropdownMenu>-->
                  </div>
                </div>
              </CardContent>
            </Card>
          {/each}
        </div>
      {:else}
        <Card>
          <CardContent class="p-8 text-center">
            <FileText class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 class="text-lg font-medium text-foreground mb-2">No forms yet</h3>
            <p class="text-muted-foreground mb-4">
              Get started by creating your first form to collect responses from your audience.
            </p>
            {#if isAdmin}
              <Button href={`/admin/${tenantSlug}/forms/new`}>
                <Plus class="h-4 w-4 mr-2" />
                Create Your First Form
              </Button>
            {/if}
          </CardContent>
        </Card>
      {/if}
    </div>

    <!-- Activity Sidebar -->
    <div class="space-y-6">

      <!-- Quick Actions -->
      <div>
        <h2 class="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
        <Card>
          <CardContent class="px-4 space-y-3">
            <Button variant="outline" class="w-full justify-start" onclick={openAddDialog}>
              <Plus class="h-4 w-4 mr-2" />
              Create New Form
            </Button>
            <!-- TODO: Change to invite members -->
            <Button variant="outline" class="w-full justify-start" href={`/admin/${tenantSlug}/members`}>
              <Users class="h-4 w-4 mr-2" />
              Manage Members
            </Button>
            <Button variant="outline" class="w-full justify-start" disabled>
              <ChartColumnIcon class="h-4 w-4 mr-2" />
              View Analytics
            </Button>
          </CardContent>
        </Card>
      </div>

<!--      <div>-->
<!--        <h2 class="text-xl font-semibold text-foreground mb-4">Recent Activity</h2>-->

<!--        {#if recentActivity.length > 0}-->
<!--          <Card>-->
<!--            <CardContent class="p-0">-->
<!--              <div class="divide-y divide-border">-->
<!--                {#each recentActivity as activity}-->
<!--                  <div class="p-4 flex items-start gap-3">-->
<!--                    <div class="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">-->
<!--                      <activity.icon class="h-4 w-4 text-primary" />-->
<!--                    </div>-->
<!--                    <div class="flex-1 min-w-0">-->
<!--                      <p class="text-sm font-medium text-foreground">-->
<!--                        {activity.title}-->
<!--                      </p>-->
<!--                      <p class="text-sm text-muted-foreground">-->
<!--                        {activity.description}-->
<!--                      </p>-->
<!--                      <p class="text-xs text-muted-foreground mt-1">-->
<!--                        {activity.time}-->
<!--                      </p>-->
<!--                    </div>-->
<!--                  </div>-->
<!--                {/each}-->
<!--              </div>-->
<!--            </CardContent>-->
<!--          </Card>-->
<!--        {:else}-->
<!--          <Card>-->
<!--            <CardContent class="p-8 text-center">-->
<!--              <Clock class="h-8 w-8 text-muted-foreground mx-auto mb-2" />-->
<!--              <p class="text-sm text-muted-foreground">No recent activity</p>-->
<!--            </CardContent>-->
<!--          </Card>-->
<!--        {/if}-->
<!--      </div>-->

    </div>
  </div>
</div>

<!-- Share Dialog for current survey -->
{#if currentSurvey}
  <ShareDialog survey={currentSurvey} />
{/if}

<EditCreateFormDialog editForm={addForm} action={`${page.url.pathname}/forms?/add-form`}></EditCreateFormDialog>
