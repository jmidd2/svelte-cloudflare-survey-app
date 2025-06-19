import type { OrganizationMember } from '$lib/server/db/schema';
import { withSuperForm } from '$lib/utils/server';
import { sendInviteSchema } from '$lib/validation-schema';
import { constants } from 'node:http2';
import { type Actions, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
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
    session,
  } = await parent();

  if (!session) redirect(constants.HTTP_STATUS_SEE_OTHER, '/auth/login');

  return {
    members: members.map(flattenMembers),
    invitations,
    tenant,
    session,
    isAdmin: session.user.role === ADMIN_ROLE,
    sendInviteForm: await superValidate(zod4(sendInviteSchema)),
  };
};

export const actions: Actions = {
  'send-invite': withSuperForm(
    { schema: sendInviteSchema },
    async ({ locals, url }, form) => {
      const { email, role } = form.data;
      console.log(email, role);
    }
  ),
};
