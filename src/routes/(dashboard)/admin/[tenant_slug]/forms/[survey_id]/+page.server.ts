import { getFormById, getFormFields } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function ({
  params,
  locals,
  parent,
}) {
  if (!params.survey_id) throw new Error('id is required');

  const { session } = await parent();

  const survey = await getFormById(locals.db, params.survey_id);

  if (!survey) throw new Error('survey not found');

  const fields = await getFormFields(locals.db, params.survey_id);

  return {
    session,
    survey,
    fields,
    id: params.survey_id,
  };
};
