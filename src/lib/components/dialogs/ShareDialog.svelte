<script lang="ts">
import { page } from '$app/state';
import QrViewer from '$lib/components/QrViewer.svelte';
import { Button } from '$lib/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '$lib/components/ui/dialog';
import type { SelectForm } from '$lib/server/db/schema';
import { formDialogManager } from '$lib/stores/SurveyDialog.svelte.js';
import {
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  QrCodeIcon,
  ShareIcon,
} from '@lucide/svelte';
import { toast } from 'svelte-sonner';

interface Props {
  survey: SelectForm;
  surveyUrl?: string;
}

const { survey, surveyUrl }: Props = $props();

const slug = $derived(survey.slug ?? '');

// Generate the full survey URL if not provided
const fullSurveyUrl = $derived(surveyUrl || `${page.url.origin}/form/${slug}`);

// Copy functionality
let copied = $state(false);

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(fullSurveyUrl);
    copied = true;
    toast.success('Link copied to clipboard!');
    setTimeout(() => {
      copied = false;
    }, 2000);
  } catch (err) {
    toast.error('Failed to copy link');
  }
}
</script>

<Dialog bind:open={() => formDialogManager.isDialogOpen('share'), () => formDialogManager.closeDialog()}>
  <DialogContent class="max-w-svw w-svw md:w-[unset] sm:max-w-3xl">
    <DialogHeader>
      <DialogTitle class="flex items-center gap-2">
        <ShareIcon class="size-5" />
        Share Your Form
      </DialogTitle>
      <DialogDescription class="flex flex-col gap-2">
        <p class="text-base font-semibold pb-1 border-b">{survey.title}</p>
        <p class="text-sm">
        Share your form with others using the QR code or direct link below.
        </p>
      </DialogDescription>
    </DialogHeader>

    <div class="grid lg:grid-cols-2 gap-8 py-4">
      <!-- QR Code Section -->
      <div class="flex flex-col items-center space-y-4">
        <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <QrCodeIcon class="w-4 h-4" />
          QR Code
        </div>
        <QrViewer url={fullSurveyUrl} {slug} />
        <p class="text-xs text-muted-foreground text-center max-w-48">
          Scan, copy, or download the QR code to share your form
        </p>
      </div>

      <!-- Link Section -->
      <div class="space-y-4">
        <div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <ExternalLinkIcon class="w-4 h-4" />
          Direct Link
        </div>

        <div class="space-y-3 w-full">
          <div class="p-3 bg-muted/50 rounded-lg border">
            <div class="overflow-x-auto pb-2.5">
              <p class="text-sm font-mono scroll-m-2 text-muted-foreground whitespace-nowrap w-1 sm:w-auto">
                {fullSurveyUrl}
              </p>
            </div>
          </div>

          <div class="flex gap-2">
            <Button
                variant="outline"
                size="sm"
                onclick={copyToClipboard}
                class="flex-1"
            >
              {#if copied}
                <CheckIcon class="w-4 h-4 mr-2 text-green-500" />
                Copied!
              {:else}
                <CopyIcon class="w-4 h-4 mr-2" />
                Copy Link
              {/if}
            </Button>

            <Button
                variant="outline"
                size="sm"
                href={fullSurveyUrl}
                target="_blank"
                class="flex-1"
            >
              <ExternalLinkIcon class="w-4 h-4 mr-2" />
              Preview
            </Button>
          </div>
        </div>
      </div>
    </div>
  </DialogContent>
</Dialog>