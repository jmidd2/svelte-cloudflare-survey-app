import { getFormBySlug, getFormFields, getResponsesByFormId, getSubmissionData, getSubmissionMetrics } from '$lib/server/db';
import { constants } from 'node:http2';
import { error } from '@sveltejs/kit';

export const load = async function ({ locals, params }) {
  if (!params.survey_slug) console.error(400, 'survey id is required');
  const survey = await getFormBySlug(locals.db, params.survey_slug);
  if (!survey)
    return error(constants.HTTP_STATUS_NOT_FOUND, 'survey not found');

  const responses = await getSubmissionData(locals.db, survey.id);
  const metrics = await getSubmissionMetrics(locals.db, survey.id);
  const fields = await getFormFields(locals.db, survey.id)

  return {
    survey,
    responses,
    metrics,
    fields,
  };
};
