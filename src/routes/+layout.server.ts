import type { LayoutServerLoad } from '../../.svelte-kit/types/src/routes/$types';

export const load: LayoutServerLoad = async function ({
  locals,
  request,
  cookies,
}) {
  const session = await locals.auth.getSession({
    headers: request.headers,
  });

  const flashMessage = cookies.get('flash_message');

  if (flashMessage) cookies.delete('flash_message', { path: '/' });

  return {
    session,
    flashMessage,
  };
};
