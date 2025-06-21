import { constants } from 'node:http2';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async function ({
  locals,
  request,
  parent,
}) {
  const data = await parent();

  const session = await locals.auth.getSession({
    headers: request.headers,
  });

  if (!session) redirect(constants.HTTP_STATUS_SEE_OTHER, '/auth/login');

  return {
    ...data,
  };
};
