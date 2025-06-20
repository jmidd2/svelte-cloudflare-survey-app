<script lang="ts">
  import { page } from '$app/state';
  import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
  } from '$lib/components/ui/breadcrumb';
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from '$lib/components/ui/dropdown-menu';
  import { CheckCheckIcon, ChevronDownIcon } from '@lucide/svelte';
  import { setBreadcrumbContext } from './breadcrumbContext.svelte';

  const { children } = $props();

  const tenant = $derived( page.data.tenant );
  const tenants = $derived( page.data.tenants );
  const survey = $derived( page.data.survey );
  const isAdmin = $derived( page.data.isAdmin );
  const results = $derived( page.data.submissions ?? [] );
  let status = $state( { isSaved: false, isLoading: false } );
  setBreadcrumbContext( status );

  $effect( () => {
    let timeout: NodeJS.Timeout | null = null;
    if ( status.isSaved ) {
      timeout = setTimeout( () => {
        status.isSaved = false;
      }, 2000 );
    }

    return () => {
      if ( timeout ) clearTimeout( timeout );
    };
  } );


  // function builder(path: string) {
  //   const base = '/admin';
  //   const parts = path.split('/').filter(Boolean);
  //   const crumbs = [];
  //
  //   let currentPath = base;
  //   crumbs.push({ href: currentPath, label: 'Dashboard' });
  //
  //   for (const part of parts) {
  //     if (part === 'admin') continue;
  //     currentPath += `/${part}`;
  //     crumbs.push({ href: currentPath, label: crumbs[part] || part });
  //   }
  //
  //   return crumbs;
  // }

  type BreadcrumbMap = {
    [key: string]: { label: string; href: string; options?: { href: string; label: string; disabled?: boolean; }[] };
  };

  const breadcrumbRouteMap: BreadcrumbMap = $derived( {
    admin: { label: 'Dashboard', href: '/admin' },
    '[tenant_slug]': {
      label: tenant?.name ?? '',
      href: `/admin/${ tenant?.slug ?? '' }`,
    },
    members: {
      label: 'Members',
      href: `/admin/${ tenant?.slug ?? '' }/members`,
    },
    forms: {
      label: 'Forms',
      href: `/admin/${ tenant?.slug ?? '' }/forms`,
    },
    '[survey_slug]': {
      label: survey?.title ?? '',
      href: `/admin/${ tenant?.slug ?? '' }/forms/${ survey?.slug ?? '' }`,
      options: [
        {
          href: `/admin/${ tenant?.slug }/forms/${ survey?.slug }`,
          label: 'Edit',
        },
        {
          href: `/admin/${ tenant?.slug }/forms/${ survey?.slug }/results`,
          label: 'Results'
        }
      ]
    },
    results: {
      label: 'Results',
      href: `/admin/${ tenant?.slug ?? '' }/forms/${ survey?.slug ?? '' }/results`,
    },
    settings: { label: 'Settings', href: '/settings' },
    delete: { label: 'Delete', href: '/delete' },
    edit: { label: 'Edit', href: '/edit' },
    add: { label: 'Add', href: '/add' },
    themes: { label: 'Themes', href: '/themes' },
  } );

  const breadcrumbs = $derived.by( () => {
    const { id } = page.route;
    if ( !id ) return [];

    const parts = id
        .split( '/' )
        .filter( part => !part.startsWith( '(' ) && part !== 'forms' );

    const crumbs: BreadcrumbMap[] = [];
    for ( const part of parts ) {
      if ( part === '' ) continue;
      if ( breadcrumbRouteMap[part] ) {
        crumbs.push( breadcrumbRouteMap[part] );
      }
    }
    return crumbs;
  } );
  // const breadcrumbs = $derived.by( () => {
  //   return builder( page.route.id ?? '' );
  // } );

  $inspect( breadcrumbs, page );
</script>

<div class="border-b border-b-muted px-4 py-3 flex items-center gap-2 text-muted-foreground">
  <Breadcrumb>
    <BreadcrumbList>
      {#if breadcrumbs.length === 1}
        <BreadcrumbPage>Dashboard</BreadcrumbPage>
      {:else}
        {#each breadcrumbs as { href, label, options }, index}
          {#if index === breadcrumbs.length - 1}
            {#if options && options.length > 0}
              <DropdownMenu>
                <!-- Could put other surveys here or access the survey's settings and delete actions -->
                <DropdownMenuTrigger class="flex items-center gap-1">
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                  <ChevronDownIcon class="size-4"/>
                </DropdownMenuTrigger>
                <DropdownMenuContent class="w-40" align="end">
                  {#each options as { href, label, disabled } }
                    <DropdownMenuItem {disabled}>
                      <a class="w-full" {href}>{label}</a>
                    </DropdownMenuItem>
                  {/each}
                </DropdownMenuContent>
              </DropdownMenu>
            {:else}
              <BreadcrumbItem>
                <BreadcrumbPage>{label}</BreadcrumbPage>
              </BreadcrumbItem>
            {/if}
          {:else}
            {#if options && options.length > 0}
              <DropdownMenu>
                <!-- Could put other surveys here or access the survey's settings and delete actions -->
                <DropdownMenuTrigger class="flex items-center gap-1">
                  <BreadcrumbLink>
                    {#snippet child( props )}
                      {label}
                    {/snippet}
                  </BreadcrumbLink>
                  <ChevronDownIcon class="size-4"/>
                </DropdownMenuTrigger>
                <DropdownMenuContent class="w-40" align="end">
                  {#each options as { href, label, disabled } }
                    <DropdownMenuItem {disabled}>
                      <a class="w-full" {href}>{label}</a>
                    </DropdownMenuItem>
                  {/each}
                </DropdownMenuContent>
              </DropdownMenu>
            {:else}
              <BreadcrumbItem>
                <BreadcrumbLink {href}>{label}</BreadcrumbLink>
              </BreadcrumbItem>
            {/if}
          {/if}
          {#if index < breadcrumbs.length - 1}
            <BreadcrumbSeparator/>
          {/if}
        {/each}
      {/if}
    </BreadcrumbList>
  </Breadcrumb>

  <div class="flex gap-2 items-center justify-center text-green-600 text-sm">
    {#if status.isLoading}
      <svg class="ml-1 size-4 animate-spin inline text-accent-foreground" xmlns="http://www.w3.org/2000/svg" fill="none"
           viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    {/if}
    {#if status.isSaved}
      <CheckCheckIcon class="size-5"></CheckCheckIcon>
      Saved!
    {/if}
  </div>
</div>
{@render children()}