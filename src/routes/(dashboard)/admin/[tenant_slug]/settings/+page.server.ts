import type { Actions } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod/v4';
import { withSuperForm } from '$lib/server/utils/';

export const load = async function ({ locals, request, params }) {
  return {
    form: await superValidate(zod4(updateOrgSchema)),
  };
};

const updateOrgSchema = z.object({
  name: z.string().min(2),
  slug: z.string(),
  description: z.string(),
});

export const actions: Actions = {
  'update-org': withSuperForm(
    { schema: updateOrgSchema },
    async function ({ locals, request, params }, form) {
      console.log(form);
    }
  ),
};
