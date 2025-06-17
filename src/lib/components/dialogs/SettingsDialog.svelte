<script lang="ts">
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '$lib/components/ui/dialog';
import { surveyDialogManager } from '$lib/stores/SurveyDialog.svelte.js';
</script>

<Dialog bind:open={() => surveyDialogManager.isDialogOpen('settings'), () => surveyDialogManager.closeDialog()}>
  <DialogContent class="sm:max-w-xl">
    <DialogHeader>
      <DialogTitle>Form Settings</DialogTitle>
      <DialogDescription>
        Configure your form settings and preferences.
      </DialogDescription>
    </DialogHeader>
    <div class="py-4">
      <p class="text-muted-foreground">Settings panel coming soon...</p>
    </div>
  </DialogContent>
</Dialog>