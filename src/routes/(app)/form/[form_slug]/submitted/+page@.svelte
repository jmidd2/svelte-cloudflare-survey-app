<script lang="ts">
import { CheckCircle } from '@lucide/svelte';

const { data } = $props();
</script>

<svelte:head>
  <title>Form Submitted - {data.survey?.title || 'Survey'}</title>
</svelte:head>

<div class="min-h-screen bg-background">
  <div class="container mx-auto px-4 py-8 max-w-2xl">
    <!-- Success Header -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
        <CheckCircle class="h-8 w-8 text-green-600 dark:text-green-400" />
      </div>

      <h1 class="text-3xl font-bold text-foreground mb-2">
        Thank You!
      </h1>

      <p class="text-lg text-muted-foreground">
        Your response has been submitted successfully.
      </p>
    </div>

    <!-- Footer -->
    <div class="mt-12 text-center space-y-2">
      <p class="text-sm text-muted-foreground">
        Powered by <a href="/" target="_blank" class="underline">Feedback at Phoenix Spark</a>
      </p>
      <p class="text-sm text-muted-foreground">
        Created by <a href="https://travisspark.com" rel="noreferrer" target="_blank" class="underline">Phoenix Spark</a>
      </p>
    </div>
  </div>
</div>
