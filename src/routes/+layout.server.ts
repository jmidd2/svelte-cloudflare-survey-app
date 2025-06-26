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
    user: session?.user,
    flashMessage,
  };
};

// TODO: Add prerender where needed like the pricing, contact, etc.
// FIXME: Fix Toolbox bg on long pages
// TODO: Properties menu should be static/sticky
// FIXME: Fields with options cannot be added for some reason
