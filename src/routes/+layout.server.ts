import type { LayoutServerLoad } from '../../.svelte-kit/types/src/routes/$types';

export const load: LayoutServerLoad = async function ({ locals, request }) {
  const session = await locals.auth.api.getSession({
    headers: request.headers,
  });

  return {
    session,
  };
};
