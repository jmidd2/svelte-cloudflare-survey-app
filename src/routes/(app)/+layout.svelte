<script lang="ts">
import { page } from '$app/state';
import Header from '$lib/components/Header.svelte';

const { children, data } = $props();
const user = $derived(data.user ?? undefined);
const currentOrg = $derived(data.tenant ?? null);
const organizationList = $derived(data.organizations ?? []);
const isAdminRoute = $derived(page.url.pathname.startsWith('/admin/'));
const showOrgContext = $derived(isAdminRoute && currentOrg);

$inspect(data);
</script>
<Header     {user}
            {organizationList}
            {currentOrg}
            {showOrgContext}>
</Header>
{@render children()}