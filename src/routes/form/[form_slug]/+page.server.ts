import {
  formFields,
  forms,
  type NewSubmissionData,
  type SelectForm,
  type SelectFormField,
  type SelectFormFieldWithHash,
  type SelectFormWithFields,
  type SubmissionData,
  submissionFormFields,
  submissions,
} from '$lib/server/db/schema';
import { genSlug } from '$lib/utils';
import crypto from 'node:crypto';
import { constants } from 'node:http2';
import * as Sentry from '@sentry/sveltekit';
import { type Actions, error, fail, type ServerLoadEvent } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import type { PageServerLoad } from './$types';
import { generateId } from 'better-auth';

type SubmittedFields =
  | {
      type: Exclude<SelectFormField['type'], 'checkbox' | 'yes-no'>;
      fieldId: string;
      primitive: 'string' | 'number' | 'date';
      value: string | number | Date;
    }
  | {
      type: Extract<SelectFormField['type'], 'yes-no'>;
      fieldId: string;
      primitive: 'boolean';
      value: boolean;
    }
  | {
      type: Extract<SelectFormField['type'], 'checkbox'>;
      fieldId: string;
      primitive: 'string';
      values: string[];
    };

class NotFoundError extends Error {}

interface FormWithFields {
  [key: string]: SelectForm & { fields: SelectFormFieldWithHash[] };
  length: number;
}

async function getFormWithFields(
  db: ServerLoadEvent['locals']['db'],
  slug: string
): Promise<[string, FormWithFields]> {
  const survey = await db.query.forms.findFirst({
    where: eq(forms.slug, slug),
    with: {
      fields: {
        orderBy: (formFields, { asc }) => [asc(formFields.orderIndex)],
      },
    },
  });

  const survey2result = await db
    .select()
    .from(forms)
    .where(eq(forms.slug, slug))
    .leftJoin(formFields, eq(forms.id, formFields.formId))
    .orderBy(asc(formFields.orderIndex))
    .all();

  // const fields: SelectFormFieldWithHash[] = survey.fields.map(f => ({
  //   ...f,
  //   hash: hashSlug(genSlug(f)),
  // }));

  const survey2: FormWithFields = survey2result.reduce<FormWithFields>(
    (acc, row) => {
      const form = row.forms;
      const field = row.form_fields;

      if (!acc[form.id]) {
        acc[form.id] = {
          ...form,
          fields: [] as SelectFormFieldWithHash[],
        };
        acc.length += 1;
      }

      if (field) {
        acc[form.id].fields.push({ ...field, hash: hashSlug(genSlug(field)) });
      }

      return acc;
    },
    { length: 0 }
  );

  console.log(survey2);

  if (!survey || survey2.length > 1)
    throw new NotFoundError('survey not found');

  return [survey2result[0].forms.id, survey2];
}

// Prepare survey fields and identify required ones
function prepareFields(fields: SelectFormField[]) {
  const requiredFields = new Set<string>();

  const processedFields = fields.map(({ id, ...fieldData }) => {
    const hash = hashSlug(genSlug({ id, ...fieldData }));
    const field = { ...fieldData, hash, id };

    if (field.required) {
      const key = `${field.label.toLowerCase().replaceAll(' ', '-')}-${hash}`;
      requiredFields.add(key);
    }

    return field;
  });

  return { requiredFields, processedFields };
}

// Process all form data entries
function processFormData(
  formData: FormData,
  fields: Array<SelectFormField & { hash: string }>
) {
  const submittedFields = new Map<string, SubmittedFields>();

  for (const [key, value] of formData.entries()) {
    if (!value) continue;

    const hash = key.substring(key.lastIndexOf('-') + 1);
    const field = fields.find(f => f.hash === hash);

    if (!field) {
      console.error('Field not found for key:', key);
      continue;
    }

    processField(submittedFields, key, value, field);
  }

  return submittedFields;
}

// Process an individual field based on its type
function processField(
  submittedFields: Map<string, SubmittedFields>,
  key: string,
  value: FormDataEntryValue,
  field: SelectFormField & { hash: string }
) {
  const current = submittedFields.get(key);
  // Handle checkbox fields with multiple values
  if (current && !(value instanceof File) && current.type === 'checkbox') {
    // const current = submittedFields.get(key);
    submittedFields.set(key, {
      type: 'checkbox',
      fieldId: current.fieldId,
      primitive: 'string',
      values: [...current.values, value.toString()],
    });
    return;
  }

  // Process based on field type
  if (field.type === 'checkbox') {
    submittedFields.set(key, {
      type: 'checkbox',
      primitive: 'string',
      fieldId: field.id,
      values: [value.toString()],
    });
  } else if (field.type === 'yes-no') {
    submittedFields.set(key, {
      type: 'yes-no',
      primitive: 'boolean',
      fieldId: field.id,
      value: value.toString() === 'on' || value.toString() === 'checked',
    });
  } else {
    // Handle standard fields with appropriate type conversion
    const { primitive, processedValue } = convertFieldValue(field, value);
    submittedFields.set(key, {
      type: field.type,
      primitive,
      fieldId: field.id,
      value: processedValue,
    });
  }
}

