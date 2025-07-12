<script lang="ts">
import {
  ChartColumnIcon,
  ChevronDown,
  FileText,
  Menu,
  Settings,
  Users,
  X,
} from '@lucide/svelte';
import type { Component } from 'svelte';
import { page } from '$app/state';
import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
import { Badge } from '$lib/components/ui/badge';
import { Button } from '$lib/components/ui/button';
import * as Collapsible from '$lib/components/ui/collapsible';
import * as Sidebar from '$lib/components/ui/sidebar';
import { cn, getInitials } from '$lib/utils';

// const sidebar = Sidebar.useSidebar();

const { children, data } = $props();

const tenant = $derived(data.tenant);
const isAdmin = $derived(data.isOrgAdmin);
const isOwner = $derived(data.isOrgOwner);

$inspect(data);
let status = $state({ isSaved: false, isLoading: false });
let sidebarOpen = $state(true);

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
  items?: Partial<NavigationItem>[];
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
    // @ts-expect-error
    badge: data.forms?.length || 0,
  },
  {
    name: 'Members',
    href: '', //`/admin/${tenant?.slug}/members`,
    icon: Users,
    current: false, //page.url.pathname.endsWith('/members'),
    // badge: data.memberCount || 0,
    items: [
      {
        name: 'Active',
        href: `/admin/${tenant?.slug}/members/active`,
        current: page.url.pathname.endsWith('/members/active'),
        badge: data.currentMemberCount || 0,
      },
      {
        name: 'Invitations',
        href: `/admin/${tenant?.slug}/members/invitations`,
        current: page.url.pathname.endsWith('/members/invitations'),
        badge: data.pendingInvites || 0,
      },
      {
        name: 'Requests',
        href: `/admin/${tenant?.slug}/members/requests`,
        current: page.url.pathname.endsWith('/members/requests'),
        badge: data.pendingRequests || 0,
      },
    ],
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

function closeSidebar() {
  sidebarOpen = false;
}
// TODO: Make Settings Page
</script>

<!-- This layout sits BELOW the Header component -->

<div class="flex bg-background">
  <!-- Mobile sidebar overlay -->
  <Sidebar.Provider class={`
    fixed top-[65px] z-20 w-(--sidebar-width) transform lg:min-h-[calc(100vh-65px)] translate-x-0 lg:static lg:inset-0
  `}>
  <Sidebar.Root>
    <Sidebar.Header>
      <div class="px-3 py-4 flex items-center gap-3 w-full">
        <Avatar class="h-10 w-10">
          <AvatarImage src={tenant?.logo} alt={tenant?.name} />
          <AvatarFallback class="bg-primary/10 text-primary font-medium">
            {getInitials(tenant?.name || 'Org')}
          </AvatarFallback>
        </Avatar>
        <div class="flex-1 min-w-0">
          <h2 class="text-lg font-semibold text-foreground truncate w-full">
            {tenant?.name}
          </h2>
          <p class="text-sm text-muted-foreground">
            {#if isOwner}
              Owner
            {:else if isAdmin}
              Admin
            {:else}
              Member
            {/if}
          </p>
        </div>
      </div>
    </Sidebar.Header>
    <Sidebar.Separator class="mx-0" />
    <Sidebar.Content class="px-1 py-2">
      {#each navigationItems as item}
        <Sidebar.Group class="p-1">
        {#if item.items}
          <Sidebar.Menu>
            <Collapsible.Root open class="group/collapsible">
              <Sidebar.MenuItem>
                <Collapsible.Trigger>
                  {#snippet child({ props })}
                    <Sidebar.MenuButton {...props}>
                      {#snippet child({ props })}
                        <span {...props}>
                          <item.icon class="size-4" />
                          {item.name}
                          <ChevronDown
                              class="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180"
                          /></span>
                      {/snippet}
                    </Sidebar.MenuButton>
                  {/snippet}
                </Collapsible.Trigger>
                <Collapsible.Content class="pt-1">
                  <Sidebar.MenuSub>
                    {#each item.items as subItem}
                    <Sidebar.MenuSubItem>
                      <Sidebar.MenuButton isActive={subItem.current}>
                        {#snippet child({ props: { class: className, ...props } })}
                          <a href={subItem.href} class={cn(className, "data-[active=true]:bg-spark-primary")} {...props}>
<!--                            <subItem.icon />-->
                            <span>{subItem.name}</span>
                          </a>
                        {/snippet}
                      </Sidebar.MenuButton>
                      <Sidebar.MenuBadge><Badge variant={subItem.current ? "secondary" : "outline"} class="text-xs">
                        {subItem.badge}
                      </Badge></Sidebar.MenuBadge>
                    </Sidebar.MenuSubItem>
                      {/each}
                  </Sidebar.MenuSub>
                </Collapsible.Content>
              </Sidebar.MenuItem>
            </Collapsible.Root>
          </Sidebar.Menu>
          {:else}
            <Sidebar.Menu>
              <Sidebar.MenuItem class={['', {"text-muted-foreground cursor-not-allowed opacity-50 hover:bg-transparent": item.disabled}]}>
                <Sidebar.MenuButton isActive={item.current} class={['', {"hover:text-muted-foreground cursor-not-allowed opacity-50 hover:bg-transparent": item.disabled}]}>
                  {#snippet child({ props: { class: className, ...props } })}
                    <a href={item.disabled ? undefined : item.href} class={cn(className, "data-[active=true]:bg-spark-primary")} {...props}>
                      <item.icon />
                      <span>{item.name}</span>
                    </a>
                    {/snippet}
                </Sidebar.MenuButton>

                {#if item.disabled}
                  <Sidebar.MenuBadge>
                  <Badge variant="outline" class="text-xs">Soon</Badge>
                  </Sidebar.MenuBadge>
                {/if}
              </Sidebar.MenuItem>
            </Sidebar.Menu>
          {/if}
        </Sidebar.Group>
      {/each}
    </Sidebar.Content>
  </Sidebar.Root>
</Sidebar.Provider>

  <!-- Sidebar //TODO: Use Sidebar from shadcn -->
<!--  <div class={`-->
<!--    fixed left-0 top-[65px] h-[calc(100vh-65px)] lg:h-auto lg:min-h-[calc(100vh-392px)] z-20 w-72 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0-->
<!--    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}-->
<!--  `}>-->
<!--    <div class="flex flex-col h-full">-->
<!--      &lt;!&ndash; Organization Header &ndash;&gt;-->
<!--      <div class="p-6 border-b border-border">-->
<!--        <div class="flex items-center justify-between">-->
<!--          <div class="flex items-center gap-3 w-full">-->
<!--            <Avatar class="h-10 w-10">-->
<!--              <AvatarImage src={tenant?.logo} alt={tenant?.name} />-->
<!--              <AvatarFallback class="bg-primary/10 text-primary font-medium">-->
<!--                {getInitials(tenant?.name || 'Org')}-->
<!--              </AvatarFallback>-->
<!--            </Avatar>-->
<!--            <div class="flex-1 min-w-0">-->
<!--              <h2 class="text-lg font-semibold text-foreground truncate w-full">-->
<!--                {tenant?.name}-->
<!--              </h2>-->
<!--              <p class="text-sm text-muted-foreground">-->
<!--                {#if isOwner}-->
<!--                  Owner-->
<!--                  {:else if isAdmin}-->
<!--                  Admin-->
<!--                  {:else}-->
<!--                  Member-->
<!--                  {/if}-->
<!--              </p>-->
<!--            </div>-->
<!--          </div>-->

<!--          &lt;!&ndash; Mobile close button &ndash;&gt;-->
<!--          <Button-->
<!--              variant="ghost"-->
<!--              size="sm"-->
<!--              class="lg:hidden h-8 w-8 p-0"-->
<!--              onclick={closeSidebar}-->
<!--          >-->
<!--            <X class="h-4 w-4" />-->
<!--          </Button>-->
<!--        </div>-->
<!--      </div>-->

<!--      &lt;!&ndash; Navigation &ndash;&gt;-->
<!--      <nav class="flex-1 p-4 space-y-2">-->
<!--        {#each navigationItems as item}-->
<!--          <a-->
<!--              href={item.disabled ? undefined : item.href}-->
<!--              class={`-->
<!--              flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors-->
<!--              ${item.current-->
<!--                ? 'bg-primary text-primary-foreground'-->
<!--                : item.disabled-->
<!--                  ? 'text-muted-foreground cursor-not-allowed opacity-50'-->
<!--                  : 'text-foreground hover:bg-accent hover:text-accent-foreground'-->
<!--              }-->
<!--            `}-->
<!--              onclick={item.disabled ? undefined : closeSidebar}-->
<!--          >-->
<!--            <item.icon class="h-5 w-5" />-->
<!--            <span class="flex-1">{item.name}</span>-->
<!--            {#if item.badge !== undefined && item.badge > 0}-->
<!--              <Badge variant={item.current ? "secondary" : "outline"} class="text-xs">-->
<!--                {item.badge}-->
<!--              </Badge>-->
<!--            {/if}-->
<!--            {#if item.disabled}-->
<!--              <Badge variant="outline" class="text-xs">Soon</Badge>-->
<!--            {/if}-->
<!--          </a>-->
<!--          {#if item.items}-->
<!--            <ul class="pl-6 border-l border-border space-y-1">-->
<!--              {#each item.items as subItem}-->
<!--                <li>-->
<!--                  <a-->
<!--                      href={subItem.disabled ? undefined : subItem.href}-->
<!--                      class={`-->
<!--                        flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors-->
<!--                        ${subItem.current-->
<!--                          ? 'bg-primary text-primary-foreground'-->
<!--                          : subItem.disabled-->
<!--                            ? 'text-muted-foreground cursor-not-allowed opacity-50'-->
<!--                            : 'text-foreground hover:bg-accent hover:text-accent-foreground'-->
<!--                        }-->
<!--                      `}-->
<!--                      onclick={subItem.disabled ? undefined : closeSidebar}-->
<!--                  >-->
<!--                    <span class="flex-1">{subItem.name}</span>-->
<!--                    {#if subItem.badge !== undefined}-->
<!--                      <Badge variant={subItem.current ? "secondary" : "outline"} class="text-xs">-->
<!--                        {subItem.badge}-->
<!--                      </Badge>-->
<!--                    {/if}-->
<!--                    {#if subItem.disabled}-->
<!--                      <Badge variant="outline" class="text-xs">Soon</Badge>-->
<!--                    {/if}-->
<!--                  </a>-->
<!--                </li>-->
<!--              {/each}-->
<!--            </ul>-->
<!--          {/if}-->
<!--        {/each}-->
<!--      </nav>-->

<!--&lt;!&ndash;      &lt;!&ndash; Quick Actions &ndash;&gt;&ndash;&gt;-->
<!--&lt;!&ndash;      <div class="p-4 border-t border-border">&ndash;&gt;-->
<!--&lt;!&ndash;        <Button class="w-full justify-start gap-2" onclick={openAddDialog}>&ndash;&gt;-->
<!--&lt;!&ndash;          <Plus class="h-4 w-4" />&ndash;&gt;-->
<!--&lt;!&ndash;          Create Form&ndash;&gt;-->
<!--&lt;!&ndash;        </Button>&ndash;&gt;-->
<!--&lt;!&ndash;      </div>&ndash;&gt;-->
<!--    </div>-->
<!--  </div>-->

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

<!--      <div class="flex items-center gap-2">-->
<!--        <Avatar class="h-6 w-6">-->
<!--          <AvatarImage src={tenant?.logo} alt={tenant?.name} />-->
<!--          <AvatarFallback class="bg-primary/10 text-primary text-xs">-->
<!--            {getInitials(tenant?.name || 'Org')}-->
<!--          </AvatarFallback>-->
<!--        </Avatar>-->
<!--        <span class="font-medium text-sm">{tenant?.name}</span>-->
<!--      </div>-->
    </div>

    <!-- Page Content -->

    <main class="flex-1 overflow-auto">
      {@render children()}
    </main>
  </div>
</div>

<!--<EditCreateFormDialog editForm={addForm} action={`${page.url.pathname}/forms?/add-form`}></EditCreateFormDialog>-->