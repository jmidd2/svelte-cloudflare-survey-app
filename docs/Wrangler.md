# Auth0 Implementation for Cloudflare Worker Deployment

This guide covers specific considerations and implementation details for Auth0 authentication in a Cloudflare Worker deployment.

## Auth0 Configuration for Workers

### Application Settings

When setting up your Auth0 application for a Worker deployment:

1. Set the **Allowed Callback URLs** to:
   ```
   https://your-worker-domain.workers.dev/api/auth/callback/auth0
   ```

2. Set the **Allowed Logout URLs** to:
   ```
   https://your-worker-domain.workers.dev
   ```

3. Set the **Allowed Web Origins** to:
   ```
   https://your-worker-domain.workers.dev
   ```

4. Make sure to update these URLs when you move to a custom domain.

## Worker-specific Auth.js Implementation

### Authentication Setup

Create `src/app/hooks.server.js`:

```javascript
import { SvelteKitAuth } from '@auth/sveltekit';
import Auth0Provider from '@auth/auth0-provider';

export const handle = SvelteKitAuth(async (event) => {
  const authOptions = {
    providers: [
      Auth0Provider({
        clientId: event.platform.env.AUTH0_CLIENT_ID,
        clientSecret: event.platform.env.AUTH0_CLIENT_SECRET,
        issuer: `https://${event.platform.env.AUTH0_DOMAIN}`
      })
    ],
    callbacks: {
      async jwt({ token, user, account, profile }) {
        // Add roles and permissions from Auth0 to the token
        if (profile && profile.roles) {
          token.roles = profile.roles;
        }
        
        // Extract tenant ID from roles (assuming role format "tenant-123")
        if (token.roles) {
          const tenantRole = token.roles.find(role => role.startsWith('tenant-'));
          if (tenantRole) {
            token.tenantId = tenantRole.replace('tenant-', '');
          }
        }
        
        return token;
      },
      async session({ session, token }) {
        // Pass tenant information to the session
        session.user.roles = token.roles;
        session.user.tenantId = token.tenantId;
        return session;
      }
    },
    secret: event.platform.env.AUTH_SECRET,
    trustHost: true
  };
  
  return authOptions;
});
```

### Auth.js Route Handler

Create `src/app/routes/api/auth/[...auth]/+server.js`:

```javascript
import { authenticator } from '$lib/auth';
import { SvelteKitAuth } from '@auth/sveltekit';

// This route handles all auth-related callbacks and endpoints
export const { GET, POST } = SvelteKitAuth();
```

## Worker-Specific Session Storage

For Worker deployments, it's recommended to use KV for session storage. Configure your Auth.js setup to use KV:

### KV Adapter for Auth.js

Create `src/app/lib/auth/kv-adapter.js`:

```javascript
/**
 * KV Adapter for Auth.js sessions
 */
export function KVAdapter(kv) {
  return {
    async createSession(session) {
      await kv.put(`session:${session.sessionToken}`, JSON.stringify(session), {
        expirationTtl: Math.floor((new Date(session.expires).getTime() - Date.now()) / 1000)
      });
      return session;
    },
    async getSession(sessionToken) {
      const session = await kv.get(`session:${sessionToken}`, 'json');
      return session || null;
    },
    async updateSession(session) {
      await kv.put(`session:${session.sessionToken}`, JSON.stringify(session), {
        expirationTtl: Math.floor((new Date(session.expires).getTime() - Date.now()) / 1000)
      });
      return session;
    },
    async deleteSession(sessionToken) {
      await kv.delete(`session:${sessionToken}`);
    },
    async createVerificationToken(token) {
      await kv.put(`token:${token.identifier}:${token.token}`, JSON.stringify(token), {
        expirationTtl: Math.floor((new Date(token.expires).getTime() - Date.now()) / 1000)
      });
      return token;
    },
    async useVerificationToken({ identifier, token }) {
      const key = `token:${identifier}:${token}`;
      const verificationToken = await kv.get(key, 'json');
      if (!verificationToken) return null;
      await kv.delete(key);
      return verificationToken;
    }
  };
}
```

### Updated Auth.js Configuration

Add the KV adapter to your Auth.js configuration:

```javascript
import { SvelteKitAuth } from '@auth/sveltekit';
import Auth0Provider from '@auth/auth0-provider';
import { KVAdapter } from '$lib/auth/kv-adapter';

