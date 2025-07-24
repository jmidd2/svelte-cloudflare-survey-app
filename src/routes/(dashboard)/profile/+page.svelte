<script lang="ts">
import {
  AlertTriangleIcon,
  ArrowLeft,
  CameraIcon,
  KeyIcon,
  LinkIcon,
  MailIcon,
  SaveIcon,
  ShieldCheckIcon,
  TrashIcon,
  UnlinkIcon,
  UserIcon,
} from '@lucide/svelte';
import { onMount } from 'svelte';
import { toast } from 'svelte-sonner';
import { superForm } from 'sveltekit-superforms';
import { zod4Client } from 'sveltekit-superforms/adapters';
import { z } from 'zod/v4';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { authClient } from '$lib/auth-client';
import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
import { Badge } from '$lib/components/ui/badge';
import { Button } from '$lib/components/ui/button';
import * as Card from '$lib/components/ui/card';
import {
  FieldErrors,
  FormControl,
  FormField,
  FormLabel,
} from '$lib/components/ui/form';
import { Input } from '$lib/components/ui/input';
import { Label } from '$lib/components/ui/label';
import { Separator } from '$lib/components/ui/separator';
import { Textarea } from '$lib/components/ui/textarea';
import { createOrganizationSchema } from '$lib/validation-schema';
import { pageState } from '$stores/pageState.svelte';
import { formDialogManager } from '$stores/SurveyDialog.svelte';

// Form state
let bio = $state('');
let profileImage = $state('');
let currentPassword = $state('');
let newPassword = $state('');
let confirmPassword = $state('');

// UI state
let isLoading = $state(false);
let isPasswordLoading = $state(false);
let isAccountLoading = $state(false);
let showPasswordSection = $state(false);
let profileImageFile = $state(null);
let previewUrl = $state('');

const { data } = $props();
$inspect(data);
const userEditSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
});
// User data and accounts
let user = $derived(data.user);
let email = $derived(user.email);
let linkedAccounts = $derived(data.linkedAccounts);
let availableProviders = $state(['google']);

const userEditForm = superForm(data.form, {
  resetForm: false,
  validators: zod4Client(userEditSchema),
  validationMethod: 'oninput',
  onError({ result }) {
    pageState.isLoading = false;
    toast.error(result.error.message);
  },
  onSubmit: () => {
    pageState.isLoading = true;
  },
  onResult: ({ result: { type, status, data } }) => {
    console.log('onResult', type, status);
    if (type === 'redirect' && status === 303) {
      pageState.isLoading = false;
      // pageState.isSaved = true;

      // toast.success('Form Saved!');
    }
    if (type === 'failure') {
      pageState.isLoading = false;
      if (data?.message) toast.error(data.message);
      else toast.error('There was an error');
    }
    if (type === 'success') {
      toast.success('Profile saved!');
    }
  },
  onUpdated: ({ form: { valid, message, data } }) => {
    pageState.isLoading = false;
    formDialogManager.closeDialog();
    if (valid) {
      pageState.isSaved = true;
      // toast.success('Form Saved!');
    }

    if (!valid && message?.type === 'error' && message.text) {
      toast.error(message.text);
    }
  },
});

const { form: formData, enhance, submitting } = userEditForm;

function getAccountInfo(account) {
  switch (account.provider) {
    case 'google':
      return {
        name: 'Google',
        icon: '🔍',
        description: 'Sign in with your Google account',
        color: 'bg-red-50 text-red-700 border-red-200',
      };
    case 'credential':
      return {
        name: 'Email & Password',
        icon: '🔐',
        description: 'Traditional email and password login',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    case 'email-otp':
      return {
        name: 'Email One-Time Password',
        icon: '📧',
        description: 'Using a one-time password sent to your email',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    default:
      return {
        name: account.provider,
        icon: '🔗',
        description: 'External authentication provider',
        color: 'bg-gray-50 text-gray-700 border-gray-200',
      };
  }
}

function hasEmailPassword() {
  return linkedAccounts.some(account => account.provider === 'credential');
}

function hasGoogleAccount() {
  return linkedAccounts.some(account => account.provider === 'google');
}

function hasEmailOneTimePassword() {
  return linkedAccounts.some(account => account.provider === 'email-otp');
}

function canUnlinkAccount(account) {
  // Don't allow unlinking if it's the only authentication method
  return linkedAccounts.length > 1;
}

async function linkGoogleAccount() {
  isAccountLoading = true;
  try {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/profile?linked=google',
    });
  } catch (error) {
    toast.error('Failed to link Google account');
    isAccountLoading = false;
  }
}

