import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, url }) => {
  // You can fetch the survey data here if needed
  // For now, we'll pass the slug and let the client handle the rest

  const submissionId = url.searchParams.get('id');

  return {
    survey: {
      id: params.form_slug, // You might want to fetch actual survey data here
      slug: params.form_slug,
      title: 'Survey', // Placeholder - replace with actual data
      description: null,
    },
    submissionId,
  };
};
