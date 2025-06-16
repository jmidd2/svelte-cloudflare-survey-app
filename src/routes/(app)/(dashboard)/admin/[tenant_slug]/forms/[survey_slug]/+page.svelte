<script lang="ts">
import { FormFieldList } from '$lib/components/FormFieldList';
import { PropertiesSidebar } from '$lib/components/PropertiesSidebar/index.js';
import { ToolboxSidebar } from '$lib/components/ToolboxSidebar';
import {
  EditDialog,
  SettingsDialog,
  ShareDialog,
} from '$lib/components/dialogs';
import { Button } from '$lib/components/ui/button';
import { surveyDialogManager } from '$lib/stores/SurveyDialog.svelte.js';
import { editFormSchema } from '$lib/validation-schema';
import { SurveyEditor, setSurveyEditor } from '$stores/survey-editor.svelte';
import { PencilIcon, SettingsIcon, ShareIcon } from '@lucide/svelte';
import { toast } from 'svelte-sonner';
import { slide } from 'svelte/transition';
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

<div class="flex flex-1 overflow-hidden">
  <div class="w-64 border-r border-spark-secondary-600 flex flex-col h-full">
    <ToolboxSidebar/>
  </div>
  <div class="flex flex-1 flex-col">
    <div class="flex-1 p-6 overflow-auto bg-muted/10">
      <div class="max-w-4xl xl:mx-auto p-6 rounded-lg shadow-sm border">
        <div class="mb-3">
          <h1 class="text-2xl">
            {editor.survey?.title}
          </h1>
          <p>
            {editor.survey?.description}</p>
          <div class="text-muted-foreground text-sm flex items-center gap-2 my-1">
            <p>
              Last Update: {editor.survey ? new Date(editor.survey.updatedAt).toLocaleString() : ''}
            </p>
          </div>
          <div class="flex items-center gap-2 mt-4">
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

        <FormFieldList/>
      </div>
    </div>
  </div>
  {#if selectedField}
    <div transition:slide={{ axis: 'x' }} class="fixed right-0 w-100 top-35.25 xl:top-0 bottom-0 bg-spark-bg-dark xl:relative xl:bg-transparent">
      <PropertiesSidebar />
    </div>
  {/if}
</div>
{#if editor.survey}
  <EditDialog {editForm} survey={{ formId: editor.survey.id, ...editor.survey }} />

  <ShareDialog survey={editor.survey} />

  <SettingsDialog />
{/if}