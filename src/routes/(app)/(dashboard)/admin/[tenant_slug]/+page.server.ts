import { getFormFields, getFormsByTenant, getResponsesByFormId } from '$lib/server/db';
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

  const formIds = (await forms).map(form => form.id);

  const responsesPromises = formIds.map(async (formId) => {
    const responses = await getResponsesByFormId(locals.db, formId);
    return {
      formId,
      responses
    };
  });

  const responseData = await Promise.all(responsesPromises);

  const responsesByFormId = responseData.reduce((acc, { formId, responses }) => {
    acc[formId] = responses;
    return acc;
  }, {});

  return {
    forms,
    responsesByFormId,
    tenant,
    user,
    isSiteAdmin: user.role === 'admin',
    addForm: await superValidate(zod4(addFormSchema)),
  };
};
