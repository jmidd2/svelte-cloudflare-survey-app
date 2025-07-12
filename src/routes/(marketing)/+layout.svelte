<script lang="ts">
import { FileText } from '@lucide/svelte';
import { toast } from 'svelte-sonner';
import { page } from '$app/state';
import Footer from '$lib/components/Footer.svelte';
import { MarketingHeader as Header } from '$lib/components/header';
// import Header from '$lib/components/Header.svelte';
import { pageState } from '$stores/pageState.svelte';

const { children, data } = $props();
const user = $derived(data.user ?? undefined);
const currentOrg = $derived(data.tenant);
const organizationList = $derived(data.organizations ?? []);
const isAdminRoute = $derived(page.url.pathname.startsWith('/admin/'));
const showOrgContext = $derived(isAdminRoute && currentOrg);

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
            isSiteAdmin={data.user?.role?.includes('admin') ?? false}>
</Header>

{@render children()}

<Footer />