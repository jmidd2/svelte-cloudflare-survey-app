<script lang="ts">
import type { Session } from '@auth/core/types';
import { signIn, signOut } from '@auth/sveltekit/client';
import { type Snippet } from 'svelte';
import { slide } from 'svelte/transition';

interface HeaderProps {
  session: Session | null;
  children?: Snippet;
  navLinks: Snippet<[typeof closeMenus]>;
}

const { session, navLinks }: HeaderProps = $props();

let showProfileMenu = $state(false);
let showMobileNavMenu = $state(false);

const user = $derived(session?.user);

let signInLoading = $derived(false);

$effect(() => {
  if (signInLoading && !!user) {
    signInLoading = false;
  }
});

let signOutLoading = $derived(false);

$effect(() => {
  if (signOutLoading && !user) {
    signOutLoading = false;
  }
});

const userImage = $derived(user?.image ?? 'https://cataas.com/cat?type=xsmall');

let windowInnerWidth: number = $state(0);

const WINDOW_SM_BREAKPOINT = 640;

const isSmallScreen = $derived(windowInnerWidth <= WINDOW_SM_BREAKPOINT);
$inspect(isSmallScreen);

function closeMenus() {
  showMobileNavMenu = false;
  showProfileMenu = false;
}

function handleFocusLoss({ relatedTarget, currentTarget }: FocusEvent) {
  if (
    relatedTarget instanceof HTMLElement &&
    currentTarget instanceof HTMLElement &&
    currentTarget?.contains(relatedTarget)
  )
    return;
  closeMenus();
}
</script>
<svelte:window bind:innerWidth={windowInnerWidth}></svelte:window>
<header class="bg-spark-primary p-4">
    <nav class="">
        <div class="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
            <div class="relative flex h-16 items-center justify-between">
                <div class="absolute inset-y-0 left-0 flex items-center sm:hidden">
                    <!-- Mobile menu button-->
                    <button type="button"
                            class="relative inline-flex items-center justify-center rounded-md p-2 text-white cursor-pointer hover:bg-spark-primary-700 focus:ring-2 focus:ring-white focus:outline-hidden focus:ring-inset"
                            aria-controls="mobile-menu" aria-expanded={showMobileNavMenu}
                            onclick={() => {showMobileNavMenu = !showMobileNavMenu}}
                    >
                        <!--                        <span class="absolute -inset-0.5"></span>-->
                        <span class="sr-only">Open main menu</span>
                        <!--
                          Icon when menu is closed.

                          Menu open: "hidden", Menu closed: "block"
                        -->
                        <svg class="block size-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                             stroke="currentColor" aria-hidden="true" data-slot="icon">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
                        </svg>
                        <!--
                          Icon when menu is open.

                          Menu open: "block", Menu closed: "hidden"
                        -->
                        <svg class="hidden size-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5"
                             stroke="currentColor" aria-hidden="true" data-slot="icon">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
                    <div class="flex shrink-0 items-center">
                        <img class="h-8 w-auto"
                             src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=blue&shade=400"
                             alt="Your Company">
                    </div>
                    <div class="hidden sm:ml-6 sm:block">
                        <div class="flex space-x-4 text-sm">

                            <!-- Current: "bg-gray-900 text-white", Default: "text-gray-300 hover:bg-gray-700 hover:text-white" -->
                            <!--                            <a href="/" class="rounded-md bg-spark-primary-800 px-3 py-2 text-sm font-medium text-white"-->
                            <!--                               aria-current="page">Home</a>-->
                            <!--                            <a href="/admin"-->
                            <!--                               class="rounded-md px-3 py-2 text-sm font-medium  hover:bg-spark-primary-700 hover:text-white">Dashboard</a>-->
                            <!--                            <a href="/survey/1"-->
                            <!--                               class="rounded-md px-3 py-2 text-sm font-medium  hover:bg-spark-primary-700 hover:text-white">Survey</a>-->
                            {@render navLinks(closeMenus)}
                        </div>
                    </div>
                </div>
                <div onfocusout={handleFocusLoss} class="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                    {#if user}
                        <!-- Profile dropdown -->
                        <div class="relative ml-3">
                            <div>
                                {#if signOutLoading}
                                    <svg class="-ml-7 size-5 animate-spin text-white"
                                         xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                                stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor"
                                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                {:else}
                                    <button type="button" onclick={() => showProfileMenu = !showProfileMenu}
                                            class="relative flex rounded-full bg-spark-primary cursor-pointer text-sm focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-hidden"
                                            id="user-menu-button" aria-expanded="false" aria-haspopup="true">
                                        <span class="absolute -inset-1.5"></span>
                                        <span class="sr-only">Open user menu</span>
                                        <img class="size-8 rounded-full"
                                             src={userImage}
                                             alt="">
                                    </button>
                                {/if}
                            </div>

                            <!--
                              Dropdown menu, show/hide based on menu state.

                              Entering: "transition ease-out duration-100"
                                From: "transform opacity-0 scale-95"
                                To: "transform opacity-100 scale-100"
                              Leaving: "transition ease-in duration-75"
                                From: "transform opacity-100 scale-100"
                                To: "transform opacity-0 scale-95"
                            -->
                            {#if showProfileMenu}
                                <div class="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-hidden"
                                     role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button"
                                     transition:slide
                                     tabindex="-1">
                                    <!-- Active: "bg-gray-100 outline-hidden", Not Active: "" -->
                                    <a href="/admin" class="block px-4 py-2 text-sm text-gray-700 hover:bg-slate-200"
                                       role="menuitem"
                                       tabindex="-1"
                                       id="user-menu-item-0">Your Profile</a>
                                    <a href="/survey/1" class="block px-4 py-2 text-sm text-gray-700 hover:bg-slate-200"
                                       role="menuitem"
                                       tabindex="-1"
                                       id="user-menu-item-1">Settings</a>
                                    <button onclick={async () => { showProfileMenu = false; signOutLoading = true; await signOut()}}
                                            class="cursor-pointer w-full hover:bg-slate-200 text-left block px-4 py-2 text-sm text-gray-700"
                                            role="menuitem" tabindex="-1"
                                            id="user-menu-item-2">Sign out
                                    </button>
                                </div>
                            {/if}
                        </div>
                    {:else}
                        <div>
                            {#if signInLoading}
                                <svg class="-ml-7 size-5 animate-spin text-white"
                                     xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                            stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor"
                                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            {:else}
                                <button type="button" class="hover:cursor-pointer"
                                        onclick={async () => {signInLoading = true; await signIn('auth0');}}>
                                    Sign In
                                </button>
                            {/if}

                        </div>
                    {/if}
                </div>
            </div>
        </div>

        <!-- Mobile menu, show/hide based on menu state. -->
        {#if showMobileNavMenu}
            <div class="sm:hidden" id="mobile-menu">
                <div class="space-y-1 px-2 pt-2 pb-3">
                    <!-- Current: "bg-gray-900 text-white", Default: "text-gray-300 hover:bg-gray-700 hover:text-white" -->
                    {@render navLinks(closeMenus)}
                </div>
            </div>
        {/if}
    </nav>
</header>