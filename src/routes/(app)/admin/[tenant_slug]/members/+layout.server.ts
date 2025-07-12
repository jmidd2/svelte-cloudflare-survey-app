import { constants } from 'node:http2';
import { type Actions, fail, redirect } from '@sveltejs/kit';
import type { User } from 'better-auth';
import { eq } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import {
  ADMIN_ROLE,
  canInviteMembers,
  canManageMembers,
} from '$lib/server/auth';
import {
  invitations,
  type OrganizationMember,
  organizations,
  requests as requestsTable,
  type SelectRequest,
  users,
} from '$lib/server/db/schema';
import {
  requireActionPermission,
  withSuperForm,
  withZodFormData,
} from '$lib/server/utils/';
import {
  cancelInviteSchema,
  requestToJoinSchema,
  resendInviteSchema,
  sendInviteSchema,
} from '$lib/validation-schema';
import type { PageServerLoad } from './$types';

// TODO: Resend Invites
// TODO: At a minimum edit user's role and remove from organization
const flattenMembers = (member: OrganizationMember) => {
  const {
    id,
    organizationId,
    role,
    userId,
    user: { image, name, email },
    createdAt,
  } = member;
  return { createdAt, email, id, image, name, organizationId, role, userId };
};

export const load: PageServerLoad = async function ({
  locals,
  parent,
  request,
}) {
  const {
    tenant: { members, invitations, ...tenant },
    user,
  } = await parent();

  if (!user) redirect(constants.HTTP_STATUS_SEE_OTHER, '/login');

  // Check if the user can manage members of this organization
  const hasManagePermission = await canManageMembers(
    locals.auth,
    request.headers
  );

  const hasInvitePermission = await canInviteMembers(
    locals.auth,
    request.headers
  );

  // TODO: Filter requests based on a timeline, might need to add a createdAt column
  const requestsResult = await locals.db
    .select()
    .from(requestsTable)
    .innerJoin(users, eq(users.id, requestsTable.userId))
    .where(eq(requestsTable.organizationId, tenant.id));

  const requests =
    requestsResult.length > 0
      ? requestsResult.map<SelectRequest & { user: User }>(row => {
          const { users, requests } = row;

          return {
            ...requests,
            user: users,
          };
        })
      : [];

  return {
    members: members.map(flattenMembers),
    invitations,
    requests,
    tenant,
    user,
    isSiteAdmin: user.role === ADMIN_ROLE,
    canManageMembers: hasManagePermission,
    canManageInvites: hasInvitePermission,
    sendInviteForm: await superValidate(zod4(sendInviteSchema)),
  };
};
