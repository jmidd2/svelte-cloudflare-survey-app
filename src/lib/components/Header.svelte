<script lang="ts">
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { type AuthUser, authClient } from '$lib/auth-client';
import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
import { Button } from '$lib/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '$lib/components/ui/dropdown-menu';
import {
  DropdownMenuGroup,
  DropdownMenuGroupHeading,
} from '$lib/components/ui/dropdown-menu/index.js';
import { Input } from '$lib/components/ui/input';
import { Separator } from '$lib/components/ui/separator';
import type { SelectOrganization } from '$lib/server/db/schema';
import {
  Building2,
  ChevronDownIcon,
  ChevronUpIcon,
  FileText,
  Home,
  LogOut,
  Moon,
  Search,
  Settings,
  Sun,
  User,
  Users,
} from '@lucide/svelte';
import { toggleMode } from 'mode-watcher';
import { onMount } from 'svelte';
import { toast } from 'svelte-sonner';

interface HeaderProps {
  user?: AuthUser | null;
  currentOrg?: SelectOrganization | null;
  showOrgContext?: boolean;
}

let {
  user = null,
  currentOrg = null,
  showOrgContext = false,
}: HeaderProps = $props();

let searchQuery = $state('');
let isDarkMode = $state(false);
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

// Initialize theme
onMount(() => {
  isDarkMode = document.documentElement.classList.contains('dark');
});

function getInitials(name: string): string {
  return (
    name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase() || '?'
  );
}

function toggleTheme() {
  isDarkMode = !isDarkMode;
  document.documentElement.classList.toggle('dark', isDarkMode);
  localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
}

async function handleSignOut() {
  try {
    await authClient.signOut();
    toast.success('Signed out successfully');
    goto('/');
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

// Generate breadcrumbs based on current path
const breadcrumbs = $derived.by(() => {
  const path = page.url.pathname;
  const segments = path.split('/').filter(Boolean);
  const crumbs = [];

  if (segments[0] === 'admin' && segments[1] && currentOrg) {
    // Admin section breadcrumbs
    crumbs.push({
      label: 'Dashboard',
      href: `/admin/${currentOrg.slug}`,
      icon: Home,
    });

    if (segments[2] === 'forms') {
      crumbs.push({
        label: 'Forms',
        href: `/admin/${currentOrg.slug}/forms`,
        icon: FileText,
      });

      if (segments[3] && segments[3] !== 'new') {
        crumbs.push({
          label: 'Edit Form',
          href: null,
          icon: FileText,
        });
      } else if (segments[3] === 'new') {
        crumbs.push({
          label: 'New Form',
          href: null,
          icon: FileText,
        });
      }
    } else if (segments[2] === 'members') {
      crumbs.push({
        label: 'Members',
        href: null,
        icon: Users,
      });
    }
  }

  return crumbs;
});

const unreadCount = $derived(notifications.filter(n => n.unread).length);
</script>

<header class="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
          <div class="">
          <DropdownMenu>
            <DropdownMenuTrigger class="hidden md:flex gap-2 items-center group">
              <Separator orientation="vertical" class="data-[orientation=vertical]:h-10" />
              <div class="flex items-center gap-2 ml-2">
                <Avatar class="h-6 w-6">
                  <AvatarImage src={currentOrg.logo} alt={currentOrg.name} />
                  <AvatarFallback class="bg-primary/10 text-primary text-xs">
                    {getInitials(currentOrg.name)}
                  </AvatarFallback>
                </Avatar>
                <span class="text-sm font-medium text-foreground">{currentOrg.name}</span>
              </div>
              <ChevronDownIcon class="h-4 w-4 group-data-[state=open]:hidden" />
              <ChevronUpIcon class="h-4 w-4 group-data-[state=open]:block hidden" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-56">
              <DropdownMenuGroup>
                <DropdownMenuGroupHeading>Your Organizations</DropdownMenuGroupHeading>
                <DropdownMenuSeparator></DropdownMenuSeparator>
                <DropdownMenuItem>Coming Soon</DropdownMenuItem>
              </DropdownMenuGroup>
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
        <Button variant="ghost" size="sm" class="md:hidden h-8 w-8 p-0">
          <Search class="h-4 w-4" />
        </Button>

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
                  <AvatarImage src={user.image} alt={user.name} />
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
              <DropdownMenuItem>
                <a class="flex items-center gap-2" href="/profile">
                  <User class="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <a class="flex items-center gap-2" href="/settings">
                  <Settings class="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </a>
              </DropdownMenuItem>
              {#if currentOrg}
                <DropdownMenuItem>
                  <a class="inline-flex items-center gap-2" href={`/admin/${currentOrg.slug}`}>
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
            <Button size="sm" href="/register">
              Sign Up
            </Button>
          </div>
        {/if}
      </div>
    </div>
  </div>
</header>