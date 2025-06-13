<script lang="ts">
import { enhance } from '$app/forms';
import { goto } from '$app/navigation';
import { Button } from '$lib/components/ui/button/index.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '$lib/components/ui/card/index.js';
import { Input } from '$lib/components/ui/input/index.js';
import { Label } from '$lib/components/ui/label/index.js';

let { form } = $props();

let loading = $state(false);
let status = $state<{ type: 'success' | 'error'; message: string } | null>(
  null
);
$inspect(form);
</script>

<div class="min-h-screen flex items-center justify-center bg-muted/30 p-4">
  <Card class="w-full max-w-md">
    <CardHeader class="text-center">
      <CardTitle class="text-2xl">Complete Your Profile</CardTitle>
      <CardDescription>
        {#if !status || status?.type === 'error'}Please provide your name to continue{/if}
      </CardDescription>
    </CardHeader>

    <CardContent>
      {#if form && form.message}
        <p class="my-2 text-destructive">{form.message}</p>
      {/if}
      {#if status}
        <p class={['mb-4 text-center text-sm', { "text-destructive": status.type === 'error', 'text-green-600': status.type === 'success' }]}>{status.message}</p>
      {/if}
      {#if !status || status?.type === 'error'}
      <form
          method="POST"
          class="space-y-4"
          use:enhance={() => {
            loading = true;

            return ({result, update}) => {
              if (result.type === 'error') {
                console.error('There was an error saving your profile.', result.error);
                status = { type: 'error', message: 'There was an error saving your profile. \nPlease try again.'}
              }

              if (result.type === 'failure') {
                console.error('There was an error saving your profile.', result.data);
                status = { type: 'error', message: 'There was an error saving your profile. Please try again.'}
              }

              if (result.type === 'redirect') {
                status = { type: 'success', message: 'Profile saved successfully!'}
                setTimeout(() => { goto(result.location); }, 2000);
              }

              if (result.type === 'success') {
                status = { type: 'success', message: 'Profile saved successfully!'}
                setTimeout(() => { goto('/'); }, 2000);
              }

              loading = false;
          }}}
      >

        <div class="flex w-full max-w-sm flex-col gap-1.5">
          <Label for="name">Name</Label>
          <Input type="text" id="name" name="name" placeholder="Full Name" />
        </div>
        <Button
            type="submit"
            class="w-full"
            disabled={loading}
        >
          {loading ? 'Saving...' : 'Continue'}
        </Button>
      </form>
        {/if}
    </CardContent>
  </Card>
</div>