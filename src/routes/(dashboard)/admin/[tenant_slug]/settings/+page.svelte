<script lang="ts">
import {
  AlertTriangle,
  Building2,
  Copy,
  Eye,
  EyeOff,
  Globe,
  Mail,
  MapPin,
  Palette,
  Phone,
  RefreshCw,
  SaveIcon,
  Settings,
  Shield,
  Trash2,
  Upload,
  Users,
} from '@lucide/svelte';
// import { getBreadcrumbContext } from '../breadcrumbContext.svelte';
import { toast } from 'svelte-sonner';
import { superForm } from 'sveltekit-superforms';
import { zod4Client } from 'sveltekit-superforms/adapters';
import { z } from 'zod/v4';
import { enhance } from '$app/forms';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '$lib/components/ui/dialog';
import {
  FieldErrors,
  FormControl,
  FormField,
  FormLabel,
} from '$lib/components/ui/form';
import { Input } from '$lib/components/ui/input';
import { Label } from '$lib/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '$lib/components/ui/select';
import { Separator } from '$lib/components/ui/separator';
import { Switch } from '$lib/components/ui/switch';
import { Textarea } from '$lib/components/ui/textarea';
import { getInitials } from '$lib/utils';
import { createOrganizationSchema } from '$lib/validation-schema';
import { pageState } from '$stores/pageState.svelte';
import { formDialogManager } from '$stores/SurveyDialog.svelte';

const updateOrgSchema = z.object({
  name: z.string().min(2),
  slug: z.string(),
  description: z.string(),
});

const { data, form } = $props();

let tenant = $derived(data.tenant);
const isOrgOwner = $derived(data.tenant?.isOwner ?? false);
const isOrgAdmin = $derived(data.tenant?.isAdmin ?? false);

const updateForm = superForm(data.form, {
  resetForm: false,
  validators: zod4Client(updateOrgSchema),
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

const { form: updateFormData, enhance: enhanceUpdate } = updateForm;

// Get breadcrumb context for loading states
// const breadcrumbStatus = getBreadcrumbContext();

// Form state
let formData = $derived({
  name: tenant?.name || '',
  slug: tenant?.slug || '',
  description: tenant?.description || '',
  website: tenant?.website || '',
  email: tenant?.email || '',
  phone: tenant?.phone || '',
  address: tenant?.address || '',
  logo: null as File | null,
  // primaryColor: tenant?.primaryColor || '#d85a1f',
  allowPublicSignup: tenant?.allowPublicSignup ?? false,
  requireApproval: true,
  maxMembers: tenant?.maxMembers || 50,
  timezone: tenant?.timezone || 'UTC',
});

// UI state
let isLoading = $state(false);
let logoPreview = $derived(tenant?.logo || '');
let slugManuallyEdited = $state(false);
let showDeleteDialog = $state(false);

// Auto-generate slug from name
$effect(() => {
  if (!slugManuallyEdited && $updateFormData.name) {
    $updateFormData.slug = $updateFormData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
});

// Validation functions
function validateEmail(email: string): boolean {
  if (!email) return true; // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateUrl(url: string): boolean {
  if (!url) return true; // Optional field
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
}

function validateSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length >= 3;
}

// Handle logo upload
function handleLogoUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    formData.logo = file;

    // Create preview
    const reader = new FileReader();
    reader.onload = e => {
      logoPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
}

// Handle form submission
async function handleSubmit(event: Event) {
  event.preventDefault();

  // Validation
  if (!formData.name.trim()) {
    toast.error('Organization name is required');
    return;
  }

  if (!validateSlug(formData.slug)) {
    toast.error(
      'Slug must be at least 3 characters and contain only lowercase letters, numbers, and hyphens'
    );
    return;
  }

  if (formData.email && !validateEmail(formData.email)) {
    toast.error('Please enter a valid email address');
    return;
  }

  if (formData.website && !validateUrl(formData.website)) {
    toast.error('Please enter a valid website URL');
    return;
  }

  isLoading = true;
  // breadcrumbStatus.isLoading = true;

  // try {
  //   // Simulate API call
  //   await new Promise(resolve => setTimeout(resolve, 2000));
  //
  //   // Here you would make the actual API call to update the organization
  //   console.log('Updating organization:', formData);
  //
  //   toast.success('Organization settings updated successfully!');
  //   breadcrumbStatus.isSaved = true;
  //
  //   setTimeout(() => {
  //     breadcrumbStatus.isSaved = false;
  //   }, 3000);
  // } catch (error) {
  //   toast.error('Failed to update organization settings. Please try again.');
  //   console.error('Error updating organization:', error);
  // } finally {
  //   isLoading = false;
  //   breadcrumbStatus.isLoading = false;
  // }
}

// Handle organization deletion
async function handleDeleteOrganization() {
  if (!isOrgOwner) {
    toast.error('Only organization owners can delete the organization');
    return;
  }

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast.success('Organization deleted successfully');
    // Redirect would happen here
    console.log('Organization deleted');
  } catch (error) {
    toast.error('Failed to delete organization');
  }

  showDeleteDialog = false;
}

// Generate new API key
// async function generateApiKey() {
//   try {
//     // Simulate API call
//     await new Promise(resolve => setTimeout(resolve, 1000));
//
//     apiKey = `sk_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
//     toast.success('New API key generated');
//   } catch (error) {
//     toast.error('Failed to generate API key');
//   }
// }

// Copy API key to clipboard
// function copyApiKey() {
//   navigator.clipboard.writeText(apiKey);
//   toast.success('API key copied to clipboard');
// }

// function getInitials(name: string): string {
//   return (
//     name
//       ?.split(' ')
//       .map(n => n[0])
//       .join('')
//       .toUpperCase() || 'O'
//   );
// }

// Handle slug manual editing
function handleSlugChange() {
  slugManuallyEdited = true;
}

const timezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
];
</script>

