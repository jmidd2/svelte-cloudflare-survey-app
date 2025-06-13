import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, request }) => {
  const session = await locals.auth.api.getSession({
    headers: request.headers,
  });

  // If no session or user already has a name, redirect
  if (!session?.user || session.user.name) {
    redirect(303, '/');
  }

  return {
    user: session.user,
  };
};

export const actions: Actions = {
  default: async ({ request, locals }) => {
    const formData = await request.formData();
    const name = formData.get('name') as string;

    if (!name?.trim()) {
      return fail(400, { name, missing: true });
    }

    try {
      // Update user name using Better Auth
      await locals.auth.api.updateUser({
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
