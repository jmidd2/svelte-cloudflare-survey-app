export {handle} from '$lib/auth'
// import { handle as AuthenticationHandle } from '$lib/auth';
// import type {Handle} from "@sveltejs/kit";
// import {SvelteKitAuth} from "@auth/sveltekit";
// import Auth0 from "@auth/core/providers/auth0";

// export const handle: Handle = function({event:{platform}}) {
//     const {handle} = SvelteKitAuth({
//         trustHost: false,
//         providers: [Auth0({
//             clientId: platform?.env?.AUTH0_CLIENT_ID,
//             clientSecret: platform?.env?.AUTH0_CLIENT_SECRET,
//         })]
//     })
//
//
// }