// Convert field values to appropriate types
function convertFieldValue(
  field: SelectFormFieldWithHash,
  value: FormDataEntryValue
) {
  let primitive: SubmittedFields['primitive'] = 'string';
  let processedValue: string | number | Date = value.toString();

  if (field.type === 'number' || field.type === 'range') {
    primitive = 'number';
    processedValue = Number(processedValue);
  } else if (field.type === 'date') {
    primitive = 'date';
    processedValue = new Date(processedValue);
  }

  return { primitive, processedValue };
}

export const load: PageServerLoad = async function ({ params, locals }) {
  if (!params.form_slug) return error(400, { message: 'slug is required' });

  try {
    const [id, formWithFields] = await getFormWithFields(
      locals.db,
      params.form_slug
    );

    const { fields, ...survey } = formWithFields[id];

    // const fields: SelectFormFieldWithHash[] = survey.fields.map(f => ({
    //   ...f,
    //   hash: hashSlug(genSlug(f)),
    // }));

    return {
      survey,
      fields,
    };
  } catch (e) {
    console.error(e);
    Sentry.captureException(e);
    if (e instanceof Error) {
      return error(constants.HTTP_STATUS_NOT_FOUND, {
        message: 'survey not found',
      });
    }
    return error(500, 'There was an internal error');
  }
};

export const actions = {
  default: async function handleSurveySubmission({
    params,
    locals,
    request,
    getClientAddress,
  }) {
    try {
      if (!params.form_slug)
        return fail(400, {
          success: false,
          status: 400,
          message: 'survey slug is required',
        });

      const formData = await request.formData();
      const [id, formsWithFields] = await getFormWithFields(
        locals.db,
        params.form_slug
      );

      // Process survey fields and identify required ones
      const { requiredFields, processedFields } = prepareFields(
        formsWithFields[id].fields
      );

      // Process submitted form data
      const submittedFields = processFormData(formData, processedFields);

      // Check for missing required fields
      const missingFields = Array.from(requiredFields).filter(
        field => !submittedFields.has(field)
      );
      console.log('missing', missingFields);

      if (missingFields.length > 0) {
        return fail(400, {
          success: false,
          status: 400,
          message: 'missing required fields',
          fields: missingFields,
        });
      }

      const data: NewSubmissionData[] = [];

      for (const [k, v] of submittedFields) {
        console.log(k, v);
        if (v.type === 'checkbox') {
          data.push({
            field: {
              id: v.fieldId,
              type: v.type,
              primitive: v.primitive,
            },
            submitted: {
              values: v.values,
            },
          });
        } else {
          data.push({
            field: {
              id: v.fieldId,
              type: v.type,
              primitive: v.primitive,
            },
            submitted: {
              value:
                v.value instanceof Date
                  ? v.value.getTime().toString()
                  : v.value,
            },
          });
        }
      }

      console.log(
        hashSubmission(getClientAddress()),
        hashSubmission(getClientUserAgent(request.headers))
      );

      const submissionId = generateId();

      await locals.db.insert(submissions).values({
      id: submissionId,
      formId: id,
      ipHash: hashSubmission(getClientAddress()),
      userAgentHash: hashSubmission(getClientUserAgent(request.headers)),
      createdAt: new Date(Date.now()),
    });

    // Then, create individual submission form field records
    const submissionFormFieldsData = data.map(item => ({
      submissionId: submissionId,
      fieldId: item.field.id,
      data: 'submitted' in item && 'values' in item.submitted 
        ? item.submitted.values 
        : 'submitted' in item && 'value' in item.submitted
        ? item.submitted.value
        : null,
      createdAt: new Date(Date.now()),
      updatedAt: new Date(Date.now()),
    }));

    await locals.db.insert(submissionFormFields).values(submissionFormFieldsData);

      return { success: true };
    } catch (e) {
      console.error(e);

      if (e instanceof NotFoundError)
        return fail(constants.HTTP_STATUS_NOT_FOUND, {
          success: false,
          status: constants.HTTP_STATUS_NOT_FOUND,
          message: e.message,
        });

      if (e instanceof Error)
        return fail(500, { success: false, status: 500, message: e.message });

      return fail(500, {
        success: false,
        status: 500,
        message: 'There was an internal error',
      });
    }
  },
} satisfies Actions;

function getClientUserAgent(headers: Request['headers']) {
  const userAgent = headers.get('user-agent');
  if (!userAgent) return 'userAgent not found';
  return userAgent;
}

function hashSlug(slug: string) {
  const hash = crypto.createHash('sha256').update(slug).digest('base64');
  return hash.substring(0, 8);
}

function hashSubmission(text: string) {
  return crypto.createHash('sha256').update(text).digest('base64');
}
