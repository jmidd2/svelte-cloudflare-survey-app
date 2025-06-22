<script lang="ts">
import { page } from '$app/state';
import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
import { Badge } from '$lib/components/ui/badge';
import { Button } from '$lib/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '$lib/components/ui/dropdown-menu';
import {
  ChartColumnIcon,
  ChevronDown,
  FileText,
  Menu,
  Plus,
  Settings,
  Users,
  X,
} from '@lucide/svelte';
import type { Component, Snippet, SvelteComponent } from 'svelte';
import { setDataStatusContext } from '../breadcrumbContext.svelte';

const { children, data } = $props();

const tenant = $derived(data.tenant);
const tenants = $derived(data.tenants);
const user = $derived(data.user);
const isAdmin = $derived(data.isAdmin);

let status = $state({ isSaved: false, isLoading: false });
let sidebarOpen = $state(false);

setDataStatusContext(status);

$effect(() => {
  let timeout: NodeJS.Timeout | null = null;
  if (status.isSaved) {
    timeout = setTimeout(() => {
      status.isSaved = false;
    }, 2000);
  }

  return () => {
    if (timeout) clearTimeout(timeout);
  };
});

interface NavigationItem {
  name: string;
  href: string;
  icon: Component;
  current: boolean;
  disabled?: boolean;
  badge?: number;
}

// Navigation items
const navigationItems = $derived<NavigationItem[]>([
  {
    name: 'Dashboard',
    href: `/admin/${tenant?.slug}`,
    icon: ChartColumnIcon,
    current: page.url.pathname === `/admin/${tenant?.slug}`,
  },
  {
    name: 'Forms',
    href: `/admin/${tenant?.slug}/forms`,
    icon: FileText,
    current: page.url.pathname.includes('/forms'),
    badge: data.forms?.length || 0,
  },
  {
    name: 'Members',
    href: `/admin/${tenant?.slug}/members`,
    icon: Users,
    current: page.url.pathname.includes('/members'),
    badge: data.memberCount || 0,
  },
  {
    name: 'Analytics',
    href: `/admin/${tenant?.slug}/analytics`,
    icon: ChartColumnIcon,
    current: page.url.pathname.includes('/analytics'),
    disabled: true,
  },
  {
    name: 'Settings',
    href: `/admin/${tenant?.slug}/settings`,
    icon: Settings,
    current: page.url.pathname.includes('/settings'),
    disabled: true,
  },
]);

function getInitials(name: string): string {
  return (
    name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase() || '?'
  );
}

function closeSidebar() {
  sidebarOpen = false;
}
</script>

<!-- This layout sits BELOW the Header component -->
<div class="flex h-[calc(100vh-65px)] bg-background"> <!-- Subtract header height (64px = 4rem) -->
  <!-- Mobile sidebar overlay -->
  {#if sidebarOpen}
    <div class="fixed inset-0 z-40 lg:hidden top-24"> <!-- Account for header -->
      <div class="fixed inset-0 bg-black/50" role="button" tabindex="0" onclick={closeSidebar} onkeydown={() => {}}></div>
    </div>
  {/if}

  <!-- Sidebar -->
  <div class={`
    fixed left-0 top-24 h-[calc(100vh-65px)] z-50 w-72 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
  `}> <!-- Position below header -->
    <div class="flex flex-col h-full">
      <!-- Organization Header -->
      <div class="p-6 border-b border-border">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Avatar class="h-10 w-10">
              <AvatarImage src={tenant?.logo} alt={tenant?.name} />
              <AvatarFallback class="bg-primary/10 text-primary font-medium">
                {getInitials(tenant?.name || 'Org')}
              </AvatarFallback>
            </Avatar>
            <div class="flex-1 min-w-0">
              <h2 class="text-lg font-semibold text-foreground truncate">
                {tenant?.name}
              </h2>
              <p class="text-sm text-muted-foreground">
                {isAdmin ? 'Admin' : 'Member'}
              </p>
            </div>
          </div>

          <!-- Mobile close button -->
          <Button
              variant="ghost"
              size="sm"
              class="lg:hidden h-8 w-8 p-0"
              onclick={closeSidebar}
          >
            <X class="h-4 w-4" />
          </Button>
        </div>

        <!-- Organization Switcher -->
        {#if tenants && tenants.length > 1}
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="ghost" class="w-full justify-between mt-3 h-8 px-2">
                <span class="text-sm">Switch Organization</span>
                <ChevronDown class="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="w-64" align="start">
              {#each tenants as org}
                <DropdownMenuItem class={org.slug === tenant?.slug ? 'bg-accent' : ''}>
                  <a href={`/admin/${org.slug}`} class="flex items-center gap-3 w-full">
                    <Avatar class="h-6 w-6">
                      <AvatarImage src={org.logo} alt={org.name} />
                      <AvatarFallback class="bg-primary/10 text-primary text-xs">
                        {getInitials(org.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span class="flex-1 truncate">{org.name}</span>
                    {#if org.slug === tenant?.slug}
                      <Badge variant="secondary" class="text-xs">Current</Badge>
                    {/if}
                  </a>
                </DropdownMenuItem>
              {/each}
            </DropdownMenuContent>
          </DropdownMenu>
        {/if}
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-4 space-y-2">
        {#each navigationItems as item}
          <a
              href={item.disabled ? undefined : item.href}
              class={`
              flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${item.current 
                ? 'bg-primary text-primary-foreground' 
                : item.disabled 
                  ? 'text-muted-foreground cursor-not-allowed opacity-50'
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground'
              }
            `}
              onclick={item.disabled ? undefined : closeSidebar}
          >
            <item.icon class="h-5 w-5" />
            <span class="flex-1">{item.name}</span>
            {#if item.badge !== undefined && item.badge > 0}
              <Badge variant={item.current ? "secondary" : "outline"} class="text-xs">
                {item.badge}
              </Badge>
            {/if}
            {#if item.disabled}
              <Badge variant="outline" class="text-xs">Soon</Badge>
            {/if}
          </a>
        {/each}
      </nav>

      <!-- Quick Actions -->
      <div class="p-4 border-t border-border">
        <Button class="w-full justify-start gap-2" href={`/admin/${tenant?.slug}/forms/new`}>
          <Plus class="h-4 w-4" />
          Create Form
        </Button>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div class="flex-1 flex flex-col min-w-0">
    <!-- Mobile Header Bar (shows org name and menu button) -->
    <div class="lg:hidden flex items-center justify-between p-4 border-b border-border bg-background">
      <Button
          variant="ghost"
          size="sm"
          onclick={() => { sidebarOpen = true; }}
          class="h-8 w-8 p-0"
      >
        <Menu class="h-4 w-4" />
      </Button>

      <div class="flex items-center gap-2">
        <Avatar class="h-6 w-6">
          <AvatarImage src={tenant?.logo} alt={tenant?.name} />
          <AvatarFallback class="bg-primary/10 text-primary text-xs">
            {getInitials(tenant?.name || 'Org')}
          </AvatarFallback>
        </Avatar>
        <span class="font-medium text-sm">{tenant?.name}</span>
      </div>

      <!-- Status indicator -->
      <div class="flex items-center gap-2">
        {#if status.isLoading}
          <div class="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        {/if}
        {#if status.isSaved}
          <div class="text-green-600 text-sm font-medium">Saved!</div>
        {/if}
      </div>
    </div>

    <!-- Page Content -->
    <main class="flex-1 overflow-auto">
      {@render children()}
    </main>
  </div>
</div>
