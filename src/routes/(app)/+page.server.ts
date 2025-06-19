import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function ({ locals, request }) {
  const session = await locals.auth.getSession({
    headers: request.headers,
  });

  // if (!session?.user?.userId) {
  //     return fail(401, { type: "error", error: "Unauthenticated" })
  // }

  return {
    session,
  };
};
