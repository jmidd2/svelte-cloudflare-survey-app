<script lang="ts">
import '../app.css';
import { goto } from '$app/navigation';
import { page } from '$app/state';
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
<div class="flex h-screen overflow-x-hidden overflow-y-scroll flex-col">
  {@render children()}
</div>