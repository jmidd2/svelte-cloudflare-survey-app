<script lang="ts">
import { enhance } from '$app/forms';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { authClient } from '$lib/auth-client.js';
import { Button } from '$lib/components/ui/button/index.js';
import * as Card from '$lib/components/ui/card';
import { Input } from '$lib/components/ui/input/index.js';
import { Label } from '$lib/components/ui/label/index.js';
import { cn } from '$lib/utils';
import { EyeIcon, EyeOffIcon, UserIcon } from '@lucide/svelte';
import type { HTMLAttributes } from 'svelte/elements';
import { toast } from 'svelte-sonner';

let { class: className, ...restProps }: HTMLAttributes<HTMLDivElement> =
  $props();

const currentQueryParams = new URLSearchParams(page.url.searchParams);
const stepSearchParam = $derived(page.url.searchParams.get('step'));
const redirect = $derived(page.url.searchParams.get('redirect'));

type FormView = 'signup' | 'complete';

let formView: FormView = $derived((stepSearchParam as FormView) ?? 'signup');
let formData = $state({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
});
let errorMessage = $state('');
let showPassword = $state(false);
let showConfirmPassword = $state(false);
let isSubmitting = $state(false);

// Validation
const isValidEmail = $derived(
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
);
const isValidPassword = $derived(formData.password.length >= 8);
const passwordsMatch = $derived(formData.password === formData.confirmPassword);
const isFormValid = $derived(
  formData.name.trim().length > 0 &&
    isValidEmail &&
    isValidPassword &&
    passwordsMatch
);

async function handleSignup(event: SubmitEvent) {
  event.preventDefault();
  console.log(event);
  if (!isFormValid) {
    errorMessage = 'Please fill in all fields correctly';
    return;
  }

  isSubmitting = true;
  errorMessage = '';

  try {
    // First create the account
    const { data, error } = await authClient.signUp.email({
      email: formData.email,
      password: formData.password,
      name: formData.name,
    });

    if (error) {
      errorMessage = error.message || 'Failed to create account';
      return;
    }

    // Send verification email
    // const { data: otpData, error: otpError } =
    await authClient.sendVerificationEmail({
      email: formData.email,
      callbackURL: '/',
    });

    toast.success(
      'Account created! Please check your email for verification code.'
    );

    currentQueryParams.set('step', 'complete');
    await goto(`?${currentQueryParams.toString()}`, {
      replaceState: true,
    });
    // if (otpData?.success) {
    //   currentQueryParams.set('step', 'verify-otp');
    //   await goto(`?${currentQueryParams.toString()}`, {
    //     replaceState: true,
    //   });
    // } else {
    //   errorMessage = otpError?.message || 'Failed to send verification email';
    // }
  } catch (error) {
    errorMessage = 'An unexpected error occurred';
    console.error('Signup error:', error);
  } finally {
    isSubmitting = false;
  }
}

async function resendVerificationCode() {
  try {
    await authClient.sendVerificationEmail({
      email: formData.email,
      callbackURL: '/',
    });
    toast.success('Verification code sent!');
  } catch (error) {
    toast.error('Failed to resend verification code');
  }
}

// $effect(() => {
//   if (!formView) return;
//
//   currentQueryParams.set('step', formView);
//   goto(`?${currentQueryParams.toString()}`, {
//     noScroll: true,
//     replaceState: true,
//   });
// });
</script>

