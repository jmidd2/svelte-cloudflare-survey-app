<script lang="ts">
import { goto } from '$app/navigation';
import { Button } from '$lib/components/ui/button';
import * as Card from '$lib/components/ui/card';
import { CheckCircleIcon } from '@lucide/svelte';

const { data } = $props();
</script>

{#if data.type === 'INVITATION_NOT_FOUND'}
<div class="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
  <div class="flex w-full max-w-sm flex-col gap-6">
    <Card.Root>
      <Card.Header class="text-center">
        <div class="flex justify-center mb-4">
          <CheckCircleIcon class="size-12 text-green-500" />
        </div>
        <Card.Title class="text-xl">Invitation Already Accepted</Card.Title>
        <Card.Description>
          This invitation has already been accepted. Please sign in to access the organization.
        </Card.Description>
      </Card.Header>
      <Card.Content class="text-center space-y-4">
        <Button variant="outline" onclick={() => goto('/')}>Go to Home</Button>
      </Card.Content>
    </Card.Root>
  </div>
</div>
{/if}