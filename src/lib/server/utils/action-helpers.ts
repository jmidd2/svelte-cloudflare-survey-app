// Wrapper function for actions that need sanitized form data

import type { AuthApi } from '$lib/server/auth';
import { sanitizeFormData } from '$lib/utils/sanitize';
import { constants } from 'node:http2';
import {
  type Action,
  type ActionFailure,
  fail,
  type RequestEvent,
  type Transport,
} from '@sveltejs/kit';
import {
  type Infer,
  message,
  type SuperValidated,
  superValidate,
} from 'sveltekit-superforms';
import { type ZodValidationSchema, zod4 } from 'sveltekit-superforms/adapters';
import type { z } from 'zod/v4';

/**
 * Wrapper function that sanitizes form data before passing it to an action function.
 * This helper automatically handles form data sanitization to prevent XSS attacks and other security issues.
 *
 * @param actionFn - The action function to execute with sanitized form data
 * @returns A SvelteKit action function that handles form data sanitization
 *
 * @example
 * ```typescript
 * // Basic usage with form data sanitization
 * export const actions: Actions = {
 *   updateProfile: withFormData(async (event, sanitizedFormData) => {
 *     const name = sanitizedFormData.get('name')?.toString();
 *     const email = sanitizedFormData.get('email')?.toString();
 *
 *     // Process sanitized form data safely
 *     await updateUserProfile({ name, email });
 *     return { success: true };
 *   })
 * };
 * ```
 */

export function withFormData(
  actionFn: (
    event: RequestEvent,
    sanitizedFormData: FormData
  ) => ReturnType<Action>
) {
  return async (event: RequestEvent) => {
    const formData = await event.request.formData();
    const sanitizedFormData = sanitizeFormData(formData);
    return actionFn(event, sanitizedFormData);
  };
}

/**
 * Function signature for Zod-validated action handlers.
 * Represents an action function that receives validated and type-safe data from a Zod schema.
 */

type ZodActionFn<T extends z.ZodSchema> = (
  event: RequestEvent,
  parsedData: z.infer<T>
) => ReturnType<Action>;

/**
 * Function signature for SvelteKit action functions with enhanced error handling.
 * Returns either validation errors, success data, or void for redirects.
 */

export type SvelteActionFn = (event: RequestEvent) => Promise<
  | ActionFailure<Record<string, unknown>>
  | Record<string, unknown>
  // biome-ignore lint/suspicious/noConfusingVoidType: Svelte Actions return void
  | void
>;

/**
 * Enhanced wrapper function that combines form data sanitization with Zod schema validation.
 * This overload provides direct form data validation without custom transformation.
 *
 * @param schema - Zod schema to validate the form data against
 * @param actionFn - The action function that receives validated data
 * @returns A SvelteKit action function with automatic validation and type safety
 *
 * @example
 * ```typescript
 * const userSchema = z.object({
 *   name: z.string().min(2),
 *   email: z.string().email(),
 *   age: z.coerce.number().min(18)
 * });
 *
 * export const actions: Actions = {
 *   createUser: withZodFormData(userSchema, async (event, validatedData) => {
 *     const { name, email, age } = validatedData;
 *     await createUser({ name, email, age });
 *     return { success: true };
 *   })
 * };
 * ```
 */
export function withZodFormData<T extends z.ZodSchema>(
  schema: T,
  actionFn: ZodActionFn<T>
): SvelteActionFn;

/**
 * Enhanced wrapper function that combines form data sanitization with Zod schema validation.
 * This overload supports custom form data transformation before validation.
 *
 * @param schema - Zod schema to validate the transformed form data against
 * @param formDataTransform - Function to transform raw FormData into validation-ready object
 * @param actionFn - The action function that receives validated data
 * @returns A SvelteKit action function with automatic validation and type safety
 *
 * @example
 * ```typescript
 * export const actions: Actions = {
 *   saveField: withZodFormData(
 *     saveFieldSchema,
 *     (formData) => ({
 *       ...Object.fromEntries(formData.entries()),
 *       options: JSON.parse(formData.get('options')?.toString() ?? '[]'),
 *       required: formData.get('required') === 'true'
 *     }),
 *     async (event, parsedData) => {
 *       await updateFormField(parsedData);
 *       return { success: true, field: parsedData };
 *     }
 *   )
 * };
 * ```
 */
export function withZodFormData<T extends z.ZodSchema>(
  schema: T,
  formDataTransform: (formData: FormData) => Record<string, unknown>,
  actionFn: ZodActionFn<T>
): SvelteActionFn;

export function withZodFormData<T extends z.ZodSchema>(
  schema: T,
  actionFnOrTransform:
    | ZodActionFn<T>
    | ((formData: FormData) => Record<string, unknown>),
  actionFn?: ZodActionFn<T>
): SvelteActionFn {
  return async (event: RequestEvent) => {
    const formData = await event.request.formData();
    const sanitizedFormData = sanitizeFormData(formData);

    const hasTransform = actionFn !== undefined;
    const transformFunction = hasTransform
      ? (actionFnOrTransform as (formData: FormData) => Record<string, unknown>)
      : (formData: FormData) => Object.fromEntries(formData.entries());
    const targetActionFn = hasTransform
      ? actionFn
      : (actionFnOrTransform as ZodActionFn<T>);

    const result = schema.safeParse(transformFunction(sanitizedFormData));

    if (!result.success) {
      return fail(400, {
        message: 'Invalid form data',
        errors: result.error.issues,
      });
    }

    return targetActionFn(event, result.data);
  };
}

