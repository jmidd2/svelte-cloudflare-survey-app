<script lang="ts">
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
import { Textarea } from '$lib/components/ui/textarea';
import { Mail, MapPin, Phone } from '@lucide/svelte';
import { toast } from 'svelte-sonner';

// Form state
let formData = $state({
  name: '',
  email: '',
  subject: '',
  message: '',
});

let isSubmitting = $state(false);
let errors = $state<Record<string, string>>({});

// Validation
function validateForm() {
  const newErrors: Record<string, string> = {};

  if (!formData.name.trim()) {
    newErrors.name = 'Name is required';
  }

  if (!formData.email.trim()) {
    newErrors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    newErrors.email = 'Please enter a valid email address';
  }

  if (!formData.subject.trim()) {
    newErrors.subject = 'Subject is required';
  }

  if (!formData.message.trim()) {
    newErrors.message = 'Message is required';
  } else if (formData.message.trim().length < 10) {
    newErrors.message = 'Message must be at least 10 characters long';
  }

  errors = newErrors;
  return Object.keys(newErrors).length === 0;
}

// Form submission
async function handleSubmit(event: Event) {
  event.preventDefault();

  if (!validateForm()) {
    toast.error('Please fix the errors below');
    return;
  }

  isSubmitting = true;

  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Reset form
    formData = {
      name: '',
      email: '',
      subject: '',
      message: '',
    };
    errors = {};

    toast.success("Message sent successfully! We'll get back to you soon.");
  } catch (error) {
    toast.error('Failed to send message. Please try again.');
  } finally {
    isSubmitting = false;
  }
}

// Clear error when user starts typing
function clearError(field: string) {
  if (errors[field]) {
    errors = { ...errors, [field]: '' };
  }
}
</script>

<svelte:head>
  <title>Contact Us - FormBuilder</title>
  <meta name="description" content="Get in touch with our team. We're here to help with any questions about FormBuilder." />
</svelte:head>
  <div class="container mx-auto px-4 py-16">
    <!-- Header -->
    <div class="text-center mb-16">
      <h1 class="text-4xl font-bold text-foreground mb-4">Get in Touch</h1>
      <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
        Have a question or need help? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
      </p>
    </div>

    <div class="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
      <!-- Contact Information -->
      <div class="space-y-8">
        <div>
          <h2 class="text-2xl font-semibold text-foreground mb-6">Contact Information</h2>
          <div class="space-y-6">
            <div class="flex items-start gap-4">
              <div class="bg-primary/10 p-3 rounded-lg">
                <Mail class="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 class="font-medium text-foreground">Email</h3>
                <p class="text-muted-foreground">support@travisspark.com</p>
              </div>
            </div>
          </div>
        </div>

        <!-- FAQ Section -->
        <div class="bg-muted/50 p-6 rounded-lg">
          <h3 class="font-semibold text-foreground mb-4">Frequently Asked Questions</h3>
          <div class="space-y-3 text-sm">
            <div>
              <p class="font-medium text-foreground">Do you offer phone support?</p>
              <p class="text-muted-foreground">No. Phone support is not available.</p>
            </div>
            <div>
              <p class="font-medium text-foreground">Can I schedule a demo?</p>
              <p class="text-muted-foreground">Mention "demo request" in your message and we'll set up a personalized walkthrough.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Contact Form -->
      <Card>
        <CardHeader>
          <CardTitle>Send us a Message</CardTitle>
          <CardDescription>
            Fill out the form below and we'll get back to you as soon as possible.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onsubmit={handleSubmit} class="space-y-6">
            <!-- Name Field -->
            <div class="space-y-2">
              <Label for="name">Name *</Label>
              <Input
                  id="name"
                  type="text"
                  placeholder="Your full name"
                  bind:value={formData.name}
                  oninput={() => clearError('name')}
                  class={errors.name ? 'border-destructive' : ''}
                  disabled={isSubmitting}
              />
              {#if errors.name}
                <p class="text-sm text-destructive">{errors.name}</p>
              {/if}
            </div>

            <!-- Email Field -->
            <div class="space-y-2">
              <Label for="email">Email *</Label>
              <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  bind:value={formData.email}
                  oninput={() => clearError('email')}
                  class={errors.email ? 'border-destructive' : ''}
                  disabled={isSubmitting}
              />
              {#if errors.email}
                <p class="text-sm text-destructive">{errors.email}</p>
              {/if}
            </div>

            <!-- Subject Field -->
            <div class="space-y-2">
              <Label for="subject">Subject *</Label>
              <Input
                  id="subject"
                  type="text"
                  placeholder="What's this about?"
                  bind:value={formData.subject}
                  oninput={() => clearError('subject')}
                  class={errors.subject ? 'border-destructive' : ''}
                  disabled={isSubmitting}
              />
              {#if errors.subject}
                <p class="text-sm text-destructive">{errors.subject}</p>
              {/if}
            </div>

            <!-- Message Field -->
            <div class="space-y-2">
              <Label for="message">Message *</Label>
              <Textarea
                  id="message"
                  placeholder="Tell us how we can help you..."
                  rows={5}
                  bind:value={formData.message}
                  oninput={() => clearError('message')}
                  class={errors.message ? 'border-destructive' : ''}
                  disabled={isSubmitting}
              />
              {#if errors.message}
                <p class="text-sm text-destructive">{errors.message}</p>
              {/if}
            </div>

            <!-- Submit Button -->
            <Button
                type="submit"
                class="w-full"
                disabled={isSubmitting}
            >
              {#if isSubmitting}
                <div class="flex items-center gap-2">
                  <div class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Sending...
                </div>
              {:else}
                Send Message
              {/if}
            </Button>

            <p class="text-xs text-muted-foreground text-center">
              * Required fields. We respect your privacy and will never share your information.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  </div>