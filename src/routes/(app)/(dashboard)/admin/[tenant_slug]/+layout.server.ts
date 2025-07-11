import { constants } from 'node:http2';
import { redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import {
  invitations,
  members,
  requests as requestsTable,
} from '$lib/server/db/schema';

export const load = async function ({ locals, parent }) {
  const { tenant, user } = await parent();

  if (!user) redirect(constants.HTTP_STATUS_SEE_OTHER, '/login');
  if (!tenant) redirect(constants.HTTP_STATUS_SEE_OTHER, '/admin');

  // And cache this?
  const [currentMember] = await locals.db
    .select()
    .from(members)
    .where(
      and(eq(members.organizationId, tenant.id), eq(members.userId, user.id))
    );

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
    isOrgAdmin: currentMember.role === 'admin',
    isOrgOwner: currentMember.role === 'owner',
  };
};
