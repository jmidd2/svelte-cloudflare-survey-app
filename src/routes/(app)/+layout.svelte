<script lang="ts">
import { page } from '$app/state';
import Header from '$lib/components/Header.svelte';
import { pageState } from '$stores/pageState.svelte';
import { toast } from 'svelte-sonner';

const { children, data } = $props();
const user = $derived(data.user ?? undefined);
const currentOrg = $derived(data.tenant);
const organizationList = $derived(data.organizations ?? []);
const isAdminRoute = $derived(page.url.pathname.startsWith('/admin/'));
const showOrgContext = $derived(isAdminRoute && currentOrg);

let toastId: string | number | undefined;

$effect(() => {
  if (pageState) {
    if (pageState.isLoading || pageState.isSaved) {
      if (pageState.isLoading) {
        toastId = toast.loading('Saving...');
      }

      if (pageState.isSaved) {
        if (toastId) toast.dismiss(toastId);
        toast.success('Saved');
      }
    }
  }
});
</script>
<Header     {user}
            {organizationList}
            {currentOrg}
            {showOrgContext}>
</Header>
{@render children()}