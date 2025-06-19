<script lang="ts">
import '../app.css';
import { goto } from '$app/navigation';
import { page } from '$app/state';
import { Toaster } from '$lib/components/ui/sonner';
import { toast } from 'svelte-sonner';

let { children, data } = $props();

$effect(() => {
  const user = data.session?.user;

  if (user && !user.name) {
    goto('/profile/complete');
  }

  if (data.flashMessage) {
    toast.success(data.flashMessage);
  }
});
</script>
<Toaster richColors position="top-center" expand closeButton visibleToasts={5} />
<div class="flex h-screen overflow-x-hidden overflow-y-scroll flex-col">
  {@render children()}
</div>