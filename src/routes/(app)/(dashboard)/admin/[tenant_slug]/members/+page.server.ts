import { type OrganizationMember, organizations } from '$lib/server/db/schema';
import { withSuperForm, withZodFormData } from '$lib/utils/server';
import { sendInviteSchema } from '$lib/validation-schema';
import { constants } from 'node:http2';
import { type Actions, fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod/v4';
import type { PageServerLoad } from './$types';

const ADMIN_ROLE = 'admin';

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

export const load: PageServerLoad = async function ({ parent }) {
  const {
    tenant: { members, invitations, ...tenant },
    user,
  } = await parent();

  if (!user) redirect(constants.HTTP_STATUS_SEE_OTHER, '/auth/login');

  return {
    members: members.map(flattenMembers),
    invitations,
    tenant,
    user,
    isAdmin: user.role === ADMIN_ROLE,
    sendInviteForm: await superValidate(zod4(sendInviteSchema)),
  };
};

const cancelInviteSchema = z.object({
  inviteId: z.string().length(32),
});

const resendInviteSchema = z.object({
  inviteId: z.string().length(32),
  email: z.email(),
  role: z.enum(['admin', 'owner', 'member']).default('member'),
});

export const actions: Actions = {
  'cancel-invite': withZodFormData(
    cancelInviteSchema,
    async ({ locals, request }, formData) => {
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
  'resend-invite': withZodFormData(
    resendInviteSchema,
    async ({ locals, request, params }, { inviteId, email, role }) => {
      const [{ id: organizationId }] = await locals.db
        .select()
        .from(organizations)
        .where(eq(organizations.slug, params.tenant_slug ?? ''));

      const invite = await locals.auth.getInvitation({
        headers: request.headers,
        query: {
          id: inviteId,
        },
      });

      if (!invite) fail(404, { success: false, message: 'invite not found' });

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
  'send-invite': withSuperForm(
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
    }
  ),
};
