<script lang="ts">
import '../app.css';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { Toaster } from '$lib/components/ui/sonner';
let { children, data } = $props();

$effect(() => {
  const user = data.session?.user;
  const allowedRoutes = ['/profile/complete', '/auth/logout'];
  const isAllowedRoute = allowedRoutes.some(route =>
    page.url.pathname.startsWith(route)
  );

  if (user && !user.name && !isAllowedRoute) {
    goto('/profile/complete');
  }
});
</script>
<Toaster richColors position="top-center" expand closeButton visibleToasts={5} />
<div class="flex h-screen overflow-x-hidden overflow-y-scroll flex-col">
  {@render children()}
</div>