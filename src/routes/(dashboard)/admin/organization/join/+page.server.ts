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
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent, request }) => {
  const { user } = await parent();

  // If no user, redirect to log in
  if (!user) {
    redirect(303, '/login');
  }

  // Check if the user is already complete (has name AND is member of an organization)
  const memberOfOrganizations = await locals.auth.listOrganizations({
    headers: request.headers,
  });

  const hasName = !!user.name;
  const hasOrganization = memberOfOrganizations.length > 0;

  // If user already has both name and organization membership, redirect away
  let organizations: Array<SelectOrganization & { memberCount?: number }> = [];

    organizations = await locals.db
      // @ts-expect-error For some reason the SQLite | D1 adapter does not like partial select
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

const profileSchema = z.object({
  name: z.string().nonempty().max(255),
});

const createOrganizationSchema = z.object({
  name: z.string().nonempty().max(255),
});

const requestJoinSchema = z.object({
  organizationId: z.string().min(32).max(36),
});

export const actions: Actions = {
  profile: withZodFormData(
    profileSchema,
    async ({ request, locals }, formData) => {
      try {
        // Update user name using Better Auth
        await locals.auth.updateUser({
          headers: request.headers,
          body: {
            name: formData.name,
          },
        });
      } catch (error) {
        console.error('Failed to update user name:', error);
        return fail(500, { message: 'Failed to update user name.' });
      }
    }
  ),
  'create-organization': withZodFormData(
    createOrganizationSchema,
    async ({ locals, request }, formData) => {
      const slug = formData.name.toLowerCase().replace(/\s/g, '-');
      try {
        /**
         *
         * Who made this api
         * this will throw an APIError like:
         *
         * [APIError: slug is taken] {
         *   status: 'BAD_REQUEST',
         *   body: { code: 'SLUG_IS_TAKEN', message: 'slug is taken' },
         *   headers: {},
         *   statusCode: 400
         * }
         * when the slug is taken and { status: true } when it's available
         * so now instead of handling this with a false status or something, it has to be done in the catch
         */
        await locals.auth.checkOrganizationSlug({
          headers: request.headers,
          body: {
            slug,
          },
        });

        await locals.auth.createOrganization({
          headers: request.headers,
          body: {
            name: formData.name,
            slug,
          },
        });
      } catch (e) {
        console.error('error creating organization', e);
        if (e instanceof APIError) {
          if (e.body?.code === 'SLUG_IS_TAKEN') {
            return fail(400, {
              error: 'SLUG_IS_TAKEN',
              message: 'Slug is taken',
            });
          }
        }
      }
    }
  ),
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
      //return redirect(303, '/');
    }
  ),
  original: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = formData.get('name') as string;

    if (!name?.trim()) {
      return fail(400, { name, missing: true });
    }

    try {
      // Update user name using Better Auth
      await locals.auth.updateUser({
        headers: request.headers,
        body: {
          name: name.trim(),
        },
      });
    } catch (error) {
      console.error('Failed to update user name:', error);
      return fail(500, { message: 'Failed to update user name.' });
    }

    // Redirect to home or intended destination
    redirect(303, '/');
  },
};
