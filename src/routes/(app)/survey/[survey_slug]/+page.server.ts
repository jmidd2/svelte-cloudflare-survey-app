import crypto from 'node:crypto';
import {
  type NewSubmissionData,
  type SelectFormField,
  type SelectFormFieldWithHash,
  type SelectFormWithFields,
  type SubmissionData,
  formFields,
  forms,
  submissions,
} from '$lib/server/db/schema';
import { genSlug } from '$lib/utils';
import * as Sentry from '@sentry/sveltekit';
import { type Actions, type ServerLoadEvent, error, fail } from '@sveltejs/kit';
import { asc, eq } from 'drizzle-orm';
import { v4 as uuid } from 'uuid';
import type { PageServerLoad } from './$types';

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

async function getFormWithFields(
  db: ServerLoadEvent['locals']['db'],
  slug: string
) {
  const survey: SelectFormWithFields | undefined =
    await db.query.forms.findFirst({
      where: eq(forms.slug, slug),
      with: {
        fields: {
          orderBy: asc(formFields.orderIndex),
        },
      },
    });

  if (!survey) throw new NotFoundError('survey not found');

  return survey;
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
  if (!params.survey_slug) return error(400, { message: 'slug is required' });

  try {
    const survey = await getFormWithFields(locals.db, params.survey_slug);

    const fields: SelectFormFieldWithHash[] = survey.fields.map(
      ({ id, ...f }) => ({
        ...f,
        hash: hashSlug(genSlug({ id, ...f })),
      })
    );

    return {
      survey: {
        ...survey,
        fields,
      },
    };
  } catch (e) {
    console.error(e);
    Sentry.captureException(e);
    if (e instanceof Error) {
      return error(404, { message: 'survey not found' });
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
      if (!params.survey_slug)
        return fail(400, {
          success: false,
          status: 400,
          message: 'survey slug is required',
        });

      const formData = await request.formData();
      const survey = await getFormWithFields(locals.db, params.survey_slug);

      // Process survey fields and identify required ones
      const { requiredFields, processedFields } = prepareFields(survey.fields);

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

      await locals.db.insert(submissions).values({
        id: uuid(),
        data,
        formId: survey.id,
        ipHash: hashSubmission(getClientAddress()),
        userAgentHash: hashSubmission(getClientUserAgent(request.headers)),
        createdAt: new Date(Date.now()),
      });

      return { success: true };
    } catch (e) {
      console.error(e);

      if (e instanceof NotFoundError)
        return fail(404, { success: false, status: 404, message: e.message });

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
