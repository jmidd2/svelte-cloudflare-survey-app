<script lang="ts">
import { page } from '$app/state';
import * as Sidebar from '$lib/components/ui/sidebar';
import DashboardSidebar from '../../../DashboardSidebar.svelte';

const { children, data } = $props();

const tenant = $derived(data.tenant);
const isOrgAdmin = $derived(data.tenant?.isAdmin ?? false);
const isOrgOwner = $derived(data.tenant?.isOwner ?? false);

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

const counts = $derived({
  forms: 0,
  currentMembers: data.currentMemberCount ?? 0,
  pendingInvites: data.pendingInvites ?? 0,
  pendingRequests: data.pendingRequests ?? 0,
});
</script>

<DashboardSidebar {tenant} {isOrgAdmin} {isOrgOwner} {counts} pathname={page.url.pathname} />
<main class="flex-1">
  <div class="md:hidden flex items-center justify-between px-2 py-1 border-b border-border bg-background">
    <Sidebar.Trigger />
  </div>
    {@render children()}
</main>