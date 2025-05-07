import { constants } from 'node:http2';
import { getFormsByTenant, getTenantBySlug } from '$lib/server/db';
import { isAdmin } from '$lib/server/utils';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function ({ locals, params }) {
  const { tenant_slug } = params;

  const tenant = await getTenantBySlug(locals.db, tenant_slug);

  if (!tenant) redirect(constants.HTTP_STATUS_SEE_OTHER, '/login');

  const session = await locals.auth();

  const forms = await getFormsByTenant(locals.db, tenant.id);

  return {
    forms,
    tenant,
    session,
    isAdmin: session ? isAdmin(session.user) : false,
  };
};
