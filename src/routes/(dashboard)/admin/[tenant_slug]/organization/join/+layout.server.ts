import { constants } from 'node:http2';
import { redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { getFormsByTenant, getResponsesByFormId } from '$lib/server/db';
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
  const forms = await getFormsByTenant(locals.db, tenant.id);
    //TODO: make the formIds map and the responsesPromises a db join to reduce workload on client
  const formIds = forms.map(form => form.id);

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
    isOrgAdmin: currentMember.role === 'admin',
    isOrgOwner: currentMember.role === 'owner',
    responses: responsesByFormId,
  };
};
