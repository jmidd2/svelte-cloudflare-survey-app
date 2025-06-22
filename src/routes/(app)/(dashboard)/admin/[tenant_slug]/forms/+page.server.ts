import { canManageOrganization } from '$lib/server/auth';
import { getFormsByTenant } from '$lib/server/db';
import { forms, organizations } from '$lib/server/db/schema';
import { requireActionPermission } from '$lib/server/utils/';
import {
  withSuperForm,
  withZodFormData,
} from '$lib/server/utils/action-helpers';
import { generateUrlSlug } from '$lib/utils';
import { addFormSchema } from '$lib/validation-schema';
import { constants } from 'node:http2';
import { type Actions, redirect } from '@sveltejs/kit';
import { generateId } from 'better-auth';
import { eq } from 'drizzle-orm';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod/v4';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals, request }) => {
  const data = await parent();
  // User, flashMessage, organizations, tenant

  const isAdmin = await canManageOrganization(locals.auth, request.headers);

  const forms = await getFormsByTenant(locals.db, data.tenant.id);

  return {
    forms,
    isAdmin,
    addForm: await superValidate(zod4(addFormSchema)),
  };
};

export const actions: Actions = {
  'delete-form': requireActionPermission(
    canManageOrganization,
    withZodFormData(
      z.object({ formId: z.string().min(6) }),
      async ({ locals }, formData) => {
        // console.log('deleting', formData.formId);
        await locals.db.delete(forms).where(eq(forms.slug, formData.formId));
      }
    )
  ),
  'add-form': requireActionPermission(
    canManageOrganization,
    withSuperForm(
      { schema: addFormSchema },
      async ({ locals, request, params }, form) => {
        const [organization] = await locals.db
          .select()
          .from(organizations)
          .where(eq(organizations.slug, params.tenant_slug ?? ''));

        if (!organization) {
          return message(
            form,
            { type: 'error', text: 'Organization not found' },
            // @ts-expect-error
            { status: constants.HTTP_STATUS_NOT_FOUND }
          );
        }

        const session = await locals.auth.getSession({
          headers: request.headers,
        });

        if (!session) {
          return message(
            form,
            { type: 'error', text: 'User not authorized' },
            // @ts-expect-error
            { status: constants.HTTP_STATUS_UNAUTHORIZED }
          );
        }

        const slug = generateUrlSlug(form.data.title);
        try {
          await locals.db.insert(forms).values({
            active: true,
            createdAt: new Date(Date.now()),
            createdBy: session.user.id,
            description: form.data.description,
            id: generateId(),
            organizationId: organization.id,
            slug,
            title: form.data.title,
          });
        } catch (e) {
          console.error(e);
          return message(
            form,
            { type: 'error', text: 'There was an error' },
            // @ts-expect-error
            { status: constants.HTTP_STATUS_INTERNAL_SERVER_ERROR }
          );
        }
        redirect(
          constants.HTTP_STATUS_SEE_OTHER,
          `/admin/${params.tenant_slug}/forms/${slug}`
        );
      }
    )
  ),
};
