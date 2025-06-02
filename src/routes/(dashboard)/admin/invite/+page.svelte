<script lang="ts">
import { Button } from '$lib/components/ui/button';
import { signIn } from '@auth/sveltekit/client';

function login() {
  signIn('auth0');
}
</script>
<h1>Invite code for tenant</h1>
<Button onclick={login}>Signin</Button>