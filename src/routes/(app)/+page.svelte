<script lang="ts">
import { authClient } from '$lib/auth-client';
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
  ArrowRight,
  BarChart3,
  CheckCircle,
  Clock,
  FileText,
  Globe,
  Shield,
  Smartphone,
  Star,
  Target,
  Users,
  Zap,
} from '@lucide/svelte';
import type { PageProps } from './$types';

const { data }: PageProps = $props();

const session = $derived(data.session);
const user = $derived(session?.user);

// Features data
const features = [
  {
    icon: FileText,
    title: 'Drag & Drop Builder',
    description:
      'Create beautiful forms with our intuitive drag-and-drop interface. No coding required.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description:
      'Work together with your team. Invite members, assign roles, and manage permissions.',
  },
  {
    icon: BarChart3,
    title: 'Real-time Analytics',
    description:
      'Track form performance, submission rates, and user engagement with detailed analytics.',
  },
  {
    icon: Smartphone,
    title: 'Mobile Responsive',
    description:
      'Your forms look perfect on any device. Automatic mobile optimization included.',
  },
  {
    icon: Shield,
    title: 'Secure & Anonymous',
    description:
      'All responses are anonymous and stored securely. No personal information is collected.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description:
      'Optimized for speed with instant form loading and real-time updates.',
  },
];

// Stats data
// const stats = [
//   { number: '10,000+', label: 'Forms Created' },
//   { number: '500K+', label: 'Submissions Collected' },
// ];

const stats = $derived(data.stats);

// Testimonials data
const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Marketing Director',
    company: 'TechCorp',
    content:
      'This form builder has revolutionized how we collect customer feedback. The analytics are incredible!',
    rating: 5,
  },
  {
    name: 'Mike Chen',
    role: 'Product Manager',
    company: 'StartupXYZ',
    content:
      'Easy to use, powerful features, and great team collaboration tools. Exactly what we needed.',
    rating: 5,
  },
  {
    name: 'Emily Rodriguez',
    role: 'HR Manager',
    company: 'GlobalInc',
    content:
      "The best form builder we've used. Great for surveys, applications, and feedback collection.",
    rating: 5,
  },
];

function handleGetStarted() {
  if (user) {
    window.location.href = '/admin';
  } else {
    window.location.href = '/register';
  }
}
</script>

<svelte:head>
  <title>FormBuilder - Create Beautiful Forms in Minutes</title>
  <meta name="description" content="Build professional forms with our drag-and-drop form builder. Collect responses, analyze data, and collaborate with your team." />
</svelte:head>

