import { constants } from 'node:http2';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = async function ({ locals, params, request, parent }) {
  const data = await parent();

  const { tenant_slug } = params;

  // const tenant = await getTenantBySlug(locals.db, tenant_slug);
  // const tenant = await locals.auth.getFullOrganization({
  //   headers: request.headers,
  //   query: { organizationSlug: tenant_slug },
  // });
  //
  // if (!tenant) redirect(constants.HTTP_STATUS_SEE_OTHER, '/login');
  //
  // await locals.auth.setActiveOrganization({
  //   headers: request.headers,
  //   body: {
  //     organizationId: tenant.id,
  //   },
  // });
  //
  // return {
  //   tenant,
  // };
};
