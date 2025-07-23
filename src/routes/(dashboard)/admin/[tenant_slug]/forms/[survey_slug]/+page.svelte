<script lang="ts">
import {
  ChartColumnIcon,
  Menu,
  PencilIcon,
  SettingsIcon,
  ShareIcon,
  XIcon,
} from '@lucide/svelte';
import { slide } from 'svelte/transition';
import { toast } from 'svelte-sonner';
import { superForm } from 'sveltekit-superforms';
import { zod4Client } from 'sveltekit-superforms/adapters';
import { page } from '$app/state';
import {
  EditCreateFormDialog,
  SettingsDialog,
  ShareDialog,
} from '$lib/components/dialogs';
import { FormFieldList } from '$lib/components/FormFieldList';
import { PropertiesSidebar } from '$lib/components/PropertiesSidebar';
import { ToolboxSidebar } from '$lib/components/ToolboxSidebar';
import { Button } from '$lib/components/ui/button';
import { formDialogManager } from '$lib/stores/SurveyDialog.svelte.js';
import { editFormSchema } from '$lib/validation-schema';
import { pageState } from '$stores/pageState.svelte';
import { SurveyEditor, setSurveyEditor } from '$stores/survey-editor.svelte';
import type { PageProps } from './$types';

const { data, form }: PageProps = $props();

const fieldsArray = $derived(Object.values(data.fields).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)));
// Create the survey editor instance
const editor = new SurveyEditor(data.survey, fieldsArray);
setSurveyEditor(editor);

$effect(() => {
  if (!pageState) return;
  if (editor.isLoading !== null) pageState.isLoading = editor.isLoading;
});

$effect(() => {
  if (!pageState) return;
  pageState.isSaved = editor.isSaved;
});

// Update editor data when server data changes
$effect(() => {
  editor.fields = [...data.fields];
  editor.survey = data.survey;
});

const editForm = superForm(data.editForm, {
  id: 'editForm',
  resetForm: false,
  validators: zod4Client(editFormSchema),
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
    if (valid) {
      formDialogManager.closeDialog();
      pageState.isSaved = true;
      // toast.success('Form Saved!');
    }

    if (!valid && message?.type === 'error' && message.text) {
      toast.error(message.text);
    }
  },
});

const selectedField = $derived(editor.selectedField);

function openEditDialog() {
  formDialogManager.openDialog('edit');
}

function openShareDialog() {
  formDialogManager.openDialog('share');
}

function openSettingsDialog() {
  formDialogManager.openDialog('settings');
}

let mobileToolboxShowing = $state(false);

$effect(() => {
  if (selectedField) mobileToolboxShowing = false;
});

import { onClickOutside } from 'runed';

let propertiesContainer = $state<HTMLElement>()!;

onClickOutside(
  () => propertiesContainer,
  () => {
    editor.selectedIndex = -1;
  },
  { immediate: false }
);
</script>

<svelte:head>
  <title>Edit Form - {editor.survey?.title}</title>
</svelte:head>

<!-- 2-Column Layout that works within existing admin layout -->
<div class="flex h-full bg-background overflow-hidden max-h-[calc(100vh_-_65px)]">
  <!-- Left Sidebar: Toolbox (collapsible on mobile) -->
  <div class={["fixed z-25 h-[calc(100vh-65px)] left-0 lg:relative lg:translate-x-0 lg:flex w-64 border-r border-border flex-col bg-card", { '-translate-x-full': !mobileToolboxShowing, 'translate-x-0': mobileToolboxShowing }]}>
    {#if mobileToolboxShowing}
      <div class="flex items-center justify-between p-4 border-b border-border">
        <h2 class="font-semibold">Toolbox</h2>
        <Button onclick={() => { mobileToolboxShowing = false }} variant="ghost" size="icon" class="size-8">
          <XIcon class="h-4 w-4" />
        </Button>
      </div>
    {/if}
    <ToolboxSidebar />
  </div>

  <!-- Main Content Area -->
  <div class="flex-1 flex flex-col min-w-0">
    <!-- Mobile Toolbox Toggle -->
    <div class="lg:hidden border-b border-border p-4 bg-card">
      <Button variant="outline" onclick={() => { mobileToolboxShowing = !mobileToolboxShowing}}>
        {#if mobileToolboxShowing}
          <XIcon class="h-4 w-4 mr-2" />
          {:else}
        <Menu class="h-4 w-4 mr-2" />
          {/if}
        Toolbox
      </Button>
    </div>

    <!-- Form Editor Content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Center: Form Editor -->
      <div class="flex-1 flex flex-col min-w-0">
        <div class="flex-1 p-4 lg:p-6 overflow-auto">
          <div class="max-w-4xl mx-auto">
            <!-- Form Header -->
            <div class="bg-background p-6 rounded-lg shadow-sm border mb-6">
              <h1 class="text-2xl font-bold text-foreground mb-2">
                {editor.survey?.title}
              </h1>
              <p class="text-muted-foreground mb-3">
                {editor.survey?.description}
              </p>
              <div class="text-muted-foreground text-sm mb-4">
                <p>
                  Last Update: {editor.survey ? new Date(editor.survey.updatedAt).toLocaleString() : ''}
                </p>
              </div>

              <!-- Action Buttons -->
              <div class="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onclick={openEditDialog}>
                  <PencilIcon class="w-4 h-4 mr-1" />
                  Edit Details
                </Button>
                <Button variant="outline" size="sm" onclick={openShareDialog}>
                  <ShareIcon class="w-4 h-4 mr-1" />
                  Share
                </Button>
                <Button variant="outline" size="sm" href={`${page.url}/results`}>
                  <ChartColumnIcon class="w-4 h-4 mr-1" />
                  Results
                </Button>
                <Button variant="outline" size="sm" onclick={openSettingsDialog}>
                  <SettingsIcon class="w-4 h-4 mr-1" />
                  Settings
                </Button>
              </div>
            </div>

            <!-- Form Fields -->
            <div class="bg-background p-6 rounded-lg shadow-sm border">
              <FormFieldList />
            </div>
          </div>
        </div>
      </div>

      <!-- Right Sidebar: Properties Panel (slides in when field selected) -->
      {#if selectedField}
        <div bind:this={propertiesContainer}
            transition:slide={{ axis: 'x', duration: 300 }}
            class="fixed right-0 w-100 top-[65px] xl:top-0 bottom-0 xl:relative xl:bg-transparent bg-card border-l border-border flex-shrink-0"
        >
          <PropertiesSidebar />
        </div>
      {/if}
    </div>
  </div>
</div>
{#if editor.survey}
  <EditCreateFormDialog {editForm} survey={{ formId: editor.survey.id, ...editor.survey }} />

  <ShareDialog survey={editor.survey} />

  <SettingsDialog />
{/if}