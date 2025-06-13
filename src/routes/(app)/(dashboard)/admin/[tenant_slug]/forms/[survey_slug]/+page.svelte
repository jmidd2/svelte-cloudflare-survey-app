<script lang="ts">
import { FormFieldList } from '$lib/components/FormFieldList';
import { PropertiesSidebar } from '$lib/components/PropertiesSidebar/index.js';
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

let showEditDialog = $state(false);
let showSettingsDialog = $state(false);
let showShareDialog = $state(false);
let activeDialog = $state<'edit' | 'settings' | 'share' | null>(null);

function openDialog(dialog: 'edit' | 'settings' | 'share') {
  if (!activeDialog) {
    switch (dialog) {
      case 'edit':
        showEditDialog = true;
        break;
      case 'settings':
        showSettingsDialog = true;
        break;
      case 'share':
        showShareDialog = true;
        break;
      default:
        break;
    }

    activeDialog = dialog;
  }
}

function closeDialog() {
  showEditDialog = false;
  showSettingsDialog = false;
  showShareDialog = false;
  activeDialog = null;
}

const editForm = superForm(data.editForm, {
  id: 'editForm',
  resetForm: false,
  validators: zod4Client(editFormSchema),
  onError({ result }) {
    breadcrumbStatus.isLoading = false;
    toast.error(result.error.message);
  },
  onSubmit: () => {
    breadcrumbStatus.isLoading = true;
  },
  onUpdated: ({ form: { valid, message } }) => {
    breadcrumbStatus.isLoading = false;
    if (valid) {
      showEditDialog = false;
      breadcrumbStatus.isSaved = true;
    }

    if (!valid && message?.type === 'error' && message.text) {
      toast.error(message.text);
    }
  },
});

const {
  form: editFormData,
  enhance,
  submitting: editFormSubmitting,
} = editForm;

$editFormData.formId = editor.survey?.id ?? '';
$editFormData.title = editor.survey?.title ?? '';
$editFormData.description = editor.survey?.description ?? '';

// Reactive values from the editor
const selectedField = $derived(editor.selectedField);

$inspect(form);
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
            <Button variant="outline" size="sm" onclick={() => { openDialog('edit') }}>
              <PencilIcon class="w-4 h-4 mr-1" />
              Edit Details
            </Button>
            <Button variant="outline" size="sm" onclick={() => { openDialog('share') }}>
              <ShareIcon class="w-4 h-4 mr-1" />
              Share
            </Button>
            <Button variant="outline" size="sm" onclick={() => { openDialog('settings') }}>
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
<Dialog bind:open={() => showEditDialog, () => closeDialog()}>
  <DialogContent class="sm:max-w-xl">
    <DialogHeader>
      <DialogTitle>Edit profile</DialogTitle>
      <DialogDescription>
        Make changes to your title or description here. Click save when you're done.
      </DialogDescription>
    </DialogHeader>
    <form action="?/edit" method="post" class="space-y-4" use:enhance>
      <input type="hidden" bind:value={editor.survey.id} id="formId" name="formId">
      <FormField form={editForm} name="title">
        <FormControl>
          {#snippet children({props})}
            <FormLabel>Title</FormLabel>
            <Input {...props} placeholder={editor.survey?.title} bind:value={$editFormData.title} />
            <FieldErrors />
          {/snippet}
        </FormControl>
      </FormField>
      <FormField form={editForm} name="description">
        <FormControl>
          {#snippet children({props})}
            <FormLabel>Description</FormLabel>
            <Textarea {...props} placeholder={editor.survey?.description} bind:value={$editFormData.description} />
            <FormDescription>A short description of or instructions for the form.</FormDescription>
            <FieldErrors />
          {/snippet}
        </FormControl>
      </FormField>
      <DialogFooter>
        <Button type="submit">Save changes</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
<Dialog bind:open={() => showShareDialog, () => closeDialog()}>
  <DialogContent class="sm:max-w-xl">
    <DialogHeader>
      <DialogTitle>Share Form</DialogTitle>
      <DialogDescription>
        This is where the link to the form would go if that existed.
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>
<Dialog bind:open={() => showSettingsDialog, () => closeDialog()}>
  <DialogContent class="sm:max-w-xl">
    <DialogHeader>
      <DialogTitle>Form Settings</DialogTitle>
      <DialogDescription>
        This where the settings would go if I had any.
      </DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>