import {
  forms as formsTable,
  submissions as submissionsTable,
} from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function ({ locals, request }) {
  const session = await locals.auth.getSession({
    headers: request.headers,
  });

  // if (!session?.user?.userId) {
  //     return fail(401, { type: "error", error: "Unauthenticated" })
  // }

  const forms = await locals.db.$count(formsTable);
  const submissions = await locals.db.$count(submissionsTable);

  const stats = [
    { label: 'Forms Created', number: forms },
    { label: 'Submissions Collected', number: submissions },
  ];

  return {
    stats,
    session,
  };
};
