<script lang="ts">
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { authClient } from '$lib/auth-client';
import { cn } from '$lib/utils';
import { ArrowLeftIcon, MailIcon } from '@lucide/svelte';
import type { HTMLAttributes } from 'svelte/elements';
import { Button } from './ui/button/index.js';
import * as Card from './ui/card';
import { Input } from './ui/input/index.js';
import * as InputOTP from './ui/input-otp';
import { Label } from './ui/label/index.js';

const stepSearchParam = $derived(page.url.searchParams.get('step'));

let { class: className, ...restProps }: HTMLAttributes<HTMLDivElement> =
  $props();

type FormView = 'email' | 'otp' | 'verify-otp';

let formView: FormView = $derived((stepSearchParam as FormView) ?? 'email');
let email = $state('');
let otp = $state('');
let errorMessage = $state('');

async function sendOtp(event: SubmitEvent) {
  event.preventDefault();
  const { data, error } = await authClient.emailOtp.sendVerificationOtp({
    email: email,
    type: 'sign-in',
  });

  if (data?.success) {
    // formView = 'verify-otp';
    await goto('?step=verify-otp', {
      replaceState: true,
    });
  } else {
    errorMessage = error?.message || 'An unknown error occurred';
  }
}

async function verifyOtp(event: SubmitEvent) {
  event.preventDefault();
  const { data, error } = await authClient.signIn.emailOtp({
    email: email,
    otp: otp,
  });
  if (data?.user) {
    goto('/', {
      invalidateAll: true,
    });
  } else {
    errorMessage = error?.message || 'An unknown error occurred';
  }
}

async function handleSubmit(event: SubmitEvent) {
  event.preventDefault();
  if (formView === 'otp') {
    await sendOtp(event);
  }
}

$effect(() => {
  if (!formView) return;

  goto(`?step=${formView}`, {
    noScroll: true,
    replaceState: true,
  });
});
</script>

<div class={cn("flex flex-col gap-6", className)} {...restProps}>
  <Card.Root>
    {#if formView === 'email'}
    <Card.Header class="text-center">
      <Card.Title class="text-xl">Welcome back</Card.Title>
      <Card.Description>Login with your Google account or a One Time Password</Card.Description>
    </Card.Header>
    <Card.Content>
      <form>
        <div class="grid gap-6">
          <div class="flex flex-col gap-4">
            <Button variant="outline" class="w-full" onclick={() => {formView = 'otp'}}>
              <MailIcon class="size-5" />
              Login with Email OTP
            </Button>
            <Button variant="outline" class="w-full">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                    fill="currentColor"
                />
              </svg>
              Login with Google
            </Button>
          </div>
          <div
              class="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t"
          >
						<span class="bg-card text-muted-foreground relative z-10 px-2">
							Or continue with
						</span>
          </div>
          <div class="grid gap-6">
            <div class="grid gap-3">
              <Label for="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required />
            </div>
            <div class="grid gap-3">
              <div class="flex items-center">
                <Label for="password">Password</Label>
                <a
                    href="#"
                    class="ml-auto text-sm underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </a>
              </div>
              <Input id="password" type="password" required />
            </div>
            <div class="grid gap-2">
            <Button type="submit" class="w-full">
                Login
            </Button>
            </div>
          </div>
          <div class="text-center text-sm">
            Don&apos;t have an account?
            <a href="#" class="underline underline-offset-4"> Sign up </a>
          </div>
        </div>
      </form>
    </Card.Content>
      {:else if formView === 'otp'}
      <Card.Header class="text-center">
        <div class="flex text-sm items-center gap-1.5 text-muted-foreground"><Button onclick={() => { formView = 'email' }} class="hover:cursor-pointer" variant="ghost"><ArrowLeftIcon class="size-4"/>Back</Button></div>
        <Card.Title class="text-xl">Welcome!</Card.Title>
        <Card.Description>Enter your email to send a One Time Password</Card.Description>
      </Card.Header>
      <Card.Content>
        <form onsubmit={handleSubmit}>
          <div class="grid gap-6">
            <div
                class="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t"
            >
            </div>
            <div class="grid gap-6">
              <div class="grid gap-3">
                <Label for="email">Email</Label>
                <Input id="email" bind:value={email} type="email" placeholder="m@example.com" required />
              </div>
              <div class="grid gap-2">
                <Button type="submit" class="w-full">
                    Send OTP
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Card.Content>
      {:else if formView === 'verify-otp'}
      <Card.Header class="text-center">
        <Card.Title class="text-xl">Welcome back</Card.Title>
        <Card.Description>Login with your One Time Password</Card.Description>
      </Card.Header>
      <Card.Content>
        <form onsubmit={verifyOtp}>
          <div class="grid gap-6">
            <div class="flex justify-center">
              <InputOTP.Root maxlength={6} bind:value={otp}>
                {#snippet children({ cells })}
                  <InputOTP.Group>
                    {#each cells.slice(0, 6) as cell}
                      <InputOTP.Slot {cell} />
                    {/each}
                  </InputOTP.Group>
                {/snippet}
              </InputOTP.Root>
            </div>
            <div class="grid gap-2">
            <Button type="submit" class="w-full">
                Login
            </Button>
            <Button type="button" variant="outline" class="w-full">
              Resend Code
            </Button>
            </div>
          </div>
        </form>
      </Card.Content>
      {/if}
  </Card.Root>
  <div
      class="text-muted-foreground *:[a]:hover:text-primary *:[a]:underline *:[a]:underline-offset-4 text-balance text-center text-xs"
  >
    By clicking continue, you agree to our <a href="#">Terms of Service</a>
    and <a href="#">Privacy Policy</a>.
  </div>
</div>
