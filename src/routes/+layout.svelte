<script lang="ts">
import '../app.css';
import { afterNavigate, goto } from '$app/navigation';
import { page } from '$app/state';
import { Toaster } from '$lib/components/ui/sonner';
import { ModeWatcher } from 'mode-watcher';
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
<ModeWatcher />
<Toaster richColors position="top-center" expand closeButton visibleToasts={5} />
{@render children()}
