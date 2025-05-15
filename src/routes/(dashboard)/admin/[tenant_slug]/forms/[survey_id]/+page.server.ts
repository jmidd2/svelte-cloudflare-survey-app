import { formElements, isHtmlFormField } from '$lib';
import { getFormById, getFormFields } from '$lib/server/db';
import {
  type InsertFormField,
  formFieldInsertSchema,
  formFields,
} from '$lib/server/db/schema';
import { fail, json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import type { Actions, PageServerLoad } from './$types';

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

export const actions = {
  addFormField: async ({ locals, request }) => {
    const form = await request.formData();
    console.log(form);
    const formDataEntries = Object.fromEntries(form.entries());

    const type = formDataEntries.type.toString();
    if (!isHtmlFormField(type))
      return fail(400, { message: 'not a form field' });

    const data: InsertFormField = {
      id: uuid(),
      formId: formDataEntries.formId.toString(),
      type,
      label: formDataEntries.label.toString(),
      orderIndex: Number.parseInt(formDataEntries.orderIndex.toString()),
      placeholder: formDataEntries.placeholder?.toString(),
      required: formDataEntries.required?.toString() === 'true',
    };

    if (
      formDataEntries.options &&
      formDataEntries.options instanceof Blob &&
      formDataEntries.options.type === 'application/json'
    ) {
      data.options = JSON.parse(await formDataEntries.options.text());
    }

    const parsed = formFieldInsertSchema.parse(data);
    console.log(parsed);
    const result = await locals.db
      .insert(formFields)
      .values(parsed)
      .returning();

    return result[0];
  },
  deleteFormField: async ({ locals, request }) => {
    const formData = await request.formData();
    const fieldId = formData.get('fieldId');
    if (!fieldId) fail(404, { message: 'field id is required' });

    await locals.db.delete(formFields).where(eq(formFields.id, fieldId));

    return { success: true };
  },
} satisfies Actions;
