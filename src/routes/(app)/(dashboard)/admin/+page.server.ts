import { constants } from 'node:http2';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function ({
  locals,
  request,
  parent,
}) {
  const data = await parent();

  const session = await locals.auth.api.getSession({
    headers: request.headers,
  });

  if (!session) redirect(constants.HTTP_STATUS_SEE_OTHER, '/auth/login');

  return {
    ...data,
  };
};
