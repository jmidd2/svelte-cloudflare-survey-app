<script lang="ts">
import { signOut } from '@auth/sveltekit/client';
import { SignIn } from '@auth/sveltekit/components';
import type { PageProps } from './$types';

const { data }: PageProps = $props();

const session = $derived(data.session);

const user = $derived(session?.user);
</script>

{#if !(session && user)}
<div>
    <SignIn provider="auth0" signInPage="login" />
</div>
    {/if}

{#if session && user}
    <h1>Welcome, {user.name}!</h1>
<div>
    <button onclick={() => signOut()}>Sign Out</button>
</div>
{/if}