async function unlinkAccount(accountId, providerId) {
  if (!canUnlinkAccount({ providerId })) {
    toast.error('Cannot unlink your only authentication method');
    return;
  }

  if (
    !confirm(
      `Are you sure you want to unlink your ${getAccountInfo({ providerId }).name} account?`
    )
  ) {
    return;
  }

  isAccountLoading = true;
  try {
    const { error } = await authClient.unlinkAccount({
      accountId: accountId,
    });

    if (error) {
      toast.error(error.message || 'Failed to unlink account');
    } else {
      toast.success('Account unlinked successfully');
      await loadLinkedAccounts();
    }
  } catch (error) {
    toast.error('Failed to unlink account');
  } finally {
    isAccountLoading = false;
  }
}

function handleImageChange(event) {
  const file = event.target.files?.[0];
  if (file) {
    profileImageFile = file;
    const reader = new FileReader();
    reader.onload = e => {
      previewUrl = e.target?.result;
    };
    reader.readAsDataURL(file);
  }
}

async function updatePassword(event) {
  event.preventDefault();

  if (newPassword !== confirmPassword) {
    toast.error('New passwords do not match');
    return;
  }

  if (newPassword.length < 8) {
    toast.error('Password must be at least 8 characters long');
    return;
  }

  isPasswordLoading = true;

  try {
    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
    });

    if (error) {
      toast.error(error.message || 'Failed to update password');
    } else {
      toast.success('Password updated successfully');
      currentPassword = '';
      newPassword = '';
      confirmPassword = '';
      showPasswordSection = false;
    }
  } catch (error) {
    toast.error('An unexpected error occurred');
  } finally {
    isPasswordLoading = false;
  }
}

async function deleteAccount() {
  if (
    confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    )
  ) {
    try {
      const { error } = await authClient.deleteUser();
      if (error) {
        toast.error(error.message || 'Failed to delete account');
      } else {
        toast.success('Account deleted successfully');
        goto('/');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    }
  }
}

// Check for successful linking from URL params
// onMount(() => {
//   const urlParams = new URLSearchParams(window.location.search);
//   if (urlParams.get('linked') === 'google') {
//     toast.success('Google account linked successfully');
//     // Clean up URL
//     window.history.replaceState({}, '', '/profile');
//   }
// });
</script>

<svelte:head>
  <title>Profile Settings - FormBuilder</title>
  <meta name="description" content="Manage your profile settings and account information" />
</svelte:head>

<div class="container mx-auto max-w-4xl p-6">
  <div class="flex items-center gap-4 mb-4">
    <Button variant="ghost" size="sm" href={`/admin`} class="gap-2">
      <ArrowLeft class="h-4 w-4" />
      Back to Dashboard
    </Button>
  </div>
  <div class="mb-8">
    <h1 class="text-3xl font-bold tracking-tight">Profile Settings</h1>
    <p class="text-muted-foreground mt-2">
      Manage your account settings and profile information.
    </p>
    <p class="text-muted-foreground mt-2">
      For any issues or questions, please contact <a class="text-primary underline-offset-4 hover:underline" href="mailto:support@travisspark.com">support@travisspark.com</a>.
    </p>
  </div>

  <div class="grid gap-6">
    <!-- Profile Information Card -->
    <Card.Root>
      <Card.Header>
        <Card.Title class="flex items-center gap-2">
          <UserIcon class="size-5" />
          Profile Information
        </Card.Title>
        <Card.Description>
          Update your personal information and profile picture.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <form method="POST" action="?/update-profile" class="space-y-6" use:enhance>
          <!-- Profile Picture -->
<!--          <div class="flex items-center gap-6">-->
<!--            <Avatar class="size-20">-->
<!--              <AvatarImage src={previewUrl || profileImage} alt="Profile" />-->
<!--              <AvatarFallback class="text-lg">-->
<!--                {getInitials(`${firstName} ${lastName}`)}-->
<!--              </AvatarFallback>-->
<!--            </Avatar>-->
<!--            <div class="space-y-2">-->
<!--              <Label for="profile-image" class="cursor-pointer">-->
<!--                <div class="flex items-center gap-2 text-sm font-medium hover:text-primary">-->
<!--                  <CameraIcon class="size-4" />-->
<!--                  Change Photo-->
<!--                </div>-->
<!--              </Label>-->
<!--              <input-->
<!--                  id="profile-image"-->
<!--                  type="file"-->
<!--                  accept="image/*"-->
<!--                  onchange={handleImageChange}-->
<!--                  class="hidden"-->
<!--              />-->
<!--              <p class="text-xs text-muted-foreground">-->
<!--                JPG, PNG or GIF. Max size 2MB.-->
<!--              </p>-->
<!--            </div>-->
<!--          </div>-->

