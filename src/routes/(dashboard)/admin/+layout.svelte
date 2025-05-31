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
  DropdownMenuTrigger,
} from '$lib/components/ui/dropdown-menu';
import { ChevronDownIcon } from '@lucide/svelte';

const { children } = $props();

const tenant = $derived(page.data.tenant);
const tenants = $derived(page.data.tenants);
const survey = $derived(page.data.survey);
const isAdmin = $derived(page.data.isAdmin);
const results = $derived(page.data.submissions ?? []);
</script>

<div class="border-b border-b-muted px-4 py-3">
  <Breadcrumb>
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink href="/">Home</BreadcrumbLink>
      </BreadcrumbItem>
      {#if tenant}
        {#if survey}
          {@const tenantHref = `/admin/${tenant.slug}`}
          <BreadcrumbSeparator/>
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
                  {survey.title}
                  <ChevronDownIcon class="size-4"/>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem><a href={`${tenantHref}/forms/${survey.slug}/results`}>View Submissions</a>
                  </DropdownMenuItem>
                  <DropdownMenuItem>Themes</DropdownMenuItem>
                  <DropdownMenuItem>GitHub</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
          {/if}
        {:else}
          <BreadcrumbSeparator/>
          <!-- If other tenants show a drop down -->
          {#if isAdmin}
            {#if tenants && tenants.length > 0}
              <BreadcrumbItem>
                <DropdownMenu>
                  <DropdownMenuTrigger class="flex items-center gap-1">
                    {tenant.name}
                    <ChevronDownIcon class="size-4"/>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
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
      {/if}
    </BreadcrumbList>
  </Breadcrumb>
</div>
{@render children()}