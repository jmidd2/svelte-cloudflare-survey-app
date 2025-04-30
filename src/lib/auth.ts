import {SvelteKitAuth, type SvelteKitAuthConfig} from "@auth/sveltekit";
import Auth0 from "@auth/core/providers/auth0";
export const {handle} = SvelteKitAuth(async (req) => {
    const { platform: {env} } = req;
    console.log(env)
    return ({
        secret: env.AUTH_SECRET,
        trustHost: true,
        providers: [Auth0({
            clientId: env.AUTH0_CLIENT_ID,
            clientSecret: env.AUTH0_CLIENT_SECRET,
        })]
    }) satisfies SvelteKitAuthConfig;
})