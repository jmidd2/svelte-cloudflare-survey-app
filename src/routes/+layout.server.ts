import type {LayoutServerLoad} from "../../.svelte-kit/types/src/routes/$types";

export const load: LayoutServerLoad = async function (event) {
    const session = await event.locals.auth();

    return {
        session,
    }
}