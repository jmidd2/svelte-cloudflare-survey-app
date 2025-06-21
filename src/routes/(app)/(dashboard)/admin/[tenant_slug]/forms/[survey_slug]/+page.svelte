<script lang="ts">
import {
  EditDialog,
  SettingsDialog,
  ShareDialog,
} from '$lib/components/dialogs';
import { FormFieldList } from '$lib/components/FormFieldList';
import { PropertiesSidebar } from '$lib/components/PropertiesSidebar';
import { ToolboxSidebar } from '$lib/components/ToolboxSidebar';
import { Button } from '$lib/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '$lib/components/ui/dialog';
import {
  FieldErrors,
  FormControl,
  FormDescription,
  FormField,
  FormLabel,
} from '$lib/components/ui/form';
import { Input } from '$lib/components/ui/input';
import { Textarea } from '$lib/components/ui/textarea';
import { surveyDialogManager } from '$lib/stores/SurveyDialog.svelte.js';
import { editFormSchema } from '$lib/validation-schema';
import { SurveyEditor, setSurveyEditor } from '$stores/survey-editor.svelte';
import { Menu, PencilIcon, SettingsIcon, ShareIcon } from '@lucide/svelte';
import { slide } from 'svelte/transition';
import { toast } from 'svelte-sonner';
import { superForm } from 'sveltekit-superforms';
import { zod4Client } from 'sveltekit-superforms/adapters';
import { getBreadcrumbContext } from '../../../breadcrumbContext.svelte';
import type { PageProps } from './$types';

const { data, form }: PageProps = $props();

// Create the survey editor instance
const editor = new SurveyEditor(data.survey, data.fields);
setSurveyEditor(editor);

const breadcrumbStatus = getBreadcrumbContext();

$effect(() => {
  if (!breadcrumbStatus) return;
  if (editor.isLoading !== null) breadcrumbStatus.isLoading = editor.isLoading;
});

$effect(() => {
  if (!breadcrumbStatus) return;
  if (editor.isSaved) breadcrumbStatus.isSaved = editor.isSaved;
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
    breadcrumbStatus.isLoading = false;
    toast.error(result.error.message);
  },
  onSubmit: () => {
    breadcrumbStatus.isLoading = true;
  },
  onResult: ({ result: { type, status } }) => {
    if (type === 'redirect' && status === 303) {
      breadcrumbStatus.isLoading = false;
      breadcrumbStatus.isSaved = true;
      surveyDialogManager.closeDialog();
    }
    console.log('onResult', type, status);
  },
  onUpdated: ({ form: { valid, message, data } }) => {
    breadcrumbStatus.isLoading = false;
    if (valid) {
      surveyDialogManager.closeDialog();
      breadcrumbStatus.isSaved = true;
    }

    if (!valid && message?.type === 'error' && message.text) {
      toast.error(message.text);
    }
  },
});

const selectedField = $derived(editor.selectedField);

function openEditDialog() {
  surveyDialogManager.openDialog('edit');
}

function openShareDialog() {
  surveyDialogManager.openDialog('share');
}

function openSettingsDialog() {
  surveyDialogManager.openDialog('settings');
}
</script>

<svelte:head>
  <title>Edit Form - {editor.survey?.title}</title>
</svelte:head>

<!-- 2-Column Layout that works within existing admin layout -->
<div class="flex h-full bg-background overflow-hidden">
  <!-- Left Sidebar: Toolbox (collapsible on mobile) -->
  <div class="hidden lg:flex w-64 border-r border-border flex-col bg-card">
    <ToolboxSidebar />
  </div>

  <!-- Main Content Area -->
  <div class="flex-1 flex flex-col min-w-0">
    <!-- Mobile Toolbox Toggle -->
    <div class="lg:hidden border-b border-border p-4 bg-card">
      <Button variant="outline" onclick={() => { /* Add mobile toolbox toggle logic */ }}>
        <Menu class="h-4 w-4 mr-2" />
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
        <div
            transition:slide={{ axis: 'x', duration: 300 }}
            class="fixed right-0 w-100 top-24 xl:top-0 bottom-0 xl:relative xl:bg-transparent bg-card border-l border-border flex-shrink-0"
        >
          <PropertiesSidebar />
        </div>
      {/if}
    </div>
  </div>
</div>
{#if editor.survey}
  <EditDialog {editForm} survey={{ formId: editor.survey.id, ...editor.survey }} />

  <ShareDialog survey={editor.survey} />

  <SettingsDialog />
{/if}