import { forms } from '$lib/server/db/schema';
import { type Actions, error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function ({ params, locals }) {
  if (!params.id) return error(400, { message: 'id is required' });

  const survey = await locals.db.query.forms.findFirst({
    where: eq(forms.id, params.id),
    with: {
      fields: true,
    },
  });

  if (!survey) return error(404, { message: 'survey not found' });

  return {
    id: params.id,
    survey,
  };
};

export const actions = {
  default: async function ({ params, locals, request }) {
    const formData = await request.formData();
    console.log(params, locals);

    const values = formData.entries().toArray();

    console.log(values);

    return { sucess: true };
  },
} satisfies Actions;