/**
 * Configuration options for withSuperForm wrapper function.
 * Combines Zod schema with optional Superforms configuration settings.
 */
type WithSuperFormOptions<T extends ZodValidationSchema> = {
  schema: T;
  options?: Partial<{
    errors: boolean;
    id: string;
    preprocessed: (keyof Infer<T, 'zod4'>)[];
    defaults: Infer<T, 'zod4'>;
    strict: boolean;
    allowFiles: boolean;
    transport: Transport;
  }>;
};

/**
 * Advanced wrapper function that integrates SvelteKit Superforms with form data sanitization.
 * Provides comprehensive form handling with validation, error management, and form state management.
 * Automatically handles form validation, error display, and provides rich form features like progressive enhancement.
 *
 * @param options - Configuration object containing the Zod schema and Superforms options
 * @param actionFn - The action function that receives the validated SuperValidated form object
 * @returns A SvelteKit action function with full Superforms integration
 *
 * @example
 * ```typescript
 * // Basic Superforms integration
 * const editFormSchema = z.object({
 *   title: z.string().min(2).max(50),
 *   description: z.string().min(2).max(255),
 *   formId: z.string().uuid()
 * });
 *
 * export const actions: Actions = {
 *   editSurvey: withSuperForm(
 *     {
 *       schema: editFormSchema,
 *       options: { id: 'editForm' }
 *     },
 *     async (event, form) => {
 *       const { title, description, formId } = form.data;
 *
 *       try {
 *         await updateSurvey(formId, { title, description });
 *         return { editForm: form };
 *       } catch (error) {
 *         return message(form,
 *           { type: 'error', text: 'Failed to update survey' },
 *           { status: 500 }
 *         );
 *       }
 *     }
 *   )
 * };
 *
 * // Advanced usage with custom options
 * export const actions: Actions = {
 *   createForm: withSuperForm(
 *     {
 *       schema: createFormSchema,
 *       options: {
 *         id: 'createForm',
 *         errors: true,
 *         strict: true,
 *         defaults: { title: 'New Survey', description: '' }
 *       }
 *     },
 *     async (event, form) => {
 *       // Full form object with validation state, errors, etc.
 *       if (!form.valid) return form;
 *
 *       const newForm = await createForm(form.data);
 *       return redirect(303, `/surveys/${newForm.slug}`);
 *     }
 *   )
 * };
 * ```
 */

export function withSuperForm<T extends ZodValidationSchema>(
  options: WithSuperFormOptions<T>,
  actionFn: (
    event: RequestEvent,
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    form: SuperValidated<Infer<T, 'zod4'>, any, Infer<T, 'zod4'>>
  ) => ReturnType<Action>
): SvelteActionFn {
  console.log(options);
  return async (event: RequestEvent) => {
    const formData = await event.request.formData();
    const sanitizedFormData = sanitizeFormData(formData);
    const form = await superValidate(
      sanitizedFormData,
      zod4(options.schema),
      options.options
    );
    if (!form.valid)
      return message(form, { type: 'error', text: 'Invalid form' });

    const result = await actionFn(event, form);
    console.log(
      'action fn result, does this get called on a redirect?',
      result
    );
    return result;
  };
}

/**
 * Wraps an action function with a permission check, ensuring that the user has proper authentication
 * and authorization before executing the action.
 *
 * @param {function(auth: AuthApi, headers: Headers): Promise<boolean>} permissionCheckFn
 *   A function to check if the user has the necessary permissions. It receives the authentication API
 *   object and request headers and returns a promise resolving to a boolean indicating whether the user
 *   has the required permissions.
 * @param {SvelteActionFn} actionFn
 *   The action function to be executed if the user passes the authentication and permission checks.
 * @return {SvelteActionFn}
 *   A new Svelte action function that incorporates the permission check and user authentication logic,
 *   calling the original action function if all requirements are met.
 */
export function requireActionPermission(
  permissionCheckFn: (auth: AuthApi, headers: Headers) => Promise<boolean>,
  actionFn: SvelteActionFn
): SvelteActionFn {
  return async (event: RequestEvent) => {
    const session = await event.locals.auth.getSession({
      headers: event.request.headers,
    });

    if (!session)
      return fail(constants.HTTP_STATUS_UNAUTHORIZED, {
        message: 'Unauthorized',
      });

    const hasPermission = await permissionCheckFn(
      event.locals.auth,
      event.request.headers
    );

    if (!hasPermission)
      return fail(constants.HTTP_STATUS_FORBIDDEN, {
        message: 'Insufficient permissions',
      });

    return actionFn(event);
  };
}