<div class="bg-background">
  <!-- Hero Section -->
  <section class="relative py-20 lg:py-32 overflow-hidden">
    <div class="container mx-auto px-4">
      <div class="max-w-4xl mx-auto text-center">
        <h1 class="text-4xl lg:text-6xl font-bold text-foreground mb-6">
          Create Beautiful Forms
          <span class="text-primary">in Minutes</span>
        </h1>

        <p class="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Build professional forms with our intuitive drag-and-drop builder.
          Collect responses, analyze data, and collaborate with your team—all in one platform.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button size="lg" onclick={handleGetStarted} class="text-lg px-8 py-3">
            {user ? 'Go to Dashboard' : 'Get Started Free'}
            <ArrowRight class="ml-2 h-5 w-5" />
          </Button>
          <Button variant="outline" size="lg" href="#features" class="text-lg px-8 py-3">
            Learn More
          </Button>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-2 gap-8 max-w-3xl mx-auto">
          {#each stats as stat}
            <div class="text-center">
              <div class="text-2xl lg:text-3xl font-bold text-primary">{stat.number}</div>
              <div class="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <!-- Background decoration -->
    <div class="absolute inset-0 -z-10 overflow-hidden">
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl"></div>
    </div>
  </section>

  <!-- Features Section -->
  <section id="features" class="py-20 bg-muted/30">
    <div class="container mx-auto px-4">
      <div class="max-w-3xl mx-auto text-center mb-16">
        <h2 class="text-3xl lg:text-4xl font-bold text-foreground mb-4">
          Everything you need to build amazing forms
        </h2>
        <p class="text-lg text-muted-foreground">
          Powerful features designed to make form creation simple, fast, and effective.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {#each features as feature}
          <Card class="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div class="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <feature.icon class="h-6 w-6 text-primary" />
              </div>
              <CardTitle class="text-xl">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription class="text-base">
                {feature.description}
              </CardDescription>
            </CardContent>
          </Card>
        {/each}
      </div>
    </div>
  </section>

  <!-- How it Works Section -->
  <section class="py-20">
    <div class="container mx-auto px-4">
      <div class="max-w-3xl mx-auto text-center mb-16">
        <h2 class="text-3xl lg:text-4xl font-bold text-foreground mb-4">
          How it works
        </h2>
        <p class="text-lg text-muted-foreground">
          Get started in three simple steps
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        <div class="text-center">
          <div class="h-16 w-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <span class="text-2xl font-bold text-primary-foreground">1</span>
          </div>
          <h3 class="text-xl font-semibold mb-3">Create a Form</h3>
          <p class="text-muted-foreground">
            Create a form to collect responses from your customers.
          </p>
        </div>

        <div class="text-center">
          <div class="h-16 w-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <span class="text-2xl font-bold text-primary-foreground">2</span>
          </div>
          <h3 class="text-xl font-semibold mb-3">Customize Your Form</h3>
          <p class="text-muted-foreground">
            Add fields with our intuitive builder.
          </p>
        </div>

        <div class="text-center">
          <div class="h-16 w-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <span class="text-2xl font-bold text-primary-foreground">3</span>
          </div>
          <h3 class="text-xl font-semibold mb-3">Share & Collect</h3>
          <p class="text-muted-foreground">
            Share your form and start collecting responses. View analytics in real-time.
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- Testimonials Section -->
<!--  <section class="py-20 bg-muted/30">-->
<!--    <div class="container mx-auto px-4">-->
<!--      <div class="max-w-3xl mx-auto text-center mb-16">-->
<!--        <h2 class="text-3xl lg:text-4xl font-bold text-foreground mb-4">-->
<!--          Loved by teams worldwide-->
<!--        </h2>-->
<!--        <p class="text-lg text-muted-foreground">-->
<!--          See what our customers have to say about FormBuilder-->
<!--        </p>-->
<!--      </div>-->

<!--      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">-->
<!--        {#each testimonials as testimonial}-->
<!--          <Card class="border-0 shadow-sm">-->
<!--            <CardContent class="p-6">-->
<!--              <div class="flex mb-4">-->
<!--                {#each Array(testimonial.rating) as _}-->
<!--                  <Star class="h-4 w-4 fill-yellow-400 text-yellow-400" />-->
<!--                {/each}-->
<!--              </div>-->
<!--              <p class="text-muted-foreground mb-4">"{testimonial.content}"</p>-->
<!--              <div>-->
<!--                <div class="font-semibold text-foreground">{testimonial.name}</div>-->
<!--                <div class="text-sm text-muted-foreground">{testimonial.role} at {testimonial.company}</div>-->
<!--              </div>-->
<!--            </CardContent>-->
<!--          </Card>-->
<!--        {/each}-->
<!--      </div>-->
<!--    </div>-->
<!--  </section>-->

  <!-- CTA Section -->
  <section class="py-20 bg-muted/30">
    <div class="container mx-auto px-4">
      <div class="max-w-4xl mx-auto text-center">
        <h2 class="text-3xl lg:text-4xl font-bold text-foreground mb-4">
          Ready to get started?
        </h2>
        <p class="text-lg text-muted-foreground mb-8">
          Join FormBuilder to start getting feedback today. No credit card required.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onclick={handleGetStarted} class="text-lg px-8 py-3">
            {user ? 'Go to Dashboard' : 'Start Building Forms'}
            <ArrowRight class="ml-2 h-5 w-5" />
          </Button>
          {#if !user}
            <Button variant="outline" size="lg" href="/login" class="text-lg px-8 py-3">
              Sign In
            </Button>
          {/if}
        </div>

        <p class="text-sm text-muted-foreground mt-4">
          No credit card required • Free forever plan available
        </p>
      </div>
    </div>
  </section>


</div>