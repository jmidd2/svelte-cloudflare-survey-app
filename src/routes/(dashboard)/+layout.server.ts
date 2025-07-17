import { constants } from 'node:http2';
import { redirect } from '@sveltejs/kit';
import type { Organization } from 'better-auth/plugins';
import { eq } from 'drizzle-orm';
import {
  invitations,
  members,
  organizations as organizationsTable,
  requests as requestsTable,
  type SelectOrganization,
} from '$lib/server/db/schema';
import type { OrganizationListItem } from '$lib/types';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async function ({
  locals,
  request,
  params,
  parent,
}) {
  const { tenant_slug } = params;

  const { user } = await parent();

  if (!user) redirect(constants.HTTP_STATUS_SEE_OTHER, '/login');

  const dbResult = (await locals.db
    // @ts-expect-error Drizzle with SQLite or D1 does not like partial select
    .select({
      organization: organizationsTable,
      member: members,
      memberCount: locals.db.$count(
        members,
        eq(members.organizationId, organizationsTable.id)
      ),
    })
    .from(organizationsTable)
    .innerJoin(members, eq(members.organizationId, organizationsTable.id))
    .where(eq(members.userId, user.id))) as unknown as {
    organization: SelectOrganization;
    member: { role: string };
    memberCount: number;
  }[];

  const organizations: Array<OrganizationListItem> = dbResult.map(r => {
    return {
      ...r.organization,
      isAdmin: r.member.role.includes('admin'),
      isOwner: r.member.role.includes('owner'),
      memberCount: r.memberCount,
    };
  });

  const hasOrgAdminRole = organizations.some(o => o.isAdmin || o.isOwner);

  let tenant;
  let currentOrg: OrganizationListItem | undefined = {};

  if (tenant_slug) {
    // const tenant = await getTenantBySlug(locals.db, tenant_slug);
    tenant = await locals.auth.getFullOrganization({
      headers: request.headers,
      query: { organizationSlug: tenant_slug },
    });
    currentOrg = organizations.find(org => org.slug === tenant_slug);
    if (!(currentOrg && tenant)) throw new Error('could not find organization');
  } else if (organizations.length > 0) {
    tenant = await locals.auth.getFullOrganization({
      headers: request.headers,
      query: { organizationId: organizations[0].id },
    });
  }

  console.log('currentorg', currentOrg);
  console.log('tenat', tenant);

  await locals.auth.setActiveOrganization({
    headers: request.headers,
    body: {
      organizationId: tenant.id,
    },
  });

  // Cache these results in Cloudflare KV grouping by org/tenant id
  const pendingRequests = await locals.db.$count(
    requestsTable,
    eq(requestsTable.status, 'pending')
  );
  const pendingInvites = await locals.db.$count(
    invitations,
    eq(invitations.status, 'pending')
  );
  const currentMemberCount = await locals.db.$count(
    members,
    eq(members.organizationId, tenant.id)
  );

  return {
    pendingRequests,
    pendingInvites,
    currentMemberCount,
    tenant: { ...currentOrg, ...tenant },
    hasOrgAdminRole,
    organizations,
  };
};

// return {
//     hasOrgAdminRole,
//     organizations,
//   };
// const data = await parent();

// const session = await locals.auth.getSession({
//   headers: request.headers,
// });

//
// return {
//   ...data,
// };
// }

// TODO: Make User Profile page
// TODO: Move admin -> dashboard (replace (dashboard))