<svelte:head>
  <title>Organization Settings - {tenant?.name}</title>
</svelte:head>

<div class="p-6 space-y-8">
  <!-- Header -->
  <div>
    <h1 class="text-3xl font-bold text-foreground flex items-center gap-3">
      <Settings class="h-8 w-8 text-primary" />
      Organization Settings
    </h1>
    <p class="text-muted-foreground mt-1">
      Manage your organization's information, branding, and preferences
    </p>
  </div>

  <form method="POST" action="?/update-org" use:enhanceUpdate class="space-y-8 pb-10">
    <!-- Basic Information -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center gap-2">
          <Building2 class="h-5 w-5" />
          Basic Information
        </CardTitle>
        <CardDescription>
          Essential details about your organization
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <!-- Organization Logo -->
<!--        <div class="space-y-4">-->
<!--          <Label>Organization Logo</Label>-->
<!--          <div class="flex items-center gap-6">-->
<!--            <Avatar class="h-20 w-20">-->
<!--              <AvatarImage src={logoPreview} alt="Organization logo" />-->
<!--              <AvatarFallback class="text-lg bg-primary/10 text-primary">-->
<!--                {getInitials(tenant.name)}-->
<!--              </AvatarFallback>-->
<!--            </Avatar>-->
<!--            <div class="space-y-2">-->
<!--              <Label for="logo" class="cursor-pointer">-->
<!--                <div class="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80">-->
<!--                  <Upload class="h-4 w-4" />-->
<!--                  {logoPreview ? 'Change Logo' : 'Upload Logo'}-->
<!--                </div>-->
<!--              </Label>-->
<!--              <Input-->
<!--                  id="logo"-->
<!--                  type="file"-->
<!--                  accept="image/*"-->
<!--                  onchange={handleLogoUpload}-->
<!--                  class="hidden"-->
<!--              />-->
<!--              <p class="text-xs text-muted-foreground">-->
<!--                PNG, JPG, or SVG. Max 5MB. Recommended: 200x200px-->
<!--              </p>-->
<!--            </div>-->
<!--          </div>-->
<!--        </div>-->

