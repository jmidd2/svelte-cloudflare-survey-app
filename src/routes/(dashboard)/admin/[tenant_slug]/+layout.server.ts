import { constants } from 'node:http2';
import { getTenantBySlug } from '$lib/server/db';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function ({ locals, params }) {
  const { tenant_slug } = params;

  const tenant = await getTenantBySlug(locals.db, tenant_slug);

  if (!tenant) redirect(constants.HTTP_STATUS_SEE_OTHER, '/login');

  return {
    tenant,
  };
};
