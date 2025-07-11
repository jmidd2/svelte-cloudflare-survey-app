<script lang="ts">
import {
  Building2,
  CheckIcon,
  ChevronsUpDownIcon,
  CrownIcon,
  FileText,
  LogOut,
  Moon,
  PlusIcon,
  Settings,
  Sun,
  User,
} from '@lucide/svelte';
import { toggleMode } from 'mode-watcher';
import { onMount, tick } from 'svelte';
import { toast } from 'svelte-sonner';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { type AuthUser, authClient } from '$lib/auth-client';
import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
import { Button } from '$lib/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandLinkItem,
  CommandList,
} from '$lib/components/ui/command';
import { CommandSeparator } from '$lib/components/ui/command/index.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '$lib/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '$lib/components/ui/popover';
import type { SelectOrganization } from '$lib/server/db/schema';
import type { OrganizationListItem } from '$lib/types';
import { cn, getInitials } from '$lib/utils';

interface HeaderProps {
  user?: AuthUser | null;
  currentOrg?: SelectOrganization | null;
  showOrgContext?: boolean;
  organizationList?: OrganizationListItem[];
  isOrgAdmin?: boolean;
  isAdminRoute?: boolean;
}

let {
  user = null,
  currentOrg = null,
  showOrgContext = false,
  organizationList = [],
  isOrgAdmin = false,
  isAdminRoute = false,
}: HeaderProps = $props();
// organizationList = [
//   { id: '2', name: 'Test Org', slug: 'test-org', logo: null },
// ];

let searchQuery = $state('');
let notifications = $state([
  {
    id: '1',
    title: 'New form submission',
    description: 'Contact Form received a new response',
    time: '2 minutes ago',
    unread: true,
  },
  {
    id: '2',
    title: 'Member joined',
    description: 'John Doe joined your organization',
    time: '1 hour ago',
    unread: true,
  },
]);

async function handleSignOut() {
  try {
    await authClient.signOut();
    toast.success('Signed out successfully');
    goto('/', {
      invalidateAll: true,
    });
  } catch (error) {
    toast.error('Failed to sign out');
  }
}

function handleSearch(event: Event) {
  event.preventDefault();
  if (searchQuery.trim()) {
    // Implement search functionality
    console.log('Searching for:', searchQuery);
  }
}

const unreadCount = $derived(notifications.filter(n => n.unread).length);

let open = $state(false);
let selectedId = $state('');
// let selectedValue = $derived.by(() => {
//   if (selectedId) {
//     const result = organizationList.find(o => o.id === selectedId);
//     if (result) return result;
//   }
//
//   return (
//     organizationList.find(o => o.id === currentOrg?.id) ?? {
//       name: 'Select Organization',
//       logo: '',
//       id: 'select-organization',
//       slug: 'select-organization',
//     }
//   );
// });

let selectedOrg = $derived(
  organizationList.find(o => o.id === currentOrg?.id) ?? {
    name: 'Select Organization',
    logo: '',
    id: 'select-organization',
    slug: 'select-organization',
  }
);
let triggerRef = $state<HTMLButtonElement>(null!);

// We want to refocus the trigger button when the user selects
// an item from the list so users can continue navigating the
// rest of the form with the keyboard.
function closeAndFocusTrigger() {
  open = false;
  tick().then(() => {
    triggerRef.focus();
  });
}

onMount(() => {
  if (currentOrg) {
    open = false;
  }
});

function buildUrl(url: URL, slug: string): string {
  const basePath = `/admin/${slug}`;
  const pathname = url.pathname;

  const split = pathname.split('/').slice(3);

  if (split.length > 0) return `${basePath}/${split.join('/')}`;

  return basePath;
}

$inspect(organizationList);
</script>

