
<script lang="ts">
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
  FormField,
  FormLabel,
} from '$lib/components/ui/form';
import { Input } from '$lib/components/ui/input';
import { Textarea } from '$lib/components/ui/textarea';
import { formDialogManager } from '$lib/stores/SurveyDialog.svelte.js';
import type { CreateFormSchema, EditFormSchema } from '$lib/validation-schema';
import type { SuperForm } from 'sveltekit-superforms';

interface Props {
  editForm: SuperForm<
    EditFormSchema['_zod']['output'] | CreateFormSchema['_zod']['output']
  >;
  survey?: { formId: string; title: string; description: string };
  action: string;
}

const { editForm, survey, action = '?/edit' }: Props = $props();

const { form: editFormData, enhance } = editForm;
$effect(() => {
  if (survey) {
    $editFormData.formId = survey.formId;
    $editFormData.title = survey.title;
    $editFormData.description = survey.description;
  }
});
</script>

<Dialog bind:open={() => formDialogManager.isDialogOpen('edit'), () => formDialogManager.closeDialog()}>
  <DialogContent class="sm:max-w-xl">
    <DialogHeader>
      <DialogTitle>Edit Form Details</DialogTitle>
      <DialogDescription>
        Make changes to your title or description here. Click save when you're done.
      </DialogDescription>
    </DialogHeader>
    <form action={action} method="post" class="space-y-4" use:enhance>
      <input type="hidden" value={$editFormData.formId} id="formId" name="formId">
      <FormField form={editForm} name="title">
        <FormControl>
          {#snippet children({props})}
            <FormLabel>Title</FormLabel>
            <Input {...props} placeholder={survey?.title ?? 'Form Title'} bind:value={$editFormData.title} />
            <FieldErrors />
          {/snippet}
        </FormControl>
      </FormField>
      <FormField form={editForm} name="description">
        <FormControl>
          {#snippet children({props})}
            <FormLabel>Description</FormLabel>
            <Textarea {...props} placeholder={survey?.description ?? 'A brief description'} bind:value={$editFormData.description} />
            <DialogDescription>A short description of or instructions for the form.</DialogDescription>
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