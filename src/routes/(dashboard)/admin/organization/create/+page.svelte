<script lang="ts">
import {
  ArrowLeft,
  Building2,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Upload,
} from '@lucide/svelte';
import { toast } from 'svelte-sonner';
import SuperDebug, { superForm } from 'sveltekit-superforms';
import { zod4Client } from 'sveltekit-superforms/adapters';
import { goto } from '$app/navigation';
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

const { data } = $props();

const createForm = superForm(data.form, {
  resetForm: false,
  validators: zod4Client(createOrganizationSchema),
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
const { form: formData, enhance } = createForm;

let isSubmitting = $state(false);
// let logoPreview = $state('');
let slugManuallyEdited = $state(false);

// Handle logo upload
// function handleLogoUpload(event: Event) {
//     const target = event.target as HTMLInputElement;
//     const file = target.files?.[0];
//
//     if (file) {
//         // Validate file type
//         if (!file.type.startsWith('image/')) {
//             toast.error('Please select an image file');
//             return;
//         }
//
//         // Validate file size (max 5MB)
//         if (file.size > 5 * 1024 * 1024) {
//             toast.error('Image size must be less than 5MB');
//             return;
//         }
//
//         formData.logo = file;
//
//         // Create preview
//         const reader = new FileReader();
//         reader.onload = (e) => {
//             logoPreview = e.target?.result as string;
//         };
//         reader.readAsDataURL(file);
//     }
// }

// Handle form submission

// Handle slug manual editing
function handleSlugChange() {
  slugManuallyEdited = true;
}

function handleNameChange() {
  if (!slugManuallyEdited && $formData.name) {
    $formData.slug = $formData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
</script>

<svelte:head>
    <title>Create Organization - FormBuilder</title>
</svelte:head>

<div class="container mx-auto py-8 px-4 max-w-4xl">
    <!-- Header -->
    <div class="mb-8">
        <div class="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="sm" onclick={() => goto('/admin')} class="gap-2">
                <ArrowLeft class="h-4 w-4" />
                Back to Admin
            </Button>
        </div>

        <div class="flex items-center gap-3 mb-2">
            <div class="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 class="h-5 w-5 text-primary" />
            </div>
            <div>
                <h1 class="text-3xl font-bold">Create Organization</h1>
                <p class="text-muted-foreground">Set up a new organization to manage forms and members</p>
            </div>
        </div>
    </div>

    <form method="POST" action="?/create" class="space-y-8" use:enhance>
        <!-- Basic Information -->
        <Card>
            <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                    Essential details about your organization
                </CardDescription>
            </CardHeader>
            <CardContent class="space-y-6">
                <!-- Organization Name -->
                <div class="space-y-2">
                    <FormField form={createForm} name="name">
                        <FormControl>
                            {#snippet children({props})}
                                <FormLabel>Organization Name *</FormLabel>
                                <Input
                                        {...props}
                                        bind:value={$formData.name}
                                        oninput={handleNameChange}
                                        placeholder="Enter organization name"
                                />
                                <FieldErrors />
                            {/snippet}
                        </FormControl>
                    </FormField>
                </div>

                <!-- Organization Slug -->
                <div class="space-y-2">
                    <FormField form={createForm} name="slug">
                        <FormControl>
                            {#snippet children({props})}
                                <FormLabel>Organization Slug *</FormLabel>
                                <div class="flex items-center gap-2">
                                    <span class="text-sm text-muted-foreground">form.travisspark.com/org/</span>
                                    <Input
                                            {...props}
                                            oninput={() => { handleSlugChange(); }}
                                            bind:value={$formData.slug}
                                            class="flex-1"
                                            placeholder="organization-slug"
                                    />
                                </div>
                                <p class="text-sm text-muted-foreground">
                                    This will be used in your organization's URL. Only lowercase letters, numbers, and hyphens allowed.
                                </p>
                                <FieldErrors />
                            {/snippet}
                        </FormControl>
                    </FormField>
                </div>

                <!-- Description -->
                <div class="space-y-2">
                    <FormField form={createForm} name="description">
                        <FormControl>
                            {#snippet children({props})}
                                <FormLabel>Description</FormLabel>
                                <Textarea
                                        {...props}
                                        bind:value={$formData.description}
                                        placeholder="Brief description of your organization"
                                        rows={3}
                                />
                                <FieldErrors />
                            {/snippet}
                        </FormControl>
                    </FormField>
                </div>
            </CardContent>
        </Card>

        <!-- Logo Upload -->
<!--        <Card>-->
<!--            <CardHeader>-->
<!--                <CardTitle>Organization Logo</CardTitle>-->
<!--                <CardDescription>-->
<!--                    Upload a logo to represent your organization (optional)-->
<!--                </CardDescription>-->
<!--            </CardHeader>-->
<!--            <CardContent>-->
<!--                <div class="space-y-4">-->
<!--                    <div class="flex items-center gap-4">-->
<!--                        {#if logoPreview}-->
<!--                            <div class="h-16 w-16 rounded-lg border overflow-hidden">-->
<!--                                <img src={logoPreview || "/placeholder.svg"} alt="Logo preview" class="h-full w-full object-cover" />-->
<!--                            </div>-->
<!--                        {:else}-->
<!--                            <div class="h-16 w-16 rounded-lg border border-dashed border-muted-foreground/25 flex items-center justify-center">-->
<!--                                <Building2 class="h-6 w-6 text-muted-foreground" />-->
<!--                            </div>-->
<!--                        {/if}-->

<!--                        <div class="flex-1">-->
<!--                            <Label for="logo" class="cursor-pointer">-->
<!--                                <div class="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80">-->
<!--                                    <Upload class="h-4 w-4" />-->
<!--                                    {logoPreview ? 'Change Logo' : 'Upload Logo'}-->
<!--                                </div>-->
<!--                            </Label>-->
<!--                            <Input-->
<!--                                    id="logo"-->
<!--                                    type="file"-->
<!--                                    accept="image/*"-->
<!--                                    onchange={handleLogoUpload}-->
<!--                                    class="hidden"-->
<!--                            />-->
<!--                            <p class="text-xs text-muted-foreground mt-1">-->
<!--                                PNG, JPG, or SVG. Max 5MB.-->
<!--                            </p>-->
<!--                        </div>-->
<!--                    </div>-->
<!--                </div>-->
<!--            </CardContent>-->
<!--        </Card>-->

        <!-- Contact Information -->
        <Card>
            <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>
                    How people can reach your organization (all optional)
                </CardDescription>
            </CardHeader>
            <CardContent class="space-y-6">
                <!-- Website -->
                <div class="space-y-2">
                    <FormField form={createForm} name="website">
                        <FormControl>
                            {#snippet children({props})}
                                <FormLabel class="flex items-center gap-2">
                                    <Globe class="h-4 w-4" />
                                    Website
                                </FormLabel>
                                <Input
                                        {...props}
                                        bind:value={$formData.website}
                                        placeholder="https://example.com"
                                />
                                <FieldErrors />
                            {/snippet}
                        </FormControl>
                    </FormField>
                </div>

                <!-- Email -->
                <div class="space-y-2">
                    <FormField form={createForm} name="email">
                        <FormControl>
                            {#snippet children({props})}
                                <FormLabel class="flex items-center gap-2">
                                    <Mail class="h-4 w-4" />
                                    Email
                                </FormLabel>
                                <Input
                                        {...props}
                                        bind:value={$formData.email}
                                        placeholder="contact@example.com"
                                />
                                <FieldErrors />
                            {/snippet}
                        </FormControl>
                    </FormField>
                </div>

                <!-- Phone -->
                <div class="space-y-2">
                    <FormField form={createForm} name="phone">
                        <FormControl>
                            {#snippet children({props})}
                                <FormLabel class="flex items-center gap-2">
                                    <Phone class="h-4 w-4" />
                                    Phone
                                </FormLabel>
                                <Input
                                        {...props}
                                        bind:value={$formData.phone}
                                        placeholder="+1 (555) 123-4567"
                                />
                                <FieldErrors />
                            {/snippet}
                        </FormControl>
                    </FormField>
                </div>

                <!-- Address -->
                <div class="space-y-2">
                    <FormField form={createForm} name="address">
                        <FormControl>
                            {#snippet children({props})}
                                <FormLabel class="flex items-center gap-2">
                                    <MapPin class="h-4 w-4" />
                                    Address
                                </FormLabel>
                                <Textarea
                                        {...props}
                                        bind:value={$formData.address}
                                        placeholder="123 Main St, City, State 12345"
                                        rows={2}
                                />
                                <FieldErrors />
                            {/snippet}
                        </FormControl>
                    </FormField>
                </div>
            </CardContent>
        </Card>

        <!-- Form Actions -->
        <div class="flex items-center justify-between pt-6 border-t">
            <Button variant="outline" onclick={() => goto('/admin')} type="button">
                Cancel
            </Button>

            <Button type="submit" disabled={isSubmitting} class="gap-2">
                {#if isSubmitting}
                    <Loader2 class="h-4 w-4 animate-spin" />
                    Creating Organization...
                {:else}
                    <Building2 class="h-4 w-4" />
                    Create Organization
                {/if}
            </Button>
        </div>
    </form>
</div>
