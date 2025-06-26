import { members } from '$lib/server/db/schema';
import { constants } from 'node:http2';
import { redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';

export const load = async function ({ locals, parent }) {
  const { tenant, user } = await parent();

  if (!user) redirect(constants.HTTP_STATUS_SEE_OTHER, '/login');
  if (!tenant) redirect(constants.HTTP_STATUS_SEE_OTHER, '/admin');

  const [currentMember] = await locals.db
    .select()
    .from(members)
    .where(
      and(eq(members.organizationId, tenant.id), eq(members.userId, user.id))
    );

  return {
    isOrgAdmin: currentMember.role === 'admin',
    isOrgOwner: currentMember.role === 'owner',
  };
};
