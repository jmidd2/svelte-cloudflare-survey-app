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

let { form, data } = $props();

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
const getStartingStep = () => {
  if (needsProfile) return 1;
  if (needsOrganization) return 1;
  return 1; // Fallback, though user should be redirected
};

const getTotalSteps = () => {
  let steps = 0;
  if (needsProfile) steps++;
  if (needsOrganization) steps += 2;
  return Math.max(steps, 1);
};

// UI State
let currentStep = $state(1);
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
onMount(() => {
  if (isComplete) {
    goto('/dashboard');
  }
});

// Filtered organizations based on search
const filteredOrganizations = $derived.by(() => {
  if (!searchQuery) return data.organizations;
  return data.organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
});

// Helper functions
function getInitials(name: string) {
  return (
    name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase() || '?'
  );
}

function nextStep() {
  // Skip to organization step if profile is already complete
  if (currentStep === 1 && !needsProfile && needsOrganization) {
    currentStep = 2;
  } else {
    currentStep++;
  }
}

function prevStep() {
  // Skip back to profile step if it's needed

  // if needOrg and needName org steps are 3 and 4
  if (needsOrganization && needsProfile && currentStep > 2) {
    currentStep = 2;
  } else if (needsOrganization) {
    currentStep = 1;
  } else {
    currentStep--;
  }
}

function selectCreateOrganization() {
  currentStep = needsProfile ? 3 : 2; // Adjust step number based on whether profile step exists
}

function selectJoinOrganization() {
  currentStep = needsProfile ? 4 : 3; // Adjust step number based on whether profile step exists
}

// Get the actual step number for display (accounting for skipped steps)
const getDisplayStep = (step: number) => {
  if (step === 4 || (!needsProfile && step === 3)) return step - 1;
  return step;
};

const getMaxDisplaySteps = () => {
  return getTotalSteps(); // +1 for the choice step
};

// Form submission handlers remain the same...
const handleProfileSubmit: SubmitFunction = () => {
  return async ({ result }) => {
    loading = true;

    if (result.type === 'success') {
      status = { type: 'success', message: 'Profile saved successfully!' };
      setTimeout(() => {
        if (needsOrganization) {
          hasName = true;
          nextStep();
        } else {
          goto('/admin');
        }
        status = null;
      }, 1000);
    } else {
      status = {
        type: 'error',
        message: 'There was an error saving your profile. Please try again.',
      };
    }

    loading = false;
  };
};

const handleOrganizationCreate: SubmitFunction = () => {
  return async ({ result }) => {
    loading = true;

    if (result.type === 'success') {
      status = {
        type: 'success',
        message: 'Organization created successfully!',
      };
      setTimeout(() => {
        goto('/admin');
      }, 2000);
    } else {
      let message =
        'There was an error creating your organization. Please try again.';
      if (result.data.error === 'SLUG_IS_TAKEN')
        message =
          'An organization with this name already exists. Please choose a different name.';

      status = {
        type: 'error',
        message,
      };
    }

    loading = false;
  };
};

