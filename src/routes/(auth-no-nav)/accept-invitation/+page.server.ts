import { invitations } from '$lib/server/db/schema';
import { constants } from 'node:http2';
import { error, redirect } from '@sveltejs/kit';
import { APIError } from 'better-call';
import { eq } from 'drizzle-orm';

export const load = async ({ locals, request, url, cookies }) => {
  const query = url.searchParams;
  let id = query.get('id');

  if (!id) {
    // check cookie then if blank error
    const cookie = cookies.get('pending_invite');
    if (cookie) {
      id = cookie;
    } else {
      error(constants.HTTP_STATUS_NOT_FOUND, {
        message: 'Invalid invitation ID.',
      });
    }
  }

  try {
    const [invite] = await locals.db
      .select()
      .from(invitations)
      .where(eq(invitations.id, id));

    if (!invite)
      error(constants.HTTP_STATUS_NOT_FOUND, {
        message: 'Invalid invitation ID.',
      });
  } catch (e) {
    console.error('Failed to get invitation:', e);
  }
  // make sure they are logged in
  const session = await locals.auth.getSession({ headers: request.headers });

  if (session) {
    // the user is logged in accept the invite
    try {
      await locals.auth.acceptInvitation({
        headers: request.headers,
        body: {
          invitationId: id,
        },
      });
    } catch (e) {
      console.error('Failed to accept invitation:', e);
      if (e instanceof APIError && e.body) {
        return { type: e.body.code, message: e.body.message };
      }
    }
  } else {
    // Store invite ID in secure, HTTP-only cookie
    cookies.set('pending_invite', id, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour expiry
      path: '/',
    });

    /**
     *   TODO: Handle Failed to accept invitation: [APIError: You are not the recipient of the invitation] {
     *
     *   status: 'FORBIDDEN',
     *       body: {
     *     code: 'YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION',
     *         message: 'You are not the recipient of the invitation'
     *   },
     *   headers: {},
     *   statusCode: 403
     *   }
     */

    redirect(
      constants.HTTP_STATUS_SEE_OTHER,
      '/login?redirect=accept-invitation'
    );
  }

  cookies.set(
    'flash_message',
    'You have been accepted into the organization.',
    {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour expiry
      path: '/',
    }
  );
  redirect(constants.HTTP_STATUS_SEE_OTHER, '/');
};
