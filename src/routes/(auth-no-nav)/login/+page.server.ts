import { constants } from 'node:http2';
import { redirect } from '@sveltejs/kit';

export const load = async ({
  locals,
  cookies,
  url,
  request: { headers, ...request },
}) => {
  const session = await locals.auth.getSession({ headers });
  if (session) redirect(constants.HTTP_STATUS_SEE_OTHER, '/');
};