<header class="sticky top-0 z-25 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  <div class="px-4">
    <div class="flex h-16 items-center justify-between">
      <!-- Left Section: Logo + Breadcrumbs -->
      <div class="flex items-center gap-4">
        <!-- Logo -->
        <a href="/" class="flex items-center gap-2 font-bold text-xl text-foreground hover:text-primary transition-colors">
          <div class="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
            <FileText class="h-5 w-5 text-primary-foreground" />
          </div>
          <span class="hidden sm:block">FormBuilder</span>
        </a>

        <!-- Organization Context -->
        {#if showOrgContext && currentOrg}
            <Popover bind:open>
              <PopoverTrigger bind:ref={triggerRef}>
                {#snippet child({ props })}
                  <Button
                      {...props}
                      variant="ghost"
                      class="justify-between"
                      role="combobox"
                      aria-expanded={open}
                  >
                    <Avatar class="h-6 w-6">
                      <AvatarImage src={currentOrg.logo} alt={currentOrg.name} />
                      <AvatarFallback class="bg-primary/10 text-primary text-xs">
                        {getInitials(currentOrg.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span class="text-sm font-medium text-foreground max-w-32 truncate">{currentOrg.name}</span>
                    <ChevronsUpDownIcon class="opacity-50" />
                  </Button>
                {/snippet}
              </PopoverTrigger>
              <PopoverContent class="min-w-64 max-w-xl p-0" align="start">
                <Command>
                  {#if organizationList.length > 1}
                    <CommandInput class="focus-0 ring-0 focus:ring-0 focus:border-transparent" placeholder="Search organizations..." />
                  {/if}
                  <CommandList >
                    <CommandEmpty>No framework found.</CommandEmpty>
                    <CommandGroup value="frameworks">
                      {#each organizationList as org (org.id)}
                        <CommandLinkItem
                            value={org.id}
                            onSelect={() => {
                              selectedOrg = org;
                              closeAndFocusTrigger();
                            }}
                            href={buildUrl(page.url, org.slug)}
                        >
                          <div class="flex items-center gap-2 w-full">
                            <CheckIcon
                                class={cn(selectedOrg?.id !== org.id && "text-transparent")}
                            />
                            <span class="flex-1">{org.name}</span>
                            <CrownIcon
                                class={cn(!(org.isOwner || org.isAdmin) && "text-transparent")}/>

                          </div>
                        </CommandLinkItem>
                      {/each}
                    </CommandGroup>
                    <CommandSeparator/>
                    <CommandGroup>
                      <CommandLinkItem onSelect={closeAndFocusTrigger} keywords={['create organization', 'create']} href="/admin/organization/create" value="create-organization" class="flex items-center gap-2">
                        <PlusIcon class="" />
                        Create New Organization
                      </CommandLinkItem>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
        {:else}
          <div class="hidden md:flex items-center gap-1 ml-4">
            <a
                href="/"
                class={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
      page.url.pathname === '/'
        ? 'bg-primary/10 text-primary font-semibold'
        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
    }`}
            >
              Home
            </a>
            <a
                href="/pricing"
                class={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
      page.url.pathname === '/pricing'
        ? 'bg-primary/10 text-primary font-semibold'
        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
    }`}
            >
              Pricing
            </a>
            <a
                href="/contact"
                class={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
      page.url.pathname === '/contact'
        ? 'bg-primary/10 text-primary font-semibold'
        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
    }`}
            >
              Contact
            </a>
            {#if user}
              <a
                  href="/admin"
                  class={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
      page.url.pathname.startsWith('/admin')
        ? 'bg-primary/10 text-primary font-semibold'
        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
    }`}
              >
                Dashboard
              </a>
              {/if}
          </div>

          <!-- Mobile Navigation Menu -->
          <div class="md:hidden ml-4">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" class="w-48">
                <DropdownMenuItem>
                  <a href="/" class="w-full">Home</a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href="/pricing" class="w-full">Pricing</a>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <a href="/contact" class="w-full">Contact</a>
                </DropdownMenuItem>
                {#if user}
                  <DropdownMenuItem>
                  <a href="/admin" class="w-full">Dashboard</a>
                  </DropdownMenuItem>
                {/if}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        {/if}
      </div>

      <!-- Center Section: Search (on larger screens) -->
      <!--      <div class="hidden md:flex flex-1 max-w-md mx-8">-->
      <!--        <form onsubmit={handleSearch} class="relative w-full">-->
      <!--          <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />-->
      <!--          <Input-->
      <!--              type="search"-->
      <!--              placeholder="Search forms, members..."-->
      <!--              bind:value={searchQuery}-->
      <!--              class="pl-10 w-full"-->
      <!--          />-->
      <!--        </form>-->
      <!--      </div>-->

      <!-- Right Section: Actions + User Menu -->
      <div class="flex items-center gap-2">
        <!-- Mobile Search -->
<!--        <Button variant="ghost" size="sm" class="md:hidden h-8 w-8 p-0">-->
<!--          <Search class="h-4 w-4" />-->
<!--        </Button>-->

        <!-- Theme Toggle -->
        <Button variant="ghost" size="sm" onclick={toggleMode} class="h-8 w-8 p-0 border">
          <Sun class="h-4 w-4 dark:hidden" />
          <Moon class="h-4 w-4 dark:block hidden" />
        </Button>

        <!-- Notifications -->
        <!--{#if user}-->
        <!--  <DropdownMenu>-->
        <!--    <DropdownMenuTrigger>-->
        <!--      <Button variant="ghost" size="sm" class="h-8 w-8 p-0 relative">-->
        <!--        <Bell class="h-4 w-4" />-->
        <!--        {#if unreadCount > 0}-->
        <!--          <Badge variant="destructive" class="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">-->
        <!--            {unreadCount}-->
        <!--          </Badge>-->
        <!--        {/if}-->
        <!--      </Button>-->
        <!--    </DropdownMenuTrigger>-->
        <!--    <DropdownMenuContent align="end" class="w-80">-->
        <!--      <DropdownMenuLabel class="flex items-center justify-between">-->
        <!--        <span>Notifications</span>-->
        <!--        {#if unreadCount > 0}-->
        <!--          <Badge variant="secondary" class="text-xs">{unreadCount} new</Badge>-->
        <!--        {/if}-->
        <!--      </DropdownMenuLabel>-->
        <!--      <DropdownMenuSeparator />-->
        <!--      {#if notifications.length > 0}-->
        <!--        {#each notifications as notification}-->
        <!--          <DropdownMenuItem class="flex flex-col items-start gap-1 p-3">-->
        <!--            <div class="flex items-center gap-2 w-full">-->
        <!--              <div class="flex-1">-->
        <!--                <p class="text-sm font-medium">{notification.title}</p>-->
        <!--                <p class="text-xs text-muted-foreground">{notification.description}</p>-->
        <!--              </div>-->
        <!--              {#if notification.unread}-->
        <!--                <div class="h-2 w-2 bg-primary rounded-full"></div>-->
        <!--              {/if}-->
        <!--            </div>-->
        <!--            <p class="text-xs text-muted-foreground">{notification.time}</p>-->
        <!--          </DropdownMenuItem>-->
        <!--        {/each}-->
        <!--        <DropdownMenuSeparator />-->
        <!--        <DropdownMenuItem class="text-center text-sm text-primary">-->
        <!--          View all notifications-->
        <!--        </DropdownMenuItem>-->
        <!--      {:else}-->
        <!--        <DropdownMenuItem disabled class="text-center text-sm">-->
        <!--          No notifications-->
        <!--        </DropdownMenuItem>-->
        <!--      {/if}-->
        <!--    </DropdownMenuContent>-->
        <!--  </DropdownMenu>-->
        <!--{/if}-->

        <!-- User Menu -->
        {#if user}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" class="h-8 gap-2 px-2">
                <Avatar class="h-6 w-6">
                  <AvatarImage src={user.image || "/placeholder.svg"} alt={user.name} />
                  <AvatarFallback class="bg-primary/10 text-primary text-xs">
                    {getInitials(user.name || user.email)}
                  </AvatarFallback>
                </Avatar>
                <span class="hidden sm:block text-sm font-medium">
                  {user.name || user.email}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-56">
              <DropdownMenuLabel class="font-normal">
                <div class="flex flex-col space-y-1">
                  <p class="text-sm font-medium leading-none">{user.name || 'User'}</p>
                  <p class="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <a class="flex items-center gap-2" href="/profile" aria-disabled="true">
                  <User class="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <a class="flex items-center gap-2" href="/settings" aria-disabled="true">
                  <Settings class="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </a>
              </DropdownMenuItem>
              {#if isOrgAdmin}
                <DropdownMenuItem>
                  <a class="inline-flex items-center gap-2" href={`/admin`}>
                    <Building2 class="mr-2 h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </a>
                </DropdownMenuItem>
              {/if}
              <DropdownMenuSeparator />
              <DropdownMenuItem onclick={handleSignOut} class="text-destructive hover:cursor-pointer">
                <LogOut class="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        {:else}
          <!-- Not signed in -->
          <div class="flex items-center gap-2">
            <Button variant="ghost" size="sm" href="/login">
              Sign In
            </Button>
            <Button size="sm" href="/register?step=signup">
              Sign Up
            </Button>
          </div>
        {/if}
      </div>
    </div>
  </div>
</header>