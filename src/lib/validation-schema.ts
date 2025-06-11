import { FORM_FIELD_TYPES } from '$lib/types.d';
import { z } from 'zod/v4';

export const saveFieldSchema = z.object({
  fieldId: z.uuidv4(),
  type: z.enum(FORM_FIELD_TYPES),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.stringbool().optional(),
  options: z
    .array(z.object({ id: z.uuidv4(), val: z.string(), label: z.string() }))
    .optional()
    .nullable(),
});

export type SaveFieldSchema = typeof saveFieldSchema;

export const formSchema = z.object({
  username: z.string().min(2).max(50),
});

export type FormSchema = typeof formSchema;
