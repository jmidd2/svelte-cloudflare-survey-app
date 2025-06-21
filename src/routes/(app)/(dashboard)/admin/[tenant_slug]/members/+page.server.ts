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
import { constants } from 'node:http2';
import { type Actions, fail, redirect } from '@sveltejs/kit';
import type { User } from 'better-auth';
import { eq } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';

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

  if (!user) redirect(constants.HTTP_STATUS_SEE_OTHER, '/auth/login');

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

export const actions: Actions = {
  'cancel-invite': withZodFormData(
    cancelInviteSchema,
    async ({ locals, request }, formData) => {
      const session = await locals.auth.getSession({
        headers: request.headers,
      });
      if (!session) return fail(401, { message: 'Unauthorized' });

      // Check permissions
      const hasPermission = await canManageMembers(
        locals.auth,
        request.headers
      );

      if (!hasPermission) {
        return fail(403, { message: 'Insufficient permissions' });
      }

      await locals.auth.cancelInvitation({
        headers: request.headers,
        body: {
          invitationId: formData.inviteId,
        },
      });
    }
  ),
  'reject-invite': withZodFormData(
    cancelInviteSchema,
    async ({ locals, request }, formData) => {
      //reject invitation (needs to be called when the user who received the invitation is logged in)
      await locals.auth.rejectInvitation({
        headers: request.headers,
        body: {
          invitationId: formData.inviteId,
        },
      });
    }
  ),
  'remove-invite': withZodFormData(
    cancelInviteSchema,
    async ({ locals, request }, formData) => {
      const session = await locals.auth.getSession({
        headers: request.headers,
      });
      if (!session) return fail(401, { message: 'Unauthorized' });

      // Check permissions
      const hasPermission = await canManageMembers(
        locals.auth,
        request.headers
      );

      if (!hasPermission) {
        return fail(403, { message: 'Insufficient permissions' });
      }

      await locals.db
        .delete(invitations)
        .where(eq(invitations.id, formData.inviteId));
    }
  ),
  'resend-invite': withZodFormData(
    resendInviteSchema,
    async ({ locals, request, params }, { inviteId, email, role }) => {
      const session = await locals.auth.getSession({
        headers: request.headers,
      });
      if (!session) return fail(401, { message: 'Unauthorized' });

      const [{ id: organizationId }] = await locals.db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, params.tenant_slug ?? ''));

      // Check permissions
      const hasPermission = await canManageMembers(
        locals.auth,
        request.headers
      );

      if (!hasPermission) {
        return fail(403, { message: 'Insufficient permissions' });
      }

      const invite = await locals.auth.getInvitation({
        headers: request.headers,
        query: {
          id: inviteId,
        },
      });

      if (!invite)
        return fail(404, { success: false, message: 'invite not found' });

      await locals.auth.createInvitation({
        headers: request.headers,
        body: {
          email,
          role,
          organizationId,
        },
      });

      return { success: true, message: 'invite resent' };
    }
  ),
  'send-invite': requireActionPermission(
    canInviteMembers,
    withSuperForm(
      { schema: sendInviteSchema },
      async ({ locals, request, params }, form) => {
        const { email, role } = form.data;

        const [{ id: organizationId }] = await locals.db
          .select()
          .from(organizations)
          .where(eq(organizations.slug, params.tenant_slug ?? ''));

        await locals.auth.createInvitation({
          headers: request.headers,
          body: {
            email,
            role,
            organizationId,
          },
        });

        return message(form, { status: 'success', text: 'Invite Sent!' });
      }
    )
  ),
  'accept-request': withZodFormData(
    requestToJoinSchema,
    async ({ locals, request }, formData) => {
      const session = await locals.auth.getSession({
        headers: request.headers,
      });
      if (!session) return fail(401, { message: 'Unauthorized' });

      // Check permissions
      const hasPermission = await canManageMembers(
        locals.auth,
        request.headers
      );

      if (!hasPermission) {
        return fail(403, { message: 'Insufficient permissions' });
      }

      const requestToJoin = await locals.db
        .update(requestsTable)
        .set({ status: 'accepted' })
        .where(eq(requestsTable.id, formData.requestId))
        .returning();

      const requestToJoinResult = requestToJoin[0];
      const { userId, organizationId: reqOrgId } = requestToJoinResult;

      await locals.auth.addMember({
        headers: request.headers,
        body: {
          userId,
          organizationId: reqOrgId,
          role: 'member',
        },
      });

      // TODO: Send notification to user
    }
  ),
  'reject-request': withZodFormData(
    requestToJoinSchema,
    async ({ locals, request }, formData) => {
      const session = await locals.auth.getSession({
        headers: request.headers,
      });
      if (!session) return fail(401, { message: 'Unauthorized' });

      // Check permissions
      const hasPermission = await canManageMembers(
        locals.auth,
        request.headers
      );

      if (!hasPermission) {
        return fail(403, { message: 'Insufficient permissions' });
      }

      await locals.db
        .update(requestsTable)
        .set({ status: 'rejected' })
        .where(eq(requestsTable.id, formData.requestId))
        .returning();

      // TODO: Send notification to user
    }
  ),
};
