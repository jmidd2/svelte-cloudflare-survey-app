import type { Actions } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod/v4';
import { withSuperForm, withZodFormData } from '$lib/server/utils/';

export const load = async function ({ locals, request, params, parent }) {
  const { tenant } = await parent();

  return {
    form: await superValidate(tenant, zod4(updateOrgSchema)),
  };
};

const updateOrgSchema = z.object({
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
      console.log(form);
      // TODO: Finish editing org data
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
