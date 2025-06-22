import {
  members,
  organizations as organizationsTable,
  type SelectOrganization,
} from '$lib/server/db/schema';
import type { OrganizationListItem } from '$lib/types';
import { constants } from 'node:http2';
import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';

export const load = async function ({ locals, params, request }) {
  const { tenant_slug } = params;

  const session = await locals.auth.getSession({
    headers: request.headers,
  });

  if (session) {
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
      .where(eq(members.userId, session.user.id))) as unknown as {
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

    const isOrgAdmin = organizations.some(o => o.isAdmin || o.isOwner);

    if (tenant_slug) {
      // const tenant = await getTenantBySlug(locals.db, tenant_slug);
      const tenant = await locals.auth.getFullOrganization({
        headers: request.headers,
        query: { organizationSlug: tenant_slug },
      });

      if (!tenant) redirect(constants.HTTP_STATUS_SEE_OTHER, '/login');

      await locals.auth.setActiveOrganization({
        headers: request.headers,
        body: {
          organizationId: tenant.id,
        },
      });

      return {
        tenant,
        isOrgAdmin,
        organizations,
      };
    }

    return {
      isOrgAdmin,
      organizations,
    };
  }
};
