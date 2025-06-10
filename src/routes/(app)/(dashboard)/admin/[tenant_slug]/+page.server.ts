import { constants } from 'node:http2';
import { getFormsByTenant } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';

export const load = async function ({ locals, parent }) {
  const { tenant, session } = await parent();
  if (!session) redirect(constants.HTTP_STATUS_SEE_OTHER, '/auth/login');

  const forms = await getFormsByTenant(locals.db, tenant.id);

  return {
    forms,
    tenant,
    session,
    isAdmin: session.user.role === 'admin',
  };
};
