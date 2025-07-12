import { getFormsByTenant } from '$lib/server/db';
import { addFormSchema } from '$lib/validation-schema';
import { constants } from 'node:http2';
import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

export const load = async function ({ locals, parent }) {
  const { tenant, user } = await parent();
  if (!user) redirect(constants.HTTP_STATUS_SEE_OTHER, '/login');

  if (!tenant) redirect(constants.HTTP_STATUS_SEE_OTHER, '/admin');

  const forms = getFormsByTenant(locals.db, tenant.id);

  return {
    forms,
    tenant,
    user,
    isSiteAdmin: user.role === 'admin',
    addForm: await superValidate(zod4(addFormSchema)),
  };
};
