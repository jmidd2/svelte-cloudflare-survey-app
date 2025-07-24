import { constants } from 'node:http2';
import { type Actions, fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { type AuthApi, checkOrganizationSlug } from '$lib/server/auth';
import { withSuperForm } from '$lib/server/utils/';
import { createOrganizationSchema } from '$lib/validation-schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, request }) => {
  const session = await locals.auth.getSession({ headers: request.headers });
  if (!session) redirect(constants.HTTP_STATUS_SEE_OTHER, '/login');

  return {
    form: await superValidate(zod4(createOrganizationSchema)),
  };
};

type CreateOrg = {
  name: string;
  slug: string;
  userId?: string | undefined;
  metadata?: Record<string, any> | undefined;
  logo?: string | undefined;
  keepCurrentActiveOrganization?: boolean | undefined;
};

export const actions: Actions = {
  create: withSuperForm(
    { schema: createOrganizationSchema },
    async ({ locals, request }, form) => {
      const values: CreateOrg = {
        // id: generateId(),
        name: form.data.name,
        slug: form.data.slug,
        // createdAt: new Date(Date.now()),
      };

      const slugExists = !(await checkOrganizationSlug(
        locals.auth,
        request.headers,
        values.slug
      ));

      if (slugExists) {
        fail(constants.HTTP_STATUS_CONFLICT, {
          success: false,
          error: 'ALREADY_EXISTS',
          message: 'The organization slug already exists.',
        });
      }

      const result = await createOrganization(
        locals.auth,
        request.headers,
        values
      );
      if (!result.success) {
        return fail(constants.HTTP_STATUS_BAD_REQUEST, result);
      }

      redirect(constants.HTTP_STATUS_SEE_OTHER, `/admin/${values.slug}`);
    }
  ),
};

type CreateOrgResult =
  | { success: true }
  | { success: false; error: Error | unknown; message: string };

async function createOrganization(
  authApi: AuthApi,
  headers: Headers,
  values: CreateOrg
): Promise<CreateOrgResult> {
  try {
    await authApi.createOrganization({
      headers,
      body: {
        ...values,
      },
    });
    return { success: true };
  } catch (e) {
    console.error('error creating organization', e);
    return {
      success: false,
      error: e,
      message: 'There was an error creating the Organization.',
    };
  }
}
