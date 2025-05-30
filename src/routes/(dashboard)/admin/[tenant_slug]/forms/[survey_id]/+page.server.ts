import { getFormById, getFormFields } from '$lib/server/db';
import {
  type InsertFormField,
  type SelectFormField,
  formFieldInsertSchema,
  formFields,
  forms,
} from '$lib/server/db/schema';
import { isHtmlFormField } from '$lib/utils';
import { fail } from '@sveltejs/kit';
import { type SQL, eq, inArray, sql } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async function ({
  params,
  locals,
  parent,
  depends,
}) {
  depends('survey-fields:latest');
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

    const formDataEntries = Object.fromEntries(form.entries());

    const type = formDataEntries.type.toString();
    if (!isHtmlFormField(type))
      return fail(400, { error: true, message: 'not a form field' });

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

    const result = await locals.db
      .insert(formFields)
      .values(parsed)
      .returning();

    console.table(result);

    return result[0];
  },
  deleteFormField: async ({ locals, request }) => {
    const formData = await request.formData();
    const fieldId = formData.get('fieldId');

    if (!fieldId)
      return fail(404, { error: true, message: 'field id is required' });

    const deletedIds = await locals.db
      .delete(formFields)
      .where(eq(formFields.id, fieldId.toString()))
      .returning({ id: formFields.id });

    return { success: true, id: deletedIds[0].id };
  },
  reorder: async ({ locals, request }) => {
    try {
      const formData = await request.formData();

      const data = Object.fromEntries(formData.entries());

      if (!(data.formId && data.sortedData)) {
        return fail(400, {
          error: true,
          message: 'formId and sorted data is required',
        });
      }

      if (
        !(
          data.sortedData instanceof Blob &&
          data.sortedData.type === 'application/json'
        )
      ) {
        return fail(400, {
          error: true,
          message: 'sorted data must be valid json',
        });
      }

      const sortedData: SelectFormField[] = JSON.parse(
        await data.sortedData.text()
      );

      const formId = data.formId.toString();

      const survey = await locals.db
        .update(forms)
        .set({ updatedAt: new Date(Date.now()) })
        .where(eq(forms.id, formId))
        .returning({ updatedAt: forms.updatedAt });

      if (!survey || survey.length === 0)
        return fail(500, { error: true, message: 'survey not found' });

      const sqlChunks: SQL[] = [];
      const ids: string[] = [];
      const timeSqlChunks: SQL[] = [];

      sqlChunks.push(sql`(case`);
      timeSqlChunks.push(sql`(case`);

      for (const input of sortedData) {
        console.table({ id: input.id, type: input.type, oi: input.orderIndex });
        sqlChunks.push(
          sql`when ${formFields.id} = ${input.id} then ${input.orderIndex}`
        );
        timeSqlChunks.push(
          sql`when ${formFields.id} = ${input.id} then ${Date.now()}`
        );
        ids.push(input.id);
      }

      sqlChunks.push(sql`end)`);
      timeSqlChunks.push(sql`end)`);

      const finalSql: SQL = sql.join(sqlChunks, sql.raw(' '));
      const finalTimeSql: SQL = sql.join(timeSqlChunks, sql.raw(' '));

      await locals.db
        .update(formFields)
        .set({ orderIndex: finalSql, updatedAt: finalTimeSql })
        .where(inArray(formFields.id, ids));

      return {
        lastUpdated: survey[0].updatedAt,
      };
    } catch (e) {
      console.error(e);
      if (e instanceof Error)
        return fail(500, { error: true, message: e.message });

      return fail(500, { error: true, message: 'there was an internal error' });
    }
  },
} satisfies Actions;
