<script lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
import { Badge } from '$lib/components/ui/badge';
import { Button } from '$lib/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '$lib/components/ui/card';
import { ArrowRight, Building2, Plus, Users } from '@lucide/svelte';

const { data } = $props();

// Get organizations from the auth client
const organizations = $derived([]); // data.organizations

// Auto-redirect to first organization if user has any
// TODO: Move to page.server or layout.server
// onMount(() => {
//   onAuthStateChange((user) => {
//     if (!user) {
//       goto('/login');
//       return;
//     }
//   });
//   if ($organizations.data && $organizations.data.length > 0) {
//     // Redirect to the first organization
//     goto(`/admin/${$organizations.data[0].slug}`);
//   }
// });

// TODO: Move to utils
function getInitials(name: string): string {
  return (
    name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase() || '?'
  );
}

const isLoading = $state(false);
</script>

<svelte:head>
  <title>Admin Dashboard</title>
</svelte:head>

<div class="min-h-screen bg-background">
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-foreground mb-2">
        Welcome to Admin Dashboard
      </h1>
      <p class="text-muted-foreground">
        Select an organization to manage or create a new one
      </p>
    </div>

    {#if isLoading}
      <!-- Loading State -->
      <Card>
        <CardContent class="p-8 text-center">
          <div class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto mb-4"></div>
          <p class="text-muted-foreground">Loading your organizations...</p>
        </CardContent>
      </Card>
    {:else if !organizations || organizations.length === 0}
      <!-- No Organizations State -->
      <Card>
        <CardContent class="p-8 text-center">
          <Building2 class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 class="text-lg font-medium text-foreground mb-2">No Organizations Found</h3>
          <p class="text-muted-foreground mb-6">
            You don't belong to any organizations yet. Create one to get started or request to join an existing organization.
          </p>
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <Button href="/onboarding">
              <Plus class="h-4 w-4 mr-2" />
              Create Organization
            </Button>
            <Button variant="outline" href="/onboarding">
              <Users class="h-4 w-4 mr-2" />
              Join Organization
            </Button>
          </div>
        </CardContent>
      </Card>
    {:else}
      <!-- Organizations List -->
      <div class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {#each organizations as organization}
            <Card class="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader class="pb-4">
                <div class="flex items-center gap-3">
                  <Avatar class="h-12 w-12">
                    <AvatarImage src={organization.logo} alt={organization.name} />
                    <AvatarFallback class="bg-primary/10 text-primary font-medium">
                      {getInitials(organization.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div class="flex-1 min-w-0">
                    <CardTitle class="text-lg truncate">{organization.name}</CardTitle>
                    <CardDescription class="text-sm">
                      {organization.memberCount || 0} members
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent class="pt-0">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <Badge variant="secondary" class="text-xs">
                      {organization.role || 'Member'}
                    </Badge>
                    {#if organization.isOwner}
                      <Badge variant="outline" class="text-xs">
                        Owner
                      </Badge>
                    {/if}
                  </div>
                  <Button
                      href={`/admin/${organization.slug}`}
                      size="sm"
                      class="group-hover:bg-primary group-hover:text-primary-foreground"
                  >
                    Open
                    <ArrowRight class="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          {/each}
        </div>

        <!-- Quick Actions -->
        <Card>
          <CardHeader>
            <CardTitle class="text-lg">Quick Actions</CardTitle>
            <CardDescription>
              Common tasks you can perform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" href="/onboarding">
                <Plus class="h-4 w-4 mr-2" />
                Create New Organization
              </Button>
              <Button variant="outline" href="/onboarding">
                <Users class="h-4 w-4 mr-2" />
                Request to Join Organization
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    {/if}
  </div>
</div>
