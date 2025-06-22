import { canManageMembers, canManageOrganization } from '$lib/server/auth';
import { getFormsByTenant } from '$lib/server/db';
import { forms } from '$lib/server/db/schema';
import { requireActionPermission } from '$lib/server/utils/';
import { withZodFormData } from '$lib/server/utils/action-helpers';
import type { Actions } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { z } from 'zod/v4';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, locals, request }) => {
  const data = await parent();
  // User, flashMessage, organizations, tenant

  const isAdmin = await canManageOrganization(locals.auth, request.headers);

  const forms = await getFormsByTenant(locals.db, data.tenant.id);

  console.log('data', data);
  return {
    forms,
    isAdmin,
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
};