const handleJoinRequest: SubmitFunction = () => {
  return async ({ result }) => {
    loading = true;
    if (result.type === 'redirect') {
      goto(result.location);
    } else if (result.type === 'success') {
      status = { type: 'success', message: 'Join request sent successfully!' };
      setTimeout(() => {
        goto('/');
      }, 2000);
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
  <title>Complete Your Setup</title>
</svelte:head>

<div class="flex items-center justify-center bg-background p-4">
  <div class="w-full max-w-2xl mt-10">
    <h1 class="text-center text-2xl text-foreground mb-8">Please complete your profile</h1>
    <!-- Progress Indicator -->
    <div class="mb-8">
      <div class="flex items-center justify-center space-x-4">
        {#each Array(getMaxDisplaySteps()).fill(0) as _, index}
          {@const step = index + 1}
          <div class="flex items-center">
            <div class={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${getDisplayStep(currentStep) >= step
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'}
            `}>
              {#if step <= getDisplayStep(currentStep) - 1}
                <Check class="h-4 w-4" />
              {:else}
                {step}
              {/if}
            </div>
            {#if step < getMaxDisplaySteps()}
              <div class={`
                w-12 h-0.5 ml-4
                ${getDisplayStep(currentStep) > step ? 'bg-primary' : 'bg-muted'}
              `}></div>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <!-- Completion Status Banner -->
      <Card class="mb-6">
        <CardContent class="px-4">
          <div class="flex items-center gap-3">
<!--            <CheckCircle class="h-5 w-5 text-green-600 dark:text-green-400" />-->
            <div>
              <p class="font-medium">Setup Progress</p>
              <div class="flex items-center gap-4 mt-1">
                {#if hasName}
                  <Badge variant="secondary" class="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                    <Check class="h-3 w-3 mr-1" />
                    Info Complete
                  </Badge>
                {:else}
                  <Badge variant="destructive" class="">
                    <Check class="h-3 w-3 mr-1" />
                    Info Required
                  </Badge>
                {/if}
                {#if hasOrganization}
                  <Badge variant="secondary" class="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                    <Check class="h-3 w-3 mr-1" />
                    Organization: {userOrganizations[0]?.name}
                  </Badge>
                {:else}
                  <Badge variant="destructive" class="">
                    <Check class="h-3 w-3 mr-1" />
                    Organization Required
                  </Badge>
                {/if}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    <!-- Step 1: Profile Completion - Only show if needed -->
    {#if currentStep === 1 && needsProfile}
      <Card>
        <CardHeader class="text-center">
          <CardTitle class="text-2xl flex items-center justify-center gap-2">
            <User class="h-6 w-6" />
            Complete Your Profile
          </CardTitle>
          <CardDescription>
            Please provide your name to get started
          </CardDescription>
        </CardHeader>

        <CardContent>
          {#if status}
            <Alert class={`mb-4 ${status.type === 'error' ? 'border-destructive/50 bg-destructive/5' : 'border-green-200 bg-green-50 dark:bg-green-950/20'}`}>
              <AlertDescription class={status.type === 'error' ? 'text-destructive' : 'text-green-800 dark:text-green-200'}>
                {status.message}
              </AlertDescription>
            </Alert>
          {/if}

          <form
              method="POST"
              action="?/profile"
              class="space-y-4"
              use:enhance={handleProfileSubmit}
          >
            <div class="space-y-2">
              <Label for="name">Full Name</Label>
              <Input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Enter your full name"
                  bind:value={profileData.name}
                  required
              />
            </div>

            <Button
                type="submit"
                class="w-full"
                disabled={loading || !profileData.name.trim()}
            >
              {loading ? 'Saving...' : 'Continue'}
              <ArrowRight class="h-4 w-4 ml-2" />
            </Button>
          </form>
        </CardContent>
      </Card>
    {/if}

    <!-- Step 2: Organization Choice - Show if no organization -->
    {#if (currentStep === 2 && needsProfile && needsOrganization) || (currentStep === 1 && !needsProfile && needsOrganization)}
      <Card>
        <CardHeader class="text-center">
          <CardTitle class="text-2xl flex items-center justify-center gap-2">
            <Building2 class="h-6 w-6" />
            Choose Your Organization
          </CardTitle>
          <CardDescription>
            Create a new organization or join an existing one
          </CardDescription>
        </CardHeader>

        <CardContent class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Create Organization Option -->
            <Card class="cursor-pointer hover:bg-accent/20 transition-colors" onclick={selectCreateOrganization}>
              <CardContent class="p-6 text-center">
                <div class="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Plus class="h-6 w-6 text-primary" />
                </div>
                <h3 class="font-semibold text-lg mb-2">Create Organization</h3>
                <p class="text-sm text-muted-foreground mb-4">
                  Start fresh with your own organization and invite team members
                </p>
                <Button class="w-full">
                  Create New
                  <ArrowRight class="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <!-- Join Organization Option -->
            <Card class="cursor-pointer hover:bg-accent/20 transition-colors" onclick={selectJoinOrganization}>
              <CardContent class="p-6 text-center">
                <div class="h-12 w-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users class="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 class="font-semibold text-lg mb-2">Join Organization</h3>
                <p class="text-sm text-muted-foreground mb-4">
                  Request to join an existing organization
                </p>
                <Button variant="outline" class="w-full">
                  Browse Organizations
                  <ArrowRight class="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>

          <div class="flex justify-center">
            {#if needsProfile}
              <Button variant="ghost" onclick={prevStep}>
                <ArrowLeft class="h-4 w-4 mr-2" />
                Back
              </Button>
            {/if}
          </div>
        </CardContent>
      </Card>
    {/if}

    <!-- Step 3: Create Organization - Adjust step numbers -->
    {#if (currentStep === 3 && needsProfile) || (currentStep === 2 && !needsProfile)}
      <Card>
        <CardHeader class="text-center">
          <CardTitle class="text-2xl flex items-center justify-center gap-2">
            <Plus class="h-6 w-6" />
            Create Your Organization
          </CardTitle>
          <CardDescription>
            Set up your organization details
          </CardDescription>
        </CardHeader>

        <CardContent>
          {#if status}
            <Alert class={`mb-4 ${status.type === 'error' ? 'border-destructive/50 bg-destructive/5' : 'border-green-200 bg-green-50 dark:bg-green-950/20'}`}>
              <AlertDescription class={status.type === 'error' ? 'text-destructive' : 'text-green-800 dark:text-green-200'}>
                {status.message}
              </AlertDescription>
            </Alert>
          {/if}

          <form
              method="POST"
              action="?/create-organization"
              class="space-y-4"
              use:enhance={handleOrganizationCreate}
          >
            <div class="space-y-2">
              <Label for="orgName">Organization Name</Label>
              <Input
                  type="text"
                  id="orgName"
                  name="name"
                  placeholder="Enter organization name"
                  bind:value={organizationData.name}
                  required
              />
            </div>

            <div class="space-y-2">
              <Label for="orgDescription">Description (Optional)</Label>
              <Input
                  type="text"
                  id="orgDescription"
                  name="description"
                  placeholder="Brief description of your organization"
                  bind:value={organizationData.description}
              />
            </div>

            <Alert>
              <Building2 class="h-4 w-4" />
              <AlertDescription>
                You'll be set as the organization owner and can invite team members after creation.
              </AlertDescription>
            </Alert>

            <div class="flex gap-3">
              <Button variant="outline" onclick={prevStep} class="flex-1">
                <ArrowLeft class="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                  type="submit"
                  class="flex-1"
                  disabled={loading || !organizationData.name.trim()}
              >
                {loading ? 'Creating...' : 'Create Organization'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    {/if}

    <!-- Step 4: Join Organization - Adjust step numbers -->
    {#if (currentStep === 4 && needsProfile) || (currentStep === 3 && !needsProfile)}
      <Card>
        <CardHeader class="text-center">
          <CardTitle class="text-2xl flex items-center justify-center gap-2">
            <Search class="h-6 w-6" />
            Join an Organization
          </CardTitle>
          <CardDescription>
            Search and request to join an existing organization
          </CardDescription>
        </CardHeader>

        <CardContent>
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
                      else
                        selectedOrganization = org;
                    }}>
                <CardContent class="p-4">
                  <div class="flex items-center gap-4">
                    <Avatar class="h-12 w-12">
                      <AvatarImage src={org.logo || "/placeholder.svg"} alt={org.name} />
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
                <Button variant="outline" onclick={prevStep} class="flex-1">
                  <ArrowLeft class="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button type="submit" class="flex-1" disabled={loading || !selectedOrganization}>
                  {loading ? 'Sending Request...' : 'Request to Join'}
                </Button>
              </div>
            </form>
        </CardContent>
      </Card>
    {/if}
  </div>
</div>
