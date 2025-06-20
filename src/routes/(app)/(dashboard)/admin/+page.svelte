<script lang="ts">
  import { authClient } from '$lib/auth-client';

  // TODO: Show something to say that a request to join is pending

  // biome-ignore lint/correctness/useHookAtTopLevel: not a react app
  const organizations = authClient.useListOrganizations();
</script>

<h1>Your Organizations</h1>
{#if $organizations.isPending}
  <p>Loading...</p>
{:else if $organizations.data === null}
  <p>No organizations found.</p>
{:else}
  <ul>
    {#each $organizations.data as organization}
      <li><a href={`admin/${organization.slug}`}>{organization.name}</a></li>
    {/each}
  </ul>
{/if}