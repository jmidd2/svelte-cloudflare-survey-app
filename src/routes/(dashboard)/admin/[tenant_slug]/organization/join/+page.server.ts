import {
  members,
  organizations as organizationsTable,
  requests,
  type SelectOrganization,
} from '$lib/server/db/schema';
import { withZodFormData } from '$lib/server/utils/';
import { constants } from 'node:http2';
import { fail, redirect } from '@sveltejs/kit';
import { generateId } from 'better-auth';
import { APIError } from 'better-call';
import { eq } from 'drizzle-orm';
import { z } from 'zod/v4';
import type { Actions, PageServerLoad } from '../../../organization/join/$types';
import { createOrganizationSchema, profileSchema, requestJoinSchema } from '$lib/validation-schema';

export const load: PageServerLoad = async ({ locals, parent, request }) => {
  const { user } = await parent();

  // If no user, redirect to log in
  if (!user) {
    redirect(303, '/login');
  }

  const memberOfOrganizations = await locals.auth.listOrganizations({
    headers: request.headers,
  });

  const hasName = !!user.name;
  const hasOrganization = memberOfOrganizations.length > 0;

  let organizations: Array<SelectOrganization & { memberCount?: number }> = [];

    organizations = await locals.db
      .select({
        ...organizationsTable,
        memberCount: locals.db.$count(
          members,
          eq(members.organizationId, organizationsTable.id)
        ),
      })
      .from(organizationsTable);

    console.log('no organization', organizations);


  return {
    user: user,
    organizations,
    hasName,
    userOrganizations: memberOfOrganizations,
    hasOrganization,
  };
};

export const actions: Actions = {
  'request-join': withZodFormData(
    requestJoinSchema,
    async ({ locals, request, cookies }, formData) => {
      const session = await locals.auth.getSession({
        headers: request.headers,
      });

      if (!session) {
        return fail(constants.HTTP_STATUS_UNAUTHORIZED, {
          error: 'Unauthenticated',
        });
      }

      const id = generateId();
      const defaultExpiration = 60 * 60 * 48 * 1000; // 2 Days
      const expiresAt = new Date(Date.now() + defaultExpiration);
      
      try {
        await locals.db
          .insert(requests)
          .values({
            id,
            userId: session.user.id,
            organizationId: formData.organizationId,
            expiresAt,
          })
          .onConflictDoNothing({
            target: [requests.userId, requests.organizationId],
          });
      } catch (e) {
        console.error('error creating request to join', e);
        return fail(400, { error: 'error creating request to join' });
      }

      cookies.set('flash_message', 'Request to join sent', {
        path: '/',
      });
    }
  ),
};
