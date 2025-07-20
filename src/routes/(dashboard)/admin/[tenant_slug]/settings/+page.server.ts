import { constants } from 'node:http2';
import { type Actions, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod/v4';
import { checkOrganizationSlug } from '$lib/server/auth';
import { withSuperForm, withZodFormData } from '$lib/server/utils/';

export const load = async function ({ locals, request, params, parent }) {
  const { tenant } = await parent();

  return {
    form: await superValidate(tenant, zod4(updateOrgSchema)),
  };
};

const updateOrgSchema = z.object({
  id: z.string().length(32),
  name: z.string().min(2),
  slug: z.string().nullable(),
  description: z.string(),
});

const deleteOrgSchema = z.object({
  id: z.string().length(32),
});

export const actions: Actions = {
  'update-org': withSuperForm(
    { schema: updateOrgSchema },
    async function ({ locals, request, params }, form) {
      if (form.data.slug) {
        const slugExists = !(await checkOrganizationSlug(
          locals.auth,
          request.headers,
          form.data.slug
        ));

        if (slugExists) {
          fail(constants.HTTP_STATUS_CONFLICT, {
            success: false,
            error: 'ALREADY_EXISTS',
            message: 'The organization slug already exists.',
          });
        }

        const { id, ...values } = form.data;

        locals.auth.updateOrganization({
          body: {
            data: {
              ...values,
            },
            organizationId: id,
          },
        });
      }
    }
  ),
  'delete-org': withZodFormData(
    deleteOrgSchema,
    async function ({ locals, request, params }, { id: tenantId }) {
      console.log(tenantId);
      // TODO: Finish deleting an org
    }
  ),
};
