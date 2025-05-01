import { signIn } from '$lib/auth';
import type { Actions } from '../../../../.svelte-kit/types/src/routes';
export const actions: Actions = { default: signIn };
