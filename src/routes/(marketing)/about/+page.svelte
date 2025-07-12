<script lang="ts">
import { ExternalLinkIcon, GalleryVerticalEndIcon } from '@lucide/svelte';
import { Button } from '$lib/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '$lib/components/ui/card';
</script>

<svelte:head>
  <title>About - FormBuilder</title>
  <meta name="description" content="Learn about Phoenix Spark and the FormBuilder platform" />
</svelte:head>

<div class="container mx-auto px-4 py-12 max-w-4xl">
  <div class="text-center mb-12">
    <div class="flex items-center justify-center gap-3 mb-6">
      <div class="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-lg">
        <GalleryVerticalEndIcon class="size-6" />
      </div>
      <h1 class="text-4xl font-bold">About FormBuilder</h1>
    </div>
    <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
      Empowering organizations to create, manage, and analyze forms with ease
    </p>
  </div>

  <div class="grid gap-8 md:grid-cols-2 mb-12">
    <Card>
      <CardHeader>
        <CardTitle>Our Mission</CardTitle>
        <CardDescription>Building better form experiences</CardDescription>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground">
          FormBuilder is designed to simplify the process of creating and managing forms for organizations of all sizes.
          We believe that collecting data should be intuitive, secure, and powerful.
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Key Features</CardTitle>
        <CardDescription>Everything you need in one platform</CardDescription>
      </CardHeader>
      <CardContent>
        <ul class="space-y-2 text-muted-foreground list-inside list-disc">
          <li>Drag-and-drop form builder</li>
          <li>Real-time collaboration</li>
          <li>Advanced analytics</li>
          <li>Secure data collection</li>
          <li>Multi-tenant organization support</li>
        </ul>
      </CardContent>
    </Card>
  </div>

  <Card class="mb-12">
    <CardHeader>
      <CardTitle>About Phoenix Spark</CardTitle>
      <CardDescription>The team behind FormBuilder</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <p class="text-muted-foreground">
        Phoenix Spark is the leading Spark Cell across the world. With focus areas in Additive Manufacturing, Digital Environments, AR/VR, and ventures with Commerical Partners. We focus on inspiring and empowering Airmen on a daily basis.
      </p>
      <p class="text-muted-foreground">
        Our team is passionate about creating tools that are not only powerful but also intuitive and
        enjoyable to use. FormBuilder represents our commitment to making data collection and form
        management accessible to everyone.
      </p>
      <div class="flex items-center gap-4 pt-4">
        <Button href="https://travisspark.com" target="_blank" rel="noopener noreferrer" variant="outline">
            Visit Phoenix Spark
            <ExternalLinkIcon class="size-4" />
        </Button>
      </div>
    </CardContent>
  </Card>

  <div class="text-center">
    <h2 class="text-2xl font-semibold mb-4">Ready to get started?</h2>
    <div class="flex items-center justify-center gap-4">
      <Button href="/register">
        Get Started Free
      </Button>
      <Button variant="outline" href="/contact">
        Contact Us
      </Button>
    </div>
  </div>
</div>
