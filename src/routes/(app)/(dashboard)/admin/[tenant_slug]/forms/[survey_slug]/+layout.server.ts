import { getFormBySlug } from '$lib/server/db';
import { error } from '@sveltejs/kit';

export const load = async function ({ locals, params }) {
  if (!params.survey_slug) console.error(400, 'survey id is required');
  const survey = await getFormBySlug(locals.db, params.survey_slug);
  if (!survey) return error(404, 'survey not found');

  return {
    survey,
  };
};
