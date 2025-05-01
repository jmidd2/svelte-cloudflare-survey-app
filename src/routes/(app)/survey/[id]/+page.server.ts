import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function ({ params }) {
  if (!params.id) throw new Error('id is required');
  return {
    id: params.id,
  };
};