export const handle = SvelteKitAuth(async (event) => {
  const authOptions = {
    providers: [
      Auth0Provider({
        clientId: event.platform.env.AUTH0_CLIENT_ID,
        clientSecret: event.platform.env.AUTH0_CLIENT_SECRET,
        issuer: `https://${event.platform.env.AUTH0_DOMAIN}`
      })
    ],
    adapter: KVAdapter(event.platform.env.CACHE),
    // Other configuration...
  };
  
  return authOptions;
});
```

## Worker-Specific Middleware for Tenant Isolation

Create middleware for tenant isolation in Workers:

### Tenant Middleware

Create `src/app/lib/auth/tenant-middleware.js`:

```javascript
import { redirect, error } from '@sveltejs/kit';

/**
 * Middleware to verify tenant access
 */
export async function verifyTenantAccess(event) {
  const session = await event.locals.getSession();
  
  // Check if user is authenticated
  if (!session?.user) {
    throw redirect(303, '/api/auth/signin');
  }
  
  // Check if user has a tenant ID
  if (!session.user.tenantId) {
    throw error(403, 'No tenant association found');
  }
  
  return session.user.tenantId;
}
```

### Using the Tenant Middleware

Use the middleware in your API endpoints:

```javascript
import { verifyTenantAccess } from '$lib/auth/tenant-middleware';

export async function GET(event) {
  // Get tenant ID and verify access
  const tenantId = await verifyTenantAccess(event);
  
  // Continue with tenant-specific logic
  // ...
}
```

## Testing Auth0 in Worker Environment

When testing Auth0 locally with your Worker deployment:

```bash
# Start the Worker with environment variables and bindings
wrangler dev \
  --var AUTH0_DOMAIN=your-tenant.auth0.com \
  --d1=DB:feedback-db \
  --kv=CACHE:YOUR_KV_ID
```

## Multi-Tenant User Management

For managing users across tenants in a Worker environment:

### Creating a New Tenant User

```javascript
export async function createTenantUser(email, tenantId, role, env) {
  // Check if user exists
  const existingUser = await env.DB.prepare(`
    SELECT * FROM users WHERE email = ?
  `).bind(email.toLowerCase()).first();
  
  if (existingUser) {
    // User exists, update tenant association
    await env.DB.prepare(`
      UPDATE users SET tenant_id = ?, role = ? WHERE id = ?
    `).bind(tenantId, role || 'viewer', existingUser.id).run();
    
    return existingUser.id;
  }
  
  // Create new user
  const userId = crypto.randomUUID();
  
  await env.DB.prepare(`
    INSERT INTO users (id, email, tenant_id, role, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    userId,
    email.toLowerCase(),
    tenantId,
    role || 'viewer',
    Math.floor(Date.now() / 1000)
  ).run();
  
  return userId;
}
```

### Add Role to Auth0 User

To automate the role assignment in Auth0:

```javascript
import { ManagementClient } from 'auth0';

export async function assignAuth0Role(userId, roleName, env) {
  const management = new ManagementClient({
    domain: env.AUTH0_DOMAIN,
    clientId: env.AUTH0_CLIENT_ID,
    clientSecret: env.AUTH0_CLIENT_SECRET,
    scope: 'read:users update:users'
  });
  
  // Get Auth0 role ID
  const roles = await management.getRoles();
  const role = roles.find(r => r.name === roleName);
  
  if (!role) {
    throw new Error(`Role ${roleName} not found`);
  }
  
  // Assign role to user
  await management.assignRolestoUser({ id: userId }, { roles: [role.id] });
}
```

## Important Worker-Specific Considerations

1. **Cookie Handling**: Workers have different cookie handling than Pages, ensure your Auth.js configuration accounts for this.

2. **KV Limitations**: KV has eventual consistency, which may affect session management in high-traffic scenarios.

3. **Environment Variables**: Worker environment variables are accessed through `event.platform.env` rather than `process.env`.

4. **Headers**: Some Auth0 features may require specific headers that need to be handled differently in Workers.

5. **Resource Limits**: Be mindful of Worker CPU time limits when implementing complex authentication flows.

This implementation provides a solid foundation for Auth0 authentication in a Cloudflare Worker deployment, with specific considerations for the Worker runtime environment and multi-tenant support.