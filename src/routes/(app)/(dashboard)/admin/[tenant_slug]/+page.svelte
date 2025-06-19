<script lang="ts">
import { ShareDialog } from '$lib/components/dialogs';
import { Button } from '$lib/components/ui/button';
import type { SelectForm } from '$lib/server/db/schema';
import { surveyDialogManager } from '$stores/SurveyDialog.svelte';
import { PencilIcon, ShareIcon } from '@lucide/svelte';

const { data } = $props();

const tenantSlug = $derived(data.tenant.slug);
const tenantName = $derived(data.tenant.name);
const forms = $derived(data.forms);

// Track which survey is being shared
let currentSurvey = $state<SelectForm | null>(null);

function openShareDialog(survey: SelectForm) {
  currentSurvey = survey;
  surveyDialogManager.openDialog('share');
}
</script>
<div class="px-4 py-3">
  <h1 class="text-xl pb-1 mb-2 border-b">Dashboard</h1>
  <div>
    <a href={`${tenantSlug}/members`}>Members</a>
  </div>
  <div>
    <h2>Forms</h2>
    {#each forms as survey}
      <div class="border-b my-2 py-3">
        <h2 class="text-lg">{survey.title}</h2>
        <p class="text-muted-foreground">{survey.description}</p>
        <div class="flex items-center gap-2 mt-4">
          <Button variant="outline" size="sm" href={`${tenantSlug}/forms/${survey.slug}`}>
            <PencilIcon class="w-4 h-4 mr-1" />
            Edit Form
          </Button>
          <Button variant="outline" size="sm" onclick={() => openShareDialog(survey)}>
            <ShareIcon class="w-4 h-4 mr-1" />
            Share
          </Button>
        </div>
      </div>
    {/each}
  </div>
</div>

<!-- Share Dialog for current survey -->
{#if currentSurvey}
  <ShareDialog
      survey={currentSurvey}
  />
{/if}