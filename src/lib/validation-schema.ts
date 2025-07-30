import {FORM_FIELD_TYPES} from '$lib/types.d';
import {z} from "zod/v4";

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
export type CreateFormSchema = typeof addFormSchema;

export const sendInviteSchema = z.object({
  email: z.email(),
  role: z.enum(['owner', 'admin', 'member']).default('member'),
});

export const cancelInviteSchema = z.object({
  inviteId: z.string().length(32),
});

export const resendInviteSchema = z.object({
  inviteId: z.string().length(32),
  email: z.email(),
  role: z.enum(['admin', 'owner', 'member']).default('member'),
});

export const requestToJoinSchema = z.object({
  requestId: z.string().length(32),
});

export const addFormSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(3),
});
export const createOrganizationSchema = z.object({
    name: z.string().min(2).max(255),
    slug: z.string().min(2).max(255),
    description: z.string().max(255),
    website: z.string().max(255).optional(),
    email: z.email().max(255).optional(),
    phone: z.string().max(255).optional(),
    address: z.string().max(255).optional(),
})

export const profileSchema = z.object({
  name: z.string().nonempty().max(255),
});

export const requestJoinSchema = z.object({
  organizationId: z.string().min(32).max(36),
});