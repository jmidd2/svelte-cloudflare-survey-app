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

const tenant = $derived(page.data.tenant);
const tenants = $derived(page.data.tenants);
const survey = $derived(page.data.survey);
const isAdmin = $derived(page.data.isAdmin);
const results = $derived(page.data.submissions ?? []);
let status = $state({ isSaved: false, isLoading: false });
setBreadcrumbContext(status);

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
</script>

<div class="border-b border-b-muted px-4 py-3 flex items-center gap-2 text-muted-foreground">
  <Breadcrumb>
    <BreadcrumbList>
      {#if tenant}
        {#if survey}
          {@const tenantHref = `/admin/${tenant.slug}`}
          <BreadcrumbItem>
            <BreadcrumbLink href={tenantHref}>{tenant.name}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator/>
          {#if page.url.pathname.endsWith('results')}
            <BreadcrumbItem>
              <BreadcrumbLink href={`${tenantHref}/forms/${survey.slug}`}>{survey.title}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator/>
            <BreadcrumbItem>
              <BreadcrumbPage>Submissions</BreadcrumbPage>
            </BreadcrumbItem>
          {:else}
            <BreadcrumbItem>
              <DropdownMenu>
                <!-- Could put other surveys here or access the survey's settings and delete actions -->
                <DropdownMenuTrigger class="flex items-center gap-1">
                  <BreadcrumbPage>{survey.title}</BreadcrumbPage>
                  <ChevronDownIcon class="size-4"/>
                </DropdownMenuTrigger>
                <DropdownMenuContent class="w-40" align="end">
                  <DropdownMenuItem>
                    <a class="w-full" href={`${tenantHref}/forms/${survey.slug}`}>Edit Form</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <a class="w-full" href={`${tenantHref}/forms/${survey.slug}/results`}>View Submissions</a>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
          {/if}
        {:else}
          <!-- If other tenants show a drop down -->
          {#if isAdmin}
            {#if tenants && tenants.length > 0}
              <BreadcrumbItem>
                <DropdownMenu>
                  <DropdownMenuTrigger class="flex items-center gap-1">
                    <BreadcrumbPage>{tenant.name}</BreadcrumbPage>
                    <ChevronDownIcon class="size-4"/>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Documentation</DropdownMenuItem>
                    <DropdownMenuItem>Themes</DropdownMenuItem>
                    <DropdownMenuItem>GitHub</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </BreadcrumbItem>
            {:else}
              <!-- Otherwise just show the tenant name -->
              <BreadcrumbItem>
                <BreadcrumbPage>{tenant.name}</BreadcrumbPage>
              </BreadcrumbItem>
            {/if}
          {:else}
            <BreadcrumbItem>
              <BreadcrumbPage>{tenant.name}</BreadcrumbPage>
            </BreadcrumbItem>
          {/if}
        {/if}
        {:else}
        <BreadcrumbItem>
          <BreadcrumbPage>Dashboard</BreadcrumbPage>
        </BreadcrumbItem>
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