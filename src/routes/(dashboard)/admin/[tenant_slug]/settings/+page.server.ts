import { constants } from "node:http2";
import { type Actions, fail, redirect } from "@sveltejs/kit";
import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { z } from "zod/v4";
import { type AuthApi, checkOrganizationSlug } from "$lib/server/auth";
import { withSuperForm, withZodFormData } from "$lib/server/utils/";

export const load = async function ({ parent }) {
  const { tenant } = await parent();

  if (!tenant) throw redirect(constants.HTTP_STATUS_SEE_OTHER, "/login");

  return {
    form: await superValidate(tenant, zod4(updateOrgSchema)),
  };
};

const updateOrgSchema = z.object({
  id: z.string().length(32),
  name: z.string().min(2),
  slug: z.string(),
  description: z.string().optional(),
});

const deleteOrgSchema = z.object({
  id: z.string().length(32),
});

export const actions: Actions = {
  "update-org": withSuperForm(
    { schema: updateOrgSchema },
    async function ({ locals, request }, form) {
      const tenant = await locals.auth.getFullOrganization({
        query: {
          organizationId: form.data.id,
        },
        headers: request.headers,
      });

      if (!tenant) {
        fail(constants.HTTP_STATUS_NOT_FOUND, {
          success: false,
          error: "NOT_FOUND",
          message: "The organization was not found.",
        });
      }

      const values: CreateOrgSchema = {
        name: form.data.name,
        id: form.data.id,
        description: form.data.description,
      };

      const slugChanged = hasSlugChanged(tenant, form.data.slug);

      if (slugChanged && form.data.slug) {
        const slugExists = !(await checkOrganizationSlug(
          locals.auth,
          request.headers,
          form.data.slug,
        ));

        if (slugExists) {
          fail(constants.HTTP_STATUS_CONFLICT, {
            success: false,
            error: "ALREADY_EXISTS",
            message: "The organization slug already exists.",
          });
        }

        values.slug = form.data.slug;
      }

      const result = await updateOrganization(
        locals.auth,
        request.headers,
        values,
      );

      if (!result.success) {
        return fail(constants.HTTP_STATUS_BAD_REQUEST, result);
      }

      if (slugChanged) {

        redirect(
          constants.HTTP_STATUS_SEE_OTHER,
          `/admin/${form.data.slug}/settings`,
        );
      }
    },
  ),
  "delete-org": withZodFormData(
    deleteOrgSchema,
    async function ({ locals, request, cookies }, { id: organizationId }) {
      await locals.auth.deleteOrganization({
        headers: request.headers,
        body: {
          organizationId,
        },
      });

      cookies.set("flash_message", "Organization deleted", {
        path: "/",
      });
      redirect(constants.HTTP_STATUS_SEE_OTHER, "/admin");
    },
  ),
};

type CreateOrgSchema = {
  id: string;
  name: string;
  slug?: string | undefined;
  description?: string | undefined;
};

function hasSlugChanged(
  tenant: { slug: string },
  new_slug: string | null | undefined,
) {
  return tenant.slug !== new_slug;
}

async function updateOrganization(
  authApi: AuthApi,
  headers: Headers,
  values: CreateOrgSchema,
) {
  try {
    await authApi.updateOrganization({
      headers,
      body: {
        data: {
          ...values,
        },
        organizationId: values.id,
      },
    });

    return { success: true };
  } catch (e) {
    console.error("error creating organization", e);
    return {
      success: false,
      error: e,
      message: "There was an error creating the Organization.",
    };
  }
}
