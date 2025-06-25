import {requireActionPermission, withSuperForm} from "$lib/server/utils/";
import {canManageOrganization} from "$lib/server/auth";
import {type Actions, fail, redirect} from "@sveltejs/kit";
import {generateUrlSlug} from "$lib/utils";
import {type InsertOrganization, organizations} from "$lib/server/db/schema";
import {generateId} from "better-auth";
import type {PageServerLoad} from "./$types";
import {constants} from "node:http2";
import {superValidate} from "sveltekit-superforms";
import {zod4} from "sveltekit-superforms/adapters";
import {createOrganizationSchema} from "$lib/validation-schema";
import {APIError} from "better-call";

export const load: PageServerLoad = async ({locals, request}) => {
    const session = await locals.auth.getSession({headers: request.headers});
    if(!session) redirect(constants.HTTP_STATUS_SEE_OTHER, '/login');

    return {
        form: await superValidate(zod4(createOrganizationSchema))
    }
}

type CreateOrg = {
    name: string;
    slug: string;
    userId?: string | undefined;
    metadata?: Record<string, any> | undefined;
    logo?: string | undefined;
    keepCurrentActiveOrganization?: boolean | undefined;
}

export const actions: Actions = {
    create: withSuperForm({schema:createOrganizationSchema}, async ({locals, request}, form) => {
            const values: CreateOrg = {
                // id: generateId(),
                name: form.data.name,
                slug: form.data.slug,
                // createdAt: new Date(Date.now()),
            }

            try {
                /**
                 *
                 * Who made this api??
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
                        slug: values.slug,
                    },
                });

                await locals.auth.createOrganization({
                    headers: request.headers,
                    body: {
                        ...values,
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

            redirect(constants.HTTP_STATUS_SEE_OTHER, `/admin/${values.slug}`)
        }),
}