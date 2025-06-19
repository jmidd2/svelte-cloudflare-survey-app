import { getFormsByTenant } from '$lib/server/db';
import { constants } from 'node:http2';
import { redirect } from '@sveltejs/kit';

export const load = async function ({ locals, parent }) {
  const { tenant, user } = await parent();
  if (!user) redirect(constants.HTTP_STATUS_SEE_OTHER, '/auth/login');

  const forms = await getFormsByTenant(locals.db, tenant.id);

  return {
    forms,
    tenant,
    user,
    isAdmin: user.role === 'admin',
  };
};