<!--          <Separator />-->

          <!-- Name Fields -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <FormField form={userEditForm} name="firstName">
                <FormControl>
                  {#snippet children({props})}
                    <FormLabel>First Name</FormLabel>
                    <Input
                        {...props}
                        bind:value={$formData.firstName}
                        placeholder="Enter your first name"
                    />
                    <FieldErrors />
                  {/snippet}
                </FormControl>
              </FormField>
            </div>
            <div class="space-y-2">
              <FormField form={userEditForm} name="lastName">
                <FormControl>
                  {#snippet children({props})}
                    <FormLabel>Last Name</FormLabel>
                    <Input
                        {...props}
                        bind:value={$formData.lastName}
                        placeholder="Enter your first name"
                    />
                    <FieldErrors />
                  {/snippet}
                </FormControl>
              </FormField>
            </div>
          </div>

          <!-- Email -->
          <div class="space-y-2">
            <Label for="email">Email Address</Label>
            <Input
                id="email"
                type="email"
                bind:value={email}
                placeholder="Enter your email"
                disabled
                class="bg-muted"
            />
            <p class="text-xs text-muted-foreground">
              Email cannot be changed. Contact support if you need to update your email.
            </p>
          </div>

          <!-- Bio -->
<!--          <div class="space-y-2">-->
<!--            <Label for="bio">Bio</Label>-->
<!--            <Textarea-->
<!--                id="bio"-->
<!--                bind:value={bio}-->
<!--                placeholder="Tell us a bit about yourself..."-->
<!--                rows={4}-->
<!--            />-->
<!--            <p class="text-xs text-muted-foreground">-->
<!--              Brief description for your profile. Maximum 500 characters.-->
<!--            </p>-->
<!--          </div>-->

          <!-- Save Button -->
          <div class="flex justify-end">
            <Button type="submit" disabled={$submitting} class="min-w-32">
              {#if $submitting}
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {:else}
                <SaveIcon class="size-4 mr-2" />
                Save Changes
              {/if}
            </Button>
          </div>
        </form>
      </Card.Content>
    </Card.Root>

    <!-- Linked Accounts Section -->
    <Card.Root>
      <Card.Header>
        <Card.Title class="flex items-center gap-2">
          <LinkIcon class="size-5" />
          Linked Accounts
        </Card.Title>
        <Card.Description>
          Manage your authentication methods and linked accounts.
        </Card.Description>
      </Card.Header>
      <Card.Content class="space-y-4">
        <!-- Current Linked Accounts -->
        <div class="space-y-3">
          <h4 class="text-sm font-medium">Connected Accounts</h4>
          {#if linkedAccounts.length > 0}
            {#each linkedAccounts as account}
              {@const accountInfo = getAccountInfo(account)}
              <div class="flex items-center justify-between p-4 border rounded-lg">
                <div class="flex items-center gap-3">
                  <div class="text-2xl">{accountInfo.icon}</div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-medium">{accountInfo.name}</span>
                      <Badge variant="secondary" class="text-xs">Connected</Badge>
                    </div>
                    <p class="text-sm text-muted-foreground">{accountInfo.description}</p>
                    {#if account.provider === 'google' && account.email}
                      <p class="text-xs text-muted-foreground">{account.email}</p>
                    {/if}
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  {#if canUnlinkAccount(account)}
                    <Button
                        variant="outline"
                        size="sm"
                        onclick={() => unlinkAccount(account.id, account.providerId)}
                        disabled
                        class="text-destructive hover:text-destructive"
                    >
                      <UnlinkIcon class="size-4 mr-1" />
                      Unlink
                    </Button>
                  {:else}
                    <div class="flex items-center gap-1 text-xs text-muted-foreground">
                      <ShieldCheckIcon class="size-3" />
                      Primary
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
          {:else}
            <div class="text-center py-8 text-muted-foreground">
              <LinkIcon class="size-8 mx-auto mb-2 opacity-50" />
              <p>No linked accounts found</p>
            </div>
          {/if}
        </div>

        <Separator />

        <!-- Available Providers to Link -->
        <div class="space-y-3">
          <h4 class="text-sm font-medium">Available Connections</h4>

          <!-- Google Account -->
          {#if !hasGoogleAccount()}
            <div class="flex items-center justify-between p-4 border rounded-lg border-dashed">
              <div class="flex items-center gap-3">
                <div class="text-2xl">🔍</div>
                <div>
                  <span class="font-medium">Google</span>
                  <p class="text-sm text-muted-foreground">Sign in with your Google account</p>
                </div>
              </div>
              <Button
                  variant="outline"
                  size="sm"
                  onclick={linkGoogleAccount}
                  disabled
              >
                <LinkIcon class="size-4 mr-1" />
                Link Account
              </Button>
            </div>
          {/if}
          {#if !hasEmailOneTimePassword()}
          <!-- Email/Password Info -->
          <div class="flex items-center justify-between p-4 border rounded-lg border-dashed">
            <div class="flex items-center gap-3">
              <div class="text-2xl">📧</div>
              <div>
                <span class="font-medium">Email One-Time Password</span>
                <p class="text-sm text-muted-foreground">One-time password via email</p>
              </div>
            </div>
            <Badge variant="secondary" class="text-xs">Always Available</Badge>
          </div>
          {/if}
          {#if linkedAccounts.length <= 1}
            <div class="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertTriangleIcon class="size-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div class="text-sm">
                <p class="font-medium text-amber-800 dark:text-amber-200">Security Recommendation</p>
                <p class="text-amber-700 dark:text-amber-300">
                  Link multiple authentication methods to ensure you can always access your account.
                </p>
              </div>
            </div>
          {/if}
        </div>
      </Card.Content>
    </Card.Root>

    <!-- Password Section -->
    <Card.Root>
      <Card.Header>
        <Card.Title class="flex items-center gap-2">
          <KeyIcon class="size-5" />
          Password & Security
        </Card.Title>
        <Card.Description>
          Update your password to keep your account secure.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        {#if !hasEmailPassword()}
          <div class="text-center py-6">
            <KeyIcon class="size-8 mx-auto mb-2 opacity-50 text-muted-foreground" />
            <p class="text-sm text-muted-foreground mb-4">
              You don't have a password set. You're currently using social login or email OTP.
            </p>
            <Button variant="outline" class="w-full md:w-auto" disabled>
              Set Up Password
            </Button>
          </div>
        {:else if !showPasswordSection}
          <Button
              variant="outline"
              onclick={() => showPasswordSection = true}
              class="w-full md:w-auto"
          >
            Change Password
          </Button>
        {:else}
          <form onsubmit={updatePassword} class="space-y-4">
            <div class="space-y-2">
              <Label for="currentPassword">Current Password</Label>
              <Input
                  id="currentPassword"
                  type="password"
                  bind:value={currentPassword}
                  placeholder="Enter your current password"
                  required
              />
            </div>

            <div class="space-y-2">
              <Label for="newPassword">New Password</Label>
              <Input
                  id="newPassword"
                  type="password"
                  bind:value={newPassword}
                  placeholder="Enter your new password"
                  required
              />
            </div>

            <div class="space-y-2">
              <Label for="confirmPassword">Confirm New Password</Label>
              <Input
                  id="confirmPassword"
                  type="password"
                  bind:value={confirmPassword}
                  placeholder="Confirm your new password"
                  required
              />
            </div>

            <div class="flex gap-2">
              <Button type="submit" disabled={isPasswordLoading} class="min-w-32">
                {#if isPasswordLoading}
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {:else}
                  Update Password
                {/if}
              </Button>
              <Button
                  type="button"
                  variant="outline"
                  onclick={() => {
                  showPasswordSection = false;
                  currentPassword = '';
                  newPassword = '';
                  confirmPassword = '';
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        {/if}
      </Card.Content>
    </Card.Root>

    <!-- Danger Zone -->
    <Card.Root class="border-destructive/50">
      <Card.Header>
        <Card.Title class="flex items-center gap-2 text-destructive">
          <TrashIcon class="size-5" />
          Danger Zone
        </Card.Title>
        <Card.Description>
          Irreversible and destructive actions.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <div class="space-y-4">
          <div>
            <h4 class="font-medium text-destructive">Delete Account</h4>
            <p class="text-sm text-muted-foreground mt-1">
              Once you delete your account, there is no going back. Please be certain.
            </p>
          </div>
          <Button
              variant="destructive"
              class="w-full md:w-auto"
              disabled
          >
            <TrashIcon class="size-4 mr-2" />
            Delete Account
          </Button>
        </div>
      </Card.Content>
    </Card.Root>
  </div>
</div>
