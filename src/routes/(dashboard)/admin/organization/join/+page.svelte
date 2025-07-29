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
  CardDescription,
  CardHeader,
  CardTitle,
} from '$lib/components/ui/card';
import { Input } from '$lib/components/ui/input';
import { Label } from '$lib/components/ui/label';
import { ScrollArea } from '$lib/components/ui/scroll-area';
import { Separator } from '$lib/components/ui/separator';
import { getInitials } from '$lib/utils';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle,
  Clock,
  Plus,
  Search,
  User,
  Users,
} from '@lucide/svelte';
import type { SubmitFunction } from '@sveltejs/kit';
import { onMount } from 'svelte';


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
console.log(data)
// User state from server
const user = $derived(data.user);
const userOrganizations = $derived(data.userOrganizations || []);
let hasName = $state(data.hasName);
const hasOrganization = $derived(data.hasOrganization);

// Determine what steps are needed
const needsProfile = $derived.by(() => !data.hasName);
const needsOrganization = $derived.by(() => !hasOrganization);
const isComplete = $derived.by(() => hasName && hasOrganization);

// Calculate starting step and total steps needed


// UI State
let loading = $state(false);
let searchQuery = $state('');
let selectedOrganization = $state<SelectedOrg | null>(null);
let status = $state<FormStatus | null>(null);

// Form data
let profileData = $state({
  name: user?.name || '',
});

let organizationData = $state({
  name: '',
  description: '',
});

// Redirect if onboarding is complete

// Filtered organizations based on search
const filteredOrganizations = $derived.by(() => {
    if (!searchQuery) return data.organizations;
    return data.organizations.filter(org =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
});

$effect(() => console.log('selectedOrg: ', selectedOrganization))



const handleJoinRequest: SubmitFunction = () => {
  loading = true;

  return async ({ result }) => {
    console.log('result: ', result)

    if (result.type === 'redirect') {
      goto(result.location);
    } else if (result.type === 'success') {
      status = { type: 'success', message: 'Join request sent successfully!' };
    //   setTimeout(() => {
    //     goto('/');
    //   }, 2000);
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

<div class="flex flex-col w-full bg-background p-4">
    <!-- <Card> -->
        <div class="flex flex-col gap-y-2 p-4">
            <h4 class="text-3xl flex font-bold gap-2">
                Join an Organization
            </h4>
            <p>
                Search and request to join an existing organization
            </p>
        </div>

        <div class="p-6">
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
            <ScrollArea class="space-y-3 max-h-96 overflow-y-auto">
                <div class="space-y-3 p-3">
                    {#each filteredOrganizations as org}
                        <Card class={`cursor-pointer transition-colors ${selectedOrganization?.id === org.id ? 'ring-2 ring-primary bg-accent' : 'hover:bg-accent'}`}
                            onclick={() => {
                                if (selectedOrganization?.id === org.id)
                                    selectedOrganization = null;
                                else{
                                    console.log(org)
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
                <p>{selectedOrganization?.id}</p>

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
        </div>
    <!-- </Card> -->
</div>