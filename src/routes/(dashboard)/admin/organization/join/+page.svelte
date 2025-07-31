<script lang="ts">
import { enhance } from '$app/forms';
import { goto } from '$app/navigation';
import { Alert, AlertDescription } from '$lib/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
import { Badge } from '$lib/components/ui/badge';
import { Button } from '$lib/components/ui/button';
import {
  Card,
  CardContent,
} from '$lib/components/ui/card';
import { Input } from '$lib/components/ui/input';
import { ScrollArea } from '$lib/components/ui/scroll-area';
import { Separator } from '$lib/components/ui/separator';
import { getInitials } from '$lib/utils';
import {
  ArrowLeft,
  Building2,
  CheckCircle,
  Clock,
  MergeIcon,
  Search,
  Users,
} from '@lucide/svelte';
import type { SubmitFunction } from '@sveltejs/kit';


interface FormStatus {
  type: 'success' | 'error';
  message: string;
}

interface SelectedOrg {
  id: string;
  name: string;
  memberCount: number;
  logo: string | null;
  metadata: unknown;
}

let { data } = $props();
// Calculate starting step and total steps needed


// UI State
let loading = $state(false);
let searchQuery = $state('');
let selectedOrganization = $state<SelectedOrg | null>(null);
let status = $state<FormStatus | null>(null);


// Filtered organizations based on search
const filteredOrganizations = $derived.by(() => {
    if (!searchQuery) return data.organizations;
    return data.organizations.filter(org =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
});

const handleJoinRequest: SubmitFunction = () => {
  loading = true;

  return async ({ result }) => {

    if (result.type === 'redirect') {
      goto(result.location);
    } else if (result.type === 'success') {
      status = { type: 'success', message: 'Join request sent successfully!' };
    } else {
      status = {
        type: 'error',
        message: 'There was an error sending your request. Please try again.',
      };
    }

    loading = false;
  };
};
</script>
<svelte:head>
    <title>Join An Organization</title>
</svelte:head>

<div class="container mx-auto py-8 px-4 max-w-4xl">
    <!-- <Card> -->
        <div class="mb-8">
            <div class="flex items-center gap-4 mb-4">
                <Button variant="ghost" href="/admin">
                    <ArrowLeft class="w-4 h-4"/>Back to Admin
                </Button>
            </div>
            <div class="flex items-center gap-3 mb-2">
                <div class="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <MergeIcon class="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 class="text-3xl font-bold">Join An Organization</h1>
                    <p class="text-muted-foreground">Search for an organization to join</p>
                </div>
            </div>
        </div>

        <Card class="p-6 max-h-[800px]">
            {#if status}
                <Alert class={`mb-4 ${status.type === 'error' ? 'border-destructive/50 bg-destructive/5' : 'border-green-200 bg-green-50 dark:bg-green-950/20'}`}>
                    <AlertDescription class={status.type === 'error' ? 'text-destructive' : 'text-green-800 dark:text-green-200'}>
                        {status.message}
                    </AlertDescription>
                </Alert>
            {/if}

          <!-- Search -->
            <div class="space-y-4 mb-6">
                <div class="relative">
                    <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search organizations..."
                        bind:value={searchQuery}
                        class="pl-10"
                    />
                </div>
            </div>

          <!-- Organizations List -->
            <ScrollArea class="space-y-3 overflow-y-auto">
                <div class="space-y-3 p-3">
                    {#each filteredOrganizations as org}
                        <Card class={`cursor-pointer transition-colors ${selectedOrganization?.id === org.id ? 'ring-2 ring-primary bg-accent' : 'hover:bg-accent'}`}
                            onclick={() => {
                                if (selectedOrganization?.id === org.id)
                                    selectedOrganization = null;
                                else{
                                    selectedOrganization = org;
                                }
                            }}>
                            <CardContent class="p-4">
                                <div class="flex items-center gap-4">
                                    <Avatar class="h-12 w-12">
                                        <AvatarImage src={org.logo} alt={org.name} />
                                        <AvatarFallback class="bg-primary/10 text-primary font-medium">
                                            {getInitials(org.name)}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div class="flex-1">
                                        <h3 class="font-semibold text-foreground">{org.name}</h3>
                                        <div class="flex items-center gap-2 mt-1">
                                            <Badge variant="secondary" class="text-xs">
                                                <Users class="h-3 w-3 mr-1" />
                                                {org.memberCount} members
                                            </Badge>
                                        </div>
                                    </div>

                                    {#if selectedOrganization?.id === org.id}
                                        <CheckCircle class="h-5 w-5 text-primary" />
                                    {/if}
                                </div>
                            </CardContent>
                        </Card>
                    {/each}

                    {#if filteredOrganizations.length === 0}
                        <div class="text-center py-8">
                            <Building2 class="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 class="text-lg font-medium text-foreground mb-2">No organizations found</h3>
                                <p class="text-muted-foreground">
                                    {searchQuery ? 'Try adjusting your search terms.' : 'No organizations are available to join.'}
                                </p>
                        </div>
                    {/if}
                </div>
            </ScrollArea>

            <Separator class="my-6" />

            <form
                method="POST"
                action="?/request-join"
                use:enhance={handleJoinRequest}
            >
                <input type="hidden" name="organizationId" value={selectedOrganization?.id} />

                <Alert class="mb-4">
                    <Clock class="h-4 w-4" />
                    <AlertDescription>
                        Your request will be sent to the organization administrators for approval.
                    </AlertDescription>
                </Alert>

                <div class="flex gap-3">
                    <Button type="submit" class="flex-1" disabled={loading || !selectedOrganization}>
                        {loading ? 'Sending Request...' : 'Request to Join'}
                    </Button>
                </div>
            </form>
        </Card>
</div>