import {
  type DrizzleClient,
  getFormBySlug,
  getFormFields,
} from '$lib/server/db';
import {
  type InsertFormField,
  type SelectFormField,
  formFieldInsertSchema,
  formFields,
  forms,
} from '$lib/server/db/schema';
import { isHtmlFormField } from '$lib/utils';
import { error, fail } from '@sveltejs/kit';
import { type SQL, and, asc, eq, gte, inArray, sql } from 'drizzle-orm';
import { z } from 'zod/v4';
import type { Actions, PageServerLoad } from './$types';
import { saveFieldSchema } from './schema';

export const load: PageServerLoad = async function ({
  params,
  locals,
  parent,
  depends,
}) {
  if (!params.survey_slug) throw error(400, 'slug is required');

  const { session, tenant } = await parent();

  console.log(tenant);

  if (!tenant) throw error(400, 'tenant not found');

  const survey = await getFormBySlug(locals.db, params.survey_slug);
  if (!survey) throw error(404, 'Survey not found');

  depends('survey-fields:latest');
  const fields = await getFormFields(locals.db, survey.id);

  return {
    session,
    survey,
    fields,
    tenant,
  };
};

export const actions: Actions = {
  'save-field': async ({ request, locals }) => {
    const formData = await request.formData();

    const parsed = saveFieldSchema.parse({
      ...Object.fromEntries(formData.entries()),
      options: JSON.parse(formData.get('options')?.toString() ?? '[]'),
    });

    try {
      const [updatedField] = await locals.db
        .update(formFields)
        .set(parsed)
        .where(eq(formFields.id, parsed.fieldId))
        .returning();

      return {
        success: true,
        field: updatedField,
      };
    } catch (err) {
      console.error('Failed to update field:', err);
      return fail(500, { message: 'Failed to update field' });
    }
  },

  addFormField: async ({ locals, request, params }) => {
    const formData = await request.formData();
    const type = formData.get('type')?.toString();

    if (!(type && isHtmlFormField(type))) {
      return fail(400, { message: 'Invalid field type' });
    }

    if (!params.survey_slug)
      return fail(400, { message: 'No survey slug found' });

    const survey = await getFormBySlug(locals.db, params.survey_slug);
    if (!survey) {
      return fail(404, { message: 'Survey not found' });
    }

    const fieldId = formData.get('id');
    if (!fieldId) return fail(400, { message: 'field id not found' });

    const data: InsertFormField = {
      id: fieldId.toString(),
      formId: survey.id,
      type,
      label: formData.get('label')?.toString() || 'New Field',
      placeholder: formData.get('placeholder')?.toString() || undefined,
      required: formData.get('required') === 'true',
      orderIndex: Number.parseInt(
        formData.get('orderIndex')?.toString() || '999'
      ),
      options: formData.get('options')
        ? JSON.parse(formData.get('options')?.toString() ?? '')
        : null,
    };

    try {
      const parsed = formFieldInsertSchema.parse(data);

      const otherFields = await locals.db
        .select()
        .from(formFields)
        .where(
          and(
            gte(formFields.orderIndex, parsed.orderIndex),
            eq(formFields.formId, survey.id)
          )
        )
        .orderBy(asc(formFields.orderIndex));
      await updateFieldOrders(locals.db, otherFields, parsed.orderIndex + 1);

      const [newField] = await locals.db
        .insert(formFields)
        .values(parsed)
        .returning();

      // Update survey's updatedAt timestamp

      // TODO: Fix ordering of the other fields

      return {
        success: true,
        field: newField,
      };
    } catch (err) {
      console.error('Failed to add field:', err);
      return fail(500, { message: 'Failed to add field' });
    }
  },

  deleteFormField: async ({ locals, request, params }) => {
    const formData = await request.formData();
    const fieldId = formData.get('fieldId')?.toString();

    if (!(fieldId && params.survey_slug)) {
      return fail(400, { message: 'Field ID is required' });
    }

    try {
      const survey = await getFormBySlug(locals.db, params.survey_slug);
      if (!survey) {
        return fail(404, { message: 'Survey not found' });
      }

      // Delete the field
      await locals.db.delete(formFields).where(eq(formFields.id, fieldId));

      // Reorder remaining fields
      const remainingFields = await getFormFields(locals.db, survey.id);

      if (remainingFields.length > 0) {
        const updates = remainingFields.map((field, index) => ({
          id: field.id,
          orderIndex: index + 1,
        }));

        // Batch update order indices
        await updateFieldOrders(locals.db, updates);
      }

      // Update survey timestamp
      await locals.db
        .update(forms)
        .set({ updatedAt: new Date() })
        .where(eq(forms.id, survey.id));

      return { success: true };
    } catch (err) {
      console.error('Failed to delete field:', err);
      return fail(500, { message: 'Failed to delete field' });
    }
  },

  reorder: async ({ locals, request }) => {
    const formData = await request.formData();
    const formId = formData.get('formId')?.toString();
    const sortedData = formData.get('sortedData')?.toString();

    if (!(formId && sortedData)) {
      return fail(400, { message: 'Form ID and sorted data are required' });
    }

    try {
      const updates: Array<{ id: string; orderIndex: number }> =
        JSON.parse(sortedData);

      // Batch update order indices
      await updateFieldOrders(locals.db, updates);

      // Update survey timestamp
      await locals.db
        .update(forms)
        .set({ updatedAt: new Date() })
        .where(eq(forms.id, formId));

      return { success: true };
    } catch (err) {
      console.error('Failed to reorder fields:', err);
      return fail(500, { message: 'Failed to reorder fields' });
    }
  },
};

// Helper function to batch update field orders
async function updateFieldOrders(
  db: DrizzleClient,
  updates: Array<{ id: string; orderIndex: number }>,
  startIndex = 1
) {
  if (updates.length === 0) return;

  const sqlChunks: SQL[] = [sql`(case`];
  const ids: string[] = [];

  let i = startIndex;
  for (const { id } of updates) {
    sqlChunks.push(sql`when ${formFields.id} = ${id} then ${i}`);
    ids.push(id);
    i++;
  }

  sqlChunks.push(sql`end)`);
  const finalSql = sql.join(sqlChunks, sql.raw(' '));

  await db
    .update(formFields)
    .set({
      orderIndex: finalSql,
      updatedAt: new Date(),
    })
    .where(inArray(formFields.id, ids));
}
