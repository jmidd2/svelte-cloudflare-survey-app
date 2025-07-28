<script lang="ts">
import { enhance } from '$app/forms';
import { goto } from '$app/navigation';
import FieldRender from '$lib/components/FieldRender.svelte';
import { Alert, AlertDescription } from '$lib/components/ui/alert';
import { Badge } from '$lib/components/ui/badge';
import { Button } from '$lib/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '$lib/components/ui/card';
import { Separator } from '$lib/components/ui/separator';
import type { SelectFormFieldWithHash } from '$lib/server/db/schema';
import {
  type SubmissionInfo,
  submissionTracker,
} from '$lib/utils/submission-tracker';
import { AlertCircle, Clock, FileText } from '@lucide/svelte';
import type { SubmitFunction } from '@sveltejs/kit';
import { onMount } from 'svelte';

const { data, form } = $props();

const survey = $derived(data.survey);
const fields = $derived(data.fields);
const requiredFieldsCount = $derived(
  fields.filter(field => field.required).length
);
const totalFieldsCount = $derived(fields.length);

let submissionInfo = $state<SubmissionInfo | null>(null);
let mounted = $state(false);
let isSubmitting = $state(false);

onMount(() => {
  mounted = true;
  if (survey) {
    submissionInfo = submissionTracker.getSubmissionInfo(survey.id);
  }
});

function createSlug({ label, hash }: SelectFormFieldWithHash) {
  return `${label.toLowerCase().replaceAll(' ', '-')}-${hash}`;
}

const handleSubmit: SubmitFunction = () => {
  isSubmitting = true;
  return async ({ result, update }) => {

    if (result.type === 'success') {
      // Record the submission
      submissionTracker.recordSubmission(survey.id);

      // Redirect to success page
      await goto(`/form/${survey.slug}/submitted?id=${Date.now()}`);
    } else {
      await update();
    }

    isSubmitting = false;
  };
};

const formatTimeRemaining = (timestamp: number | null) => {
  if (!(timestamp && mounted)) return '';

  const now = Date.now();
  const remaining = timestamp - now;

  if (remaining <= 0) return 'Available now';

  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};
</script>

<svelte:head>
  <title>{survey.title}</title>
</svelte:head>

<div class="min-h-screen bg-background">
  <div class="container mx-auto px-4 py-8 max-w-2xl">
    <!-- Header Section -->
    <div class="mb-8">
      <div class="flex items-center gap-2 mb-4">
        <FileText class="h-6 w-6 text-primary" />
        <Badge variant="secondary" class="text-xs">
          {totalFieldsCount} {totalFieldsCount === 1 ? 'field' : 'fields'}
          {#if requiredFieldsCount > 0}
            • {requiredFieldsCount} required
          {/if}
        </Badge>
      </div>

      <h1 class="text-3xl font-bold text-foreground mb-3">
        {survey.title}
      </h1>

      {#if survey.description}
        <p class="text-lg text-muted-foreground leading-relaxed">
          {survey.description}
        </p>
      {/if}
    </div>

    <!-- Submission Limit Warning -->
    {#if mounted && submissionInfo && !submissionInfo.canSubmit}
      <Alert class="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <Clock class="h-4 w-4 text-amber-600" />
        <AlertDescription class="text-amber-800 dark:text-amber-200">
          <strong>Submission limit reached.</strong>
          You've reached the maximum number of submissions for this form.
          You can submit again in {formatTimeRemaining(submissionInfo.nextResetTime)}.
        </AlertDescription>
      </Alert>
    {:else if mounted && submissionInfo && submissionInfo.remainingSubmissions <= 1}
      <Alert class="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <AlertDescription class="text-blue-800 dark:text-blue-200">
          You have {submissionInfo.remainingSubmissions} submission{submissionInfo.remainingSubmissions === 1 ? '' : 's'} remaining
          in the next {submissionInfo.timeWindowHours} hours.
        </AlertDescription>
      </Alert>
    {/if}

    <!-- Form Status Messages -->
    {#if form && !form.success}
      <div class="mb-6">
        <Alert class="border-destructive/50 bg-destructive/5">
          <AlertCircle class="h-4 w-4 text-destructive" />
          <AlertDescription class="text-destructive">
            {#if form.status === 404}
              <strong>Survey not found.</strong> The form you're looking for doesn't exist or has been removed.
            {:else if form.status === 400}
              <strong>Please check your responses.</strong> Make sure all required fields are filled out correctly.
            {:else}
              <strong>Something went wrong.</strong> Please try again or contact support if the problem persists.
            {/if}
          </AlertDescription>
        </Alert>
      </div>
    {/if}

    <!-- Form Card -->
    <Card class="shadow-lg">
      <CardHeader class="pb-6">
        <CardTitle class="flex items-center justify-between">
          Complete the Form
        </CardTitle>
        <CardDescription>
          Please fill out all the information below. Fields marked with an asterisk (*) are required.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
            method="post"
            use:enhance={handleSubmit}
            class="space-y-6"
        >
          {#each fields as field, index}
            {@const slug = createSlug(field)}
            <div class="space-y-2">
              <label
                  for={slug}
                  class="text-sm font-medium text-foreground flex items-center gap-2"
              >
                <span class="flex items-center gap-1">
                  {field.label}
                  {#if field.required}
                    <span class="text-destructive font-bold" aria-label="required">*</span>
                  {/if}
                </span>
              </label>

              <div class="relative">
                <FieldRender {field} id={slug} name={slug} />
              </div>

              <!--{#if field.description}-->
              <!--  <p class="text-xs text-muted-foreground">-->
              <!--    {field.description}-->
              <!--  </p>-->
              <!--{/if}-->
            </div>

            {#if index < fields.length - 1}
              <Separator class="my-6" />
            {/if}
          {/each}

          <div class="pt-6 border-t">
            <div class="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
              <p class="text-sm text-muted-foreground">
                {#if requiredFieldsCount > 0}
                  Please ensure all required fields (*) are completed before submitting.
                {:else}
                  All fields are optional. Submit when you're ready.
                {/if}
              </p>

              <Button
                  type="submit"
                  disabled={isSubmitting || (mounted && submissionInfo && !submissionInfo.canSubmit)}
                  class="bg-primary hover:bg-primary-hover text-primary-foreground px-8 py-2.5 font-medium"
                  size="lg"
              >
                {#if isSubmitting}
                  Submitting...
                {:else}
                  Submit Form
                {/if}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>

    <!-- Footer -->
    <div class="mt-12 text-center space-y-2">
      <p class="text-sm text-muted-foreground">
        Powered by <a href="/" class="underline">Feedback at Phoenix Spark</a>
      </p>
      <p class="text-sm text-muted-foreground">
        Created by <a href="https://travisspark.com" rel="noreferrer" target="_blank" class="underline">Phoenix Spark</a>
      </p>
    </div>
  </div>
</div>

