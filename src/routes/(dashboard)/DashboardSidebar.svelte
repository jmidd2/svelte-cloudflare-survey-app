<script lang="ts">
import {
  ChartColumnIcon,
  ChevronDown,
  FileText,
  Settings,
  Users,
} from '@lucide/svelte';
import type { Component } from 'svelte';
import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
import { Badge } from '$lib/components/ui/badge';
import * as Collapsible from '$lib/components/ui/collapsible';
import * as Sidebar from '$lib/components/ui/sidebar';
import type { OrganizationListItem } from '$lib/types';
import { cn, getInitials } from '$lib/utils';

interface Props {
  tenant: OrganizationListItem | undefined;
  isOrgOwner: boolean;
  isOrgAdmin: boolean;
  counts: {
    forms: number;
    currentMembers: number;
    pendingInvites: number;
    pendingRequests: number;
  };
  pathname: string;
}

const { tenant, isOrgOwner, isOrgAdmin, counts, pathname }: Props = $props();

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
    current: pathname === `/admin/${tenant?.slug}`,
  },
  {
    name: 'Forms',
    href: `/admin/${tenant?.slug}/forms`,
    icon: FileText,
    current: pathname.includes('/forms'),
    badge: counts.forms,
  },
  {
    name: 'Members',
    href: '', //`/admin/${tenant?.slug}/members`,
    icon: Users,
    current: false, //pathname.endsWith('/members'),
    // badge: data.memberCount || 0,
    items: [
      {
        name: 'Active',
        href: `/admin/${tenant?.slug}/members/active`,
        current: pathname.endsWith('/members/active'),
        badge: counts.currentMembers,
      },
      {
        name: 'Invitations',
        href: `/admin/${tenant?.slug}/members/invitations`,
        current: pathname.endsWith('/members/invitations'),
        badge: counts.pendingInvites,
      },
      {
        name: 'Requests',
        href: `/admin/${tenant?.slug}/members/requests`,
        current: pathname.endsWith('/members/requests'),
        badge: counts.pendingRequests,
      },
    ],
  },
  {
    name: 'Analytics',
    href: `/admin/${tenant?.slug}/analytics`,
    icon: ChartColumnIcon,
    current: pathname.includes('/analytics'),
    disabled: true,
  },
  {
    name: 'Settings',
    href: `/admin/${tenant?.slug}/settings`,
    icon: Settings,
    current: pathname.includes('/settings'),
  },
]);
</script>

<Sidebar.Root class={`
    fixed top-[65px] z-20 w-(--sidebar-width) transform translate-x-0
  `} variant="sidebar" collapsible="icon">
  <Sidebar.Header>
    <div class="flex items-center gap-3 w-full ">
      <Avatar class="size-8 group-data-[collapsible=icon]:hidden group-data-[collapsible=icon]:size-7 group-data-[collapsible=icon]:text-xs group-data-[collapsible=icon]:px-4">
        <AvatarImage src={tenant?.logo} alt={tenant?.name} />
        <AvatarFallback class="bg-primary/10 text-primary font-medium ">
          {getInitials(tenant?.name || 'Org')}
        </AvatarFallback>
      </Avatar>
      <div class="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
        <h2 class="text-lg font-semibold text-foreground truncate w-full">
          {tenant?.name}
        </h2>
        <p class="text-sm text-muted-foreground">
          {#if isOrgOwner}
            Owner
          {:else if isOrgAdmin}
            Admin
          {:else}
            Member
          {/if}
        </p>
      </div>
      <Sidebar.Trigger />
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