<!--        <Separator />-->

        <!-- Organization Name -->
          <FormField form={updateForm} name="name">
            <FormControl>
              {#snippet children({props})}
                <FormLabel>Organization Name *</FormLabel>
                <Input
                    {...props}
                    bind:value={$updateFormData.name}
                    placeholder="Enter organization name"
                />
                <FieldErrors />
              {/snippet}
            </FormControl>
          </FormField>

        <!-- Organization Slug -->
          <FormField form={updateForm} name="slug">
            <FormControl>
              {#snippet children({props})}
                <FormLabel>Organization URL *</FormLabel>
                <div class="flex items-center gap-2">
                  <span class="text-sm text-muted-foreground whitespace-nowrap">formbuilder.com/org/</span>
                  <Input
                      {...props}
                      bind:value={$updateFormData.slug}
                      oninput={handleSlugChange}
                      placeholder="organization-slug"
                      class="flex-1"
                  />
                </div>
                <p class="text-sm text-muted-foreground">
                  This will be used in your organization's URL. Only lowercase letters, numbers, and hyphens allowed.
                </p>
                <FieldErrors />
              {/snippet}
            </FormControl>
          </FormField>

        <!-- Description -->
          <FormField form={updateForm} name="description">
            <FormControl>
              {#snippet children({props})}
                <FormLabel>Description</FormLabel>
                <Textarea
                    {...props}
                    bind:value={$updateFormData.description}
                    placeholder="Brief description of your organization"
                    rows={3}
                />
                <FieldErrors />
              {/snippet}
            </FormControl>
          </FormField>
        <!-- Save Button -->
        <div class="flex items-center justify-between">
          <div class="text-sm text-muted-foreground">
            {#if !isOrgAdmin}
              <div class="flex items-center gap-2 text-amber-600">
                <AlertTriangle class="h-4 w-4" />
                You need admin permissions to modify these settings
              </div>
            {/if}
          </div>

          <Button type="submit" disabled={isLoading || !isOrgAdmin} class="min-w-32">
            {#if isLoading}
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            {:else}
              <SaveIcon class="h-4 w-4 mr-2" />
              Save Changes
            {/if}
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Contact Information -->
<!--    <Card>-->
<!--      <CardHeader>-->
<!--        <CardTitle class="flex items-center gap-2">-->
<!--          <Mail class="h-5 w-5" />-->
<!--          Contact Information-->
<!--        </CardTitle>-->
<!--        <CardDescription>-->
<!--          How people can reach your organization-->
<!--        </CardDescription>-->
<!--      </CardHeader>-->
<!--      <CardContent class="space-y-6">-->
<!--        &lt;!&ndash; Website &ndash;&gt;-->
<!--        <div class="space-y-2">-->
<!--          <Label for="website" class="flex items-center gap-2">-->
<!--            <Globe class="h-4 w-4" />-->
<!--            Website-->
<!--          </Label>-->
<!--          <Input-->
<!--              id="website"-->
<!--              bind:value={formData.website}-->
<!--              placeholder="https://example.com"-->
<!--          />-->
<!--        </div>-->

<!--        &lt;!&ndash; Email &ndash;&gt;-->
<!--        <div class="space-y-2">-->
<!--          <Label for="email" class="flex items-center gap-2">-->
<!--            <Mail class="h-4 w-4" />-->
<!--            Contact Email-->
<!--          </Label>-->
<!--          <Input-->
<!--              id="email"-->
<!--              type="email"-->
<!--              bind:value={formData.email}-->
<!--              placeholder="contact@example.com"-->
<!--          />-->
<!--        </div>-->

<!--        &lt;!&ndash; Phone &ndash;&gt;-->
<!--        <div class="space-y-2">-->
<!--          <Label for="phone" class="flex items-center gap-2">-->
<!--            <Phone class="h-4 w-4" />-->
<!--            Phone Number-->
<!--          </Label>-->
<!--          <Input-->
<!--              id="phone"-->
<!--              bind:value={formData.phone}-->
<!--              placeholder="+1 (555) 123-4567"-->
<!--          />-->
<!--        </div>-->

<!--        &lt;!&ndash; Address &ndash;&gt;-->
<!--        <div class="space-y-2">-->
<!--          <Label for="address" class="flex items-center gap-2">-->
<!--            <MapPin class="h-4 w-4" />-->
<!--            Address-->
<!--          </Label>-->
<!--          <Textarea-->
<!--              id="address"-->
<!--              bind:value={formData.address}-->
<!--              placeholder="123 Main St, City, State 12345"-->
<!--              rows={2}-->
<!--          />-->
<!--        </div>-->
<!--      </CardContent>-->
<!--    </Card>-->

    <!-- Branding & Appearance -->
<!--    <Card>-->
<!--      <CardHeader>-->
<!--        <CardTitle class="flex items-center gap-2">-->
<!--          <Palette class="h-5 w-5" />-->
<!--          Branding & Appearance-->
<!--        </CardTitle>-->
<!--        <CardDescription>-->
<!--          Customize the look and feel of your organization-->
<!--        </CardDescription>-->
<!--      </CardHeader>-->
<!--      <CardContent class="space-y-6">-->
<!--        &lt;!&ndash; Primary Color &ndash;&gt;-->
<!--        <div class="space-y-2">-->
<!--          <Label for="primaryColor">Primary Color</Label>-->
<!--          <div class="flex items-center gap-4">-->
<!--            <Input-->
<!--                id="primaryColor"-->
<!--                type="color"-->
<!--                bind:value={formData.primaryColor}-->
<!--                class="w-20 h-10 p-1 border rounded"-->
<!--            />-->
<!--            <Input-->
<!--                bind:value={formData.primaryColor}-->
<!--                placeholder="#d85a1f"-->
<!--                class="flex-1"-->
<!--            />-->
<!--          </div>-->
<!--          <p class="text-sm text-muted-foreground">-->
<!--            This color will be used for buttons, links, and other UI elements-->
<!--          </p>-->
<!--        </div>-->

<!--        &lt;!&ndash; Timezone &ndash;&gt;-->
<!--        <div class="space-y-2">-->
<!--          <Label for="timezone">Timezone</Label>-->
<!--          <Select type="single" bind:value={formData.timezone}>-->
<!--            <SelectTrigger>-->
<!--              {formData.timezone ? formData.timezone : 'Select a timezone'}-->
<!--            </SelectTrigger>-->
<!--            <SelectContent>-->
<!--              {#each timezones as tz}-->
<!--                <SelectItem value={tz}>{tz}</SelectItem>-->
<!--              {/each}-->
<!--            </SelectContent>-->
<!--          </Select>-->
<!--        </div>-->
<!--      </CardContent>-->
<!--    </Card>-->

    <!-- Organization Settings -->
<!--    <Card>-->
<!--      <CardHeader>-->
<!--        <CardTitle class="flex items-center gap-2">-->
<!--          <Users class="h-5 w-5" />-->
<!--          Member Settings-->
<!--        </CardTitle>-->
<!--        <CardDescription>-->
<!--          Configure how new members can join your organization-->
<!--        </CardDescription>-->
<!--      </CardHeader>-->
<!--      <CardContent class="space-y-6">-->
<!--        &lt;!&ndash; Allow Public Signup &ndash;&gt;-->
<!--        <div class="flex items-center justify-between">-->
<!--          <div class="space-y-0.5">-->
<!--            <Label>Allow Public Signup</Label>-->
<!--            <p class="text-sm text-muted-foreground">-->
<!--              Allow anyone to request to join your organization-->
<!--            </p>-->
<!--          </div>-->
<!--          <Switch bind:checked={formData.allowPublicSignup} />-->
<!--        </div>-->

<!--        &lt;!&ndash; Require Approval &ndash;&gt;-->
<!--        <div class="flex items-center justify-between">-->
<!--          <div class="space-y-0.5">-->
<!--            <Label>Require Admin Approval</Label>-->
<!--            <p class="text-sm text-muted-foreground">-->
<!--              New member requests must be approved by an admin-->
<!--            </p>-->
<!--          </div>-->
<!--          <Switch bind:checked={formData.requireApproval} />-->
<!--        </div>-->

<!--        &lt;!&ndash; Max Members &ndash;&gt;-->
<!--        <div class="space-y-2">-->
<!--          <Label for="maxMembers">Maximum Members</Label>-->
<!--          <Input-->
<!--              id="maxMembers"-->
<!--              type="number"-->
<!--              bind:value={formData.maxMembers}-->
<!--              min="1"-->
<!--              max="1000"-->
<!--              placeholder="50"-->
<!--          />-->
<!--          <p class="text-sm text-muted-foreground">-->
<!--            Maximum number of members allowed in your organization-->
<!--          </p>-->
<!--        </div>-->
<!--      </CardContent>-->
<!--    </Card>-->

    <!-- API Access -->
<!--    <Card>-->
<!--      <CardHeader>-->
<!--        <CardTitle class="flex items-center gap-2">-->
<!--          <Shield class="h-5 w-5" />-->
<!--          API Access-->
<!--        </CardTitle>-->
<!--        <CardDescription>-->
<!--          Manage API keys for programmatic access to your organization-->
<!--        </CardDescription>-->
<!--      </CardHeader>-->
<!--      <CardContent class="space-y-4">-->
<!--        <div class="space-y-2">-->
<!--          <Label>API Key</Label>-->
<!--          <div class="flex items-center gap-2">-->
<!--            <Input-->
<!--                type={showApiKey ? 'text' : 'password'}-->
<!--                value={apiKey}-->
<!--                readonly-->
<!--                class="flex-1 font-mono text-sm"-->
<!--            />-->
<!--            <Button-->
<!--                type="button"-->
<!--                variant="outline"-->
<!--                size="sm"-->
<!--                onclick={() => showApiKey = !showApiKey}-->
<!--            >-->
<!--              {#if showApiKey}-->
<!--                <EyeOff class="h-4 w-4" />-->
<!--              {:else}-->
<!--                <Eye class="h-4 w-4" />-->
<!--              {/if}-->
<!--            </Button>-->
<!--            <Button-->
<!--                type="button"-->
<!--                variant="outline"-->
<!--                size="sm"-->
<!--                onclick={copyApiKey}-->
<!--            >-->
<!--              <Copy class="h-4 w-4" />-->
<!--            </Button>-->
<!--            <Button-->
<!--                type="button"-->
<!--                variant="outline"-->
<!--                size="sm"-->
<!--                onclick={generateApiKey}-->
<!--            >-->
<!--              <RefreshCw class="h-4 w-4" />-->
<!--            </Button>-->
<!--          </div>-->
<!--          <p class="text-sm text-muted-foreground">-->
<!--            Use this API key to access your organization's data programmatically-->
<!--          </p>-->
<!--        </div>-->
<!--      </CardContent>-->
<!--    </Card>-->
  </form>

  <!-- Danger Zone -->
  {#if isOrgOwner}
    <Card class="border-destructive/50">
      <CardHeader>
        <CardTitle class="flex items-center gap-2 text-destructive">
          <Trash2 class="h-5 w-5" />
          Danger Zone
        </CardTitle>
        <CardDescription>
          Irreversible and destructive actions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <Alert class="border-destructive/50 bg-destructive/5">
            <AlertTriangle class="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> Deleting your organization will permanently remove all forms,
              responses, and member data. This action cannot be undone.
            </AlertDescription>
          </Alert>

          <Button
              variant="destructive"
              onclick={() => showDeleteDialog = true}
              class="w-full md:w-auto"
          >
            <Trash2 class="h-4 w-4 mr-2" />
            Delete Organization
          </Button>
        </div>
      </CardContent>
    </Card>
  {/if}
</div>

<!-- Delete Confirmation Dialog -->
<Dialog bind:open={showDeleteDialog}>
  <DialogContent class="sm:max-w-md">
    <form method="POST" action="?/delete-org" use:enhance class="contents">
      <input type="hidden" name="id" value="{tenant.id}" />
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2 text-destructive">
          <AlertTriangle class="h-5 w-5" />
          Delete Organization
        </DialogTitle>
        <DialogDescription>
          This action cannot be undone. This will permanently delete the organization
          <strong>"{tenant.name}"</strong> and all associated data.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <Alert class="border-destructive/50 bg-destructive/5">
          <AlertTriangle class="h-4 w-4" />
          <AlertDescription class="text-sm">
            <strong>This will delete:</strong>
            <ul class="list-disc list-inside mt-2 space-y-1">
              <li>All forms and form responses</li>
              <li>All organization members</li>
              <li>All organization settings</li>
              <li>All associated data</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div class="space-y-2">
          <Label for="confirmDelete">
            Type <strong>{tenant.name}</strong> to confirm:
          </Label>
          <Input
              id="confirmDelete"
              placeholder={tenant.name}
          />
        </div>
      </div>

      <DialogFooter class="gap-2">
        <Button variant="outline" type="button" onclick={() => showDeleteDialog = false}>
          Cancel
        </Button>
        <Button variant="destructive" type="submit">
          <Trash2 class="h-4 w-4 mr-2" />
          Delete Organization
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
