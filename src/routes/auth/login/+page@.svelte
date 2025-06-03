
<script lang="ts">
import { goto } from '$app/navigation';
import { authClient } from '$lib/auth-client';
import LoginForm from '$lib/components/LoginForm.svelte';
import GalleryVerticalEndIcon from '@lucide/svelte/icons/gallery-vertical-end';
</script>
<!--<p>Or log in with a one-time password. We'll email you a code.</p>-->


<!--{#if formView === "email"}-->
<!--  <form onsubmit={sendOtp}>-->
<!--    <Label for="email">Email</Label>-->
<!--    <Input type="email" bind:value={email} name="email" />-->
<!--    <Button type="submit">-->
<!--      Send me a login code-->
<!--    </Button>-->
<!--  </form>-->
<!--{:else if formView === "otp"}-->
<!--  <form onsubmit={verifyOtp}>-->
<!--    <Label for="otp">Enter the code we sent you</Label>-->
<!--    <Input type="text" bind:value={otp} name="otp" />-->
<!--    <Button type="submit">Login</Button>-->
<!--    <Button type="button" onclick={() => formView = "email"}>Cancel</Button>-->
<!--  </form>-->
<!--{/if}-->

<!--{#if errorMessage}-->
<!--  <p class="error">{errorMessage}</p>-->
<!--{/if}-->

<!--<Card.Root class="mx-auto w-md my-auto">-->
<!--  {#if formView === 'email'}-->
<!--  <Card.Header>-->
<!--    <Card.Title class="text-2xl">Login</Card.Title>-->
<!--    <Card.Description>Enter your email below to login to your account</Card.Description>-->
<!--  </Card.Header>-->
<!--  <Card.Content>-->
<!--    <div class="grid gap-4">-->
<!--      <div class="grid gap-2">-->
<!--        <Label for="email">Email</Label>-->
<!--        <Input id="email" type="email" placeholder="m@example.com" required />-->
<!--      </div>-->
<!--      <div class="grid gap-2">-->
<!--        <div class="flex items-center">-->
<!--          <Label for="password">Password</Label>-->
<!--          <a href="##" class="ml-auto inline-block text-sm underline">-->
<!--            Forgot your password?-->
<!--          </a>-->
<!--        </div>-->
<!--        <Input id="password" type="password" required />-->
<!--      </div>-->
<!--      <Button type="submit" class="w-full">Login</Button>-->

<!--      <div class="my-2 flex items-center gap-4 text-muted-foreground before:h-px before:flex-1 before:bg-muted  before:content-[''] after:h-px after:flex-1 after:bg-muted  after:content-[''] text-sm tracking-tight">OR</div>-->

<!--      <Button variant="outline" class="w-full">Login with Google</Button>-->
<!--      <Button variant="outline" class="w-full">Login with Email OTP</Button>-->
<!--    </div>-->
<!--    <div class="mt-4 text-center text-sm">-->
<!--      Don&apos;t have an account?-->
<!--      <a href="##" class="underline">Sign up</a>-->
<!--    </div>-->
<!--  </Card.Content>-->
<!--    {:else if formView === 'otp'}-->
<!--    -->
<!--    {/if}-->
<!--</Card.Root>-->
<div class="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
  <div class="flex w-full max-w-sm flex-col gap-6">
    <a href="/" class="flex items-center gap-2 self-center font-medium">
      <div
          class="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md"
      >
        <GalleryVerticalEndIcon class="size-4" />
      </div>
      Acme Inc.
    </a>
    <LoginForm />
  </div>
</div>
