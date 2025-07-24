import { constants } from 'node:http2';
import { type Actions, redirect } from '@sveltejs/kit';
import { message, superForm, superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { z } from 'zod/v4';
import { withSuperForm } from '$lib/server/utils/';

const userEditSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
});

export const load = async function ({ locals, request: { headers }, parent }) {
  const { user } = await parent();

  if (!user) redirect(constants.HTTP_STATUS_SEE_OTHER, '/login');

  const split = user.name.split(' ');

  const lastName = split.pop();

  const firstName = split.join(' ');

  const linkedAccounts = await locals.auth.listUserAccounts({
    headers,
  });

  console.log('linkedAccounts', linkedAccounts);

  return {
    linkedAccounts,
    form: await superValidate({ firstName, lastName }, zod4(userEditSchema)),
  };
};

export const actions: Actions = {
  'update-profile': withSuperForm(
    {
      schema: userEditSchema,
    },
    async ({ locals, request: { headers } }, form) => {
      const { firstName, lastName } = form.data;
      console.log(firstName, lastName);
      try {
        await locals.auth.updateUser({
          headers,
          body: {
            name: `${firstName} ${lastName}`,
          },
        });
        return { form };
      } catch (error) {
        return message(
          form,
          { type: 'error', text: 'Failed to update user' },
          { status: 500 }
        );
      }
    }
  ),
};
