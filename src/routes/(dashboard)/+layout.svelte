<script lang="ts">
import { page } from '$app/state';
import Footer from '$lib/components/Footer.svelte';
import { DashboardHeader as Header } from '$lib/components/header';
import * as Sidebar from '$lib/components/ui/sidebar';

const { children, data } = $props();

const user = $derived(data.user ?? undefined);
const currentOrg = $derived(data.tenant);
const organizationList = $derived(data.organizations ?? []);
const isAdminRoute = $derived(page.url.pathname.startsWith('/admin/'));
const showOrgContext = $derived(isAdminRoute && !!currentOrg);

let toastId: string | number | undefined;

// TODO: Fix showing toasts on async tasks and handling errors
// $effect(() => {
//   if (pageState) {
//     if (pageState.isLoading || pageState.isSaved) {
//       if (pageState.isLoading) {
//         toastId = toast.loading('Saving...');
//       }
//
//       if (pageState.isSaved) {
//         if (toastId) toast.dismiss(toastId);
//         toast.success('Saved');
//       }
//     }
//   }
// });
</script>
<Header     {user}
            {organizationList}
            {currentOrg}
            {showOrgContext}
            isSiteAdmin={data.user?.role?.includes('admin')}>
</Header>

<Sidebar.Provider class="top-[65px] lg:min-h-[calc(100vh-65px)]">
  <div class="flex w-full">
    {@render children()}
  </div>
</Sidebar.Provider>
<!-- Footer -->
<Footer />