import { formElements } from '$lib';
import { z } from 'zod/v4';

export const saveFieldSchema = z.object({
  fieldId: z.guid(),
  label: z.string().min(1),
  placeholder: z.string().optional(),
  isRequired: z.stringbool().optional(),
  options: z.array(z.string()).optional(),
  type: z.enum(formElements),
});

export type SaveFieldSchema = typeof saveFieldSchema;

export const formSchema = z.object({
  username: z.string().min(2).max(50),
});

export type FormSchema = typeof formSchema;
