import { env } from '$env/dynamic/private';
import { newSvelteKitAuthConfig, signIn } from '$lib/auth';
import { Auth, createActionURL } from '@auth/core';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function (event) {
  const {
    locals,
    request,
    url: { protocol },
  } = event;
  const session = await locals.auth();

  const headers = new Headers(request.headers);
  const config = await newSvelteKitAuthConfig(event);
  const signInUrl = createActionURL('signin', protocol, headers, env, {
    basePath: config,
    logger,
  });
};

export const actions = { default: signIn };
