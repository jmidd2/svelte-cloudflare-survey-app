import { constants } from 'node:http2';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function ({ locals }) {
  const session = await locals.auth();

  if (!session?.user) redirect(constants.HTTP_STATUS_SEE_OTHER, '/login');

  return redirect(
    constants.HTTP_STATUS_SEE_OTHER,
    `/admin/${session.user.tenant.id}`
  );
};
