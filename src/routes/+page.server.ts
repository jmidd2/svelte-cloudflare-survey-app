import type {PageServerLoad} from "../../.svelte-kit/types/src/routes/$types";

export const load: PageServerLoad = function ({platform}) {
    if (!platform) {
        console.error("No platform");
        return;
    }
    const {env} = platform;
    console.log('Load page server', env);
    return { success: true };
}