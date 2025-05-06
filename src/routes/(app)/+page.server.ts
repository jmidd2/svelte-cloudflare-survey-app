import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function ({ locals }) {
  const session = await locals.auth();

  // if (!session?.user?.userId) {
  //     return fail(401, { type: "error", error: "Unauthenticated" })
  // }

  return {
    session,
  };
};