<div class={cn("flex flex-col gap-6", className)} {...restProps}>
    <Card.Root>
        {#if formView === 'signup'}
            <Card.Header class="text-center">
                <Card.Title class="text-xl">Create your account</Card.Title>
                <Card.Description>Sign up with Google or create an account with email</Card.Description>
            </Card.Header>
            <Card.Content>
                <div class="grid gap-6">
                    <!-- Social Login Options -->
                    <div class="flex flex-col gap-4">
                        <Button variant="outline" class="w-full" onclick={async () => {
              await authClient.signIn.social({provider:'google'})
            }}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="size-5">
                                <path
                                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                        fill="currentColor"
                                />
                            </svg>
                            Sign up with Google
                        </Button>
                    </div>

                    <div class="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
            <span class="bg-card text-muted-foreground relative z-10 px-2">
              Or continue with
            </span>
                    </div>

                    <!-- Registration Form -->
                    <form onsubmit={handleSignup}>
                        <div class="grid gap-4">
                            <!-- Name Field -->
                            <div class="grid gap-2">
                                <Label for="name">Full Name</Label>
                                <Input
                                        id="name"
                                        type="text"
                                        placeholder="John Doe"
                                        bind:value={formData.name}
                                        required
                                />
                            </div>

                            <!-- Email Field -->
                            <div class="grid gap-2">
                                <Label for="email">Email</Label>
                                <Input
                                        id="email"
                                        type="email"
                                        placeholder="m@example.com"
                                        bind:value={formData.email}
                                        class={formData.email && !isValidEmail ? 'border-destructive' : ''}
                                        required
                                />
                                {#if formData.email && !isValidEmail}
                                    <p class="text-sm text-destructive">Please enter a valid email address</p>
                                {/if}
                            </div>

                            <!-- Password Field -->
                            <div class="grid gap-2">
                                <Label for="password">Password</Label>
                                <div class="relative">
                                    <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Create a strong password"
                                            bind:value={formData.password}
                                            class={formData.password && !isValidPassword ? 'border-destructive pr-10' : 'pr-10'}
                                            required
                                    />
                                    <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            class="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                            onclick={() => showPassword = !showPassword}
                                    >
                                        {#if showPassword}
                                            <EyeOffIcon class="h-4 w-4" />
                                        {:else}
                                            <EyeIcon class="h-4 w-4" />
                                        {/if}
                                    </Button>
                                </div>
                                {#if formData.password && !isValidPassword}
                                    <p class="text-sm text-destructive">Password must be at least 8 characters</p>
                                {/if}
                            </div>

                            <!-- Confirm Password Field -->
                            <div class="grid gap-2">
                                <Label for="confirmPassword">Confirm Password</Label>
                                <div class="relative">
                                    <Input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            placeholder="Confirm your password"
                                            bind:value={formData.confirmPassword}
                                            class={formData.confirmPassword && !passwordsMatch ? 'border-destructive pr-10' : 'pr-10'}
                                            required
                                    />
                                    <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            class="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                            onclick={() => showConfirmPassword = !showConfirmPassword}
                                    >
                                        {#if showConfirmPassword}
                                            <EyeOffIcon class="h-4 w-4" />
                                        {:else}
                                            <EyeIcon class="h-4 w-4" />
                                        {/if}
                                    </Button>
                                </div>
                                {#if formData.confirmPassword && !passwordsMatch}
                                    <p class="text-sm text-destructive">Passwords do not match</p>
                                {/if}
                            </div>

                            <!-- Terms and Conditions -->
                            <!--                            <div class="flex items-center space-x-2">-->
                            <!--                                <Checkbox id="terms" bind:checked={agreeToTerms} />-->
                            <!--                                <Label for="terms" class="text-sm font-normal">-->
                            <!--                                    I agree to the <a href="/terms" class="underline underline-offset-4 hover:text-primary">Terms of Service</a> and <a href="/privacy" class="underline underline-offset-4 hover:text-primary">Privacy Policy</a>-->
                            <!--                                </Label>-->
                            <!--                            </div>-->

                            <!-- Error Message -->
                            {#if errorMessage}
                                <div class="text-sm text-destructive text-center">
                                    {errorMessage}
                                </div>
                            {/if}

                            <!-- Submit Button -->
                            <Button type="submit" class="w-full mt-4" disabled={!isFormValid || isSubmitting}>
                                {#if isSubmitting}
                                    <div class="flex items-center gap-2">
                                        <div class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                                        Creating account...
                                    </div>
                                {:else}
                                    Create Account
                                {/if}
                            </Button>
                        </div>
                    </form>

                    <div class="text-center text-sm">
                        Already have an account?
                        <a href="/login" class="underline underline-offset-4 hover:text-primary">Sign in</a>
                    </div>
                </div>
            </Card.Content>
        {:else if formView === 'complete'}
            <Card.Header class="text-center">
                <Card.Title class="text-xl">Welcome to FormBuilder!</Card.Title>
                <Card.Description>
                    Your account has been created and verified successfully.
                </Card.Description>
            </Card.Header>
            <Card.Content>
                <div class="grid gap-6">
                    <div class="text-center">
                        <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                            <UserIcon class="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <p class="text-sm text-muted-foreground">
                            You're all set! Let's get you started with creating your first organization.
                        </p>
                    </div>

                    <Button href="/profile/complete" class="w-full">
                        Get Started
                    </Button>
                </div>
            </Card.Content>
        {/if}
    </Card.Root>

    <div class="text-muted-foreground text-balance text-center text-xs">
        By clicking continue, you agree to our <a href="/terms" class="hover:text-primary underline underline-offset-4">Terms of Service</a>
        and <a href="/privacy" class="hover:text-primary underline underline-offset-4">Privacy Policy</a>.
    </div>
</div>