import { constants } from 'node:http2';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = async function ({ locals, params, request }) {
  const { tenant_slug } = params;

  // const tenant = await getTenantBySlug(locals.db, tenant_slug);
  const tenant = await locals.auth.api.getFullOrganization({
    headers: request.headers,
    query: { organizationSlug: tenant_slug },
  });

  if (!tenant) redirect(constants.HTTP_STATUS_SEE_OTHER, '/auth/login');

  return {
    tenant,
  };
};
