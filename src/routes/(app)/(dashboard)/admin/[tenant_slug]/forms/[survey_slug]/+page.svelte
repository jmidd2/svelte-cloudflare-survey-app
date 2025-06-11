<script lang="ts">
import { FormFieldList } from '$lib/components/FormFieldList';
import { PropertiesSidebar } from '$lib/components/PropertiesSidebar/index.js';
import { ToolboxSidebar } from '$lib/components/ToolboxSidebar';
import { SurveyEditor, setSurveyEditor } from '$stores/survey-editor.svelte';
import { slide } from 'svelte/transition';
import { getBreadcrumbContext } from '../../../breadcrumbContext.svelte';
import type { PageProps } from './$types';

const { data }: PageProps = $props();

// Create the survey editor instance
const editor = new SurveyEditor(data.survey, data.fields);
setSurveyEditor(editor);
const breadcrumbStatus = getBreadcrumbContext();
$inspect(breadcrumbStatus);
$effect(() => {
  if (!breadcrumbStatus) return;
  if (editor.isLoading !== null) breadcrumbStatus.isLoading = editor.isLoading;
});
$effect(() => {
  if (!breadcrumbStatus) return;
  breadcrumbStatus.isSaved = editor.isSaved;
});
// Update editor data when server data changes
$effect(() => {
  editor.fields = [...data.fields];
  editor.survey = data.survey;
});

// Reactive values from the editor
const selectedField = $derived(editor.selectedField);

$inspect(editor.isSaved);
</script>
<div class="flex flex-1 overflow-hidden">
  <div class="w-64 border-r border-spark-secondary-600 flex flex-col h-full">
    <ToolboxSidebar/>
  </div>
  <div class="flex flex-1 flex-col">
    <div class="flex-1 p-6 overflow-auto bg-muted/10">
      <div class="max-w-4xl xl:mx-auto p-6 rounded-lg shadow-sm border">
        <div class="mb-3">
          <h1 class="flex flex-col text-2xl mb-2">
            {editor.survey?.title}
            <span class="text-sm text-muted-foreground">
              Survey #{editor.survey?.id}
            </span>
          </h1>
          <p>{editor.survey?.description}</p>
          <div class="text-muted-foreground text-sm flex items-center gap-2 my-1">
            <p>
            Last Update: {editor.survey ? new Date(editor.survey.updatedAt).toLocaleString() : ''}
            </p>
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