import { FORM_FIELD_TYPES } from '$lib/types.d';
import { z } from 'zod/v4';

export const saveFieldSchema = z.object({
  fieldId: z.uuidv4(),
  type: z.enum(FORM_FIELD_TYPES),
  label: z.string().min(2).max(50),
  placeholder: z.string().max(50).optional(),
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

export const editFormSchema = z.object({
  formId: z.uuidv4(),
  title: z.string().min(2).max(50),
  description: z.string().min(2).max(255),
});

export type EditFormSchema = typeof editFormSchema;

export const sendInviteSchema = z.object({
  email: z.string().nonempty(),
  role: z.enum(['owner', 'admin', 'member']).default('member'),
});
