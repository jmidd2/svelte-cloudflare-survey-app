import { getFormFields, getFormsByTenant, getRequestByOrg, getRequestByUser, getResponsesByFormId } from '$lib/server/db';
import { addFormSchema } from '$lib/validation-schema';
import { constants } from 'node:http2';
import { redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';

export const load = async function ({ locals, parent }) {
  const { tenant, user } = await parent();
  if (!user) redirect(constants.HTTP_STATUS_SEE_OTHER, '/login');

  if (!tenant) redirect(constants.HTTP_STATUS_SEE_OTHER, '/admin');

  const forms = await getFormsByTenant(locals.db, tenant.id);
  // const requests = await getRequestByUser(locals.db, user.id);
  const requests = await getRequestByOrg(locals.db, tenant.id);

  

  return {
    forms,
    // responsesByFormId,
    tenant,
    user,
    requests,
    isSiteAdmin: user.role === 'admin',
    addForm: await superValidate(zod4(addFormSchema)),
  };
};
