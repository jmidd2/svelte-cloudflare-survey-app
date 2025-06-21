import type { AuthApi } from '$lib/server/auth/index';

/**
 * Default Permission Categories
 * organization:
 * update delete
 *
 * member:
 * create update delete
 *
 * invitation:
 * create cancel
 */

/**
 * Interface defining the structure of organization permissions.
 *
 * @interface OrganizationPermissions
 * @property {Object|boolean} [organization] - Organization-level permissions
 * @property {boolean} [organization.update] - Permission to update organization
 * @property {boolean} [organization.delete] - Permission to delete organization
 * @property {Object|boolean} [member] - Member management permissions
 * @property {boolean} [member.create] - Permission to create members
 * @property {boolean} [member.update] - Permission to update members
 * @property {boolean} [member.delete] - Permission to delete members
 * @property {Object|boolean} [invitation] - Invitation management permissions
 * @property {boolean} [invitation.create] - Permission to create invitations
 * @property {boolean} [invitation.cancel] - Permission to cancel invitations
 */
interface OrganizationPermissions {
  organization?:
    | {
        update?: boolean;
        delete?: boolean;
      }
    | boolean;
  member?:
    | {
        create?: boolean;
        update?: boolean;
        delete?: boolean;
      }
    | boolean;
  invitation?:
    | {
        create?: boolean;
        cancel?: boolean;
      }
    | boolean;
}

/**
 * Checks if the current user has permission to manage organization members.
 *
 * This is a convenience function that checks for all member-related permissions
 * (create, update, delete).
 *
 * @param {AuthApi} auth - The authentication API instance
 * @param {Headers} headers - Request headers containing authentication tokens
 * @returns {Promise<boolean>} Promise resolving to true if user can manage members
 *
 * @example
 * ```typescript
 * const canManage = await canManageMembers(auth.api, request.headers);
 * if (canManage) {
 *   // Allow member management operations
 * }
 * ```
 */
export async function canManageMembers(
  auth: AuthApi,
  headers: Headers
): Promise<boolean> {
  return await checkOrgPermissions(auth, headers, { member: true });
}

/**
 * Checks if the current user has permission to invite new members to the organization.
 *
 * This function specifically checks for invitation creation permissions.
 *
 * @param {AuthApi} auth - The authentication API instance
 * @param {Headers} headers - Request headers containing authentication tokens
 * @returns {Promise<boolean>} Promise resolving to true if user can invite members
 *
 * @example
 * ```typescript
 * const canInvite = await canInviteMembers(auth.api, request.headers);
 * if (canInvite) {
 *   // Show invite member button
 * }
 * ```
 */
export async function canInviteMembers(
  auth: AuthApi,
  headers: Headers
): Promise<boolean> {
  return await checkOrgPermissions(auth, headers, {
    invitation: true,
  });
}

/**
 * Core permission checking function that validates organization-level permissions.
 *
 * This function handles the complex logic of permission validation by:
 * - Converting boolean permissions to specific permission arrays
 * - Mapping permissions to their default values
 * - Making API calls to validate user permissions
 * - Handling errors gracefully
 *
 * @param {AuthApi} auth - The authentication API instance
 * @param {Headers} headers - Request headers containing authentication tokens
 * @param {OrganizationPermissions} permissions - Object defining required permissions
 * @returns {Promise<boolean>} Promise resolving to true if user has all required permissions
 *
 * @throws {Error} Logs permission check errors but returns false instead of throwing
 *
 * @example
 * ```typescript
 * // Check for specific member permissions
 * const canUpdate = await checkOrgPermissions(auth.api, headers, {
 *   member: { update: true, delete: true }
 * });
 *
 * // Check for all organization permissions
 * const canManageOrg = await checkOrgPermissions(auth.api, headers, {
 *   organization: true
 * });
 * ```
 */
export async function checkOrgPermissions(
  auth: AuthApi,
  headers: Headers,
  permissions: OrganizationPermissions
): Promise<boolean> {
  const permissionEntries = Object.entries(permissions);
  const ORGANIZATION_PERMISSIONS = ['update', 'delete'];
  const MEMBER_PERMISSIONS = ['create', 'update', 'delete'];
  const INVITATION_PERMISSIONS = ['create', 'cancel'];

  const DEFAULT_PERMISSIONS = {
    organization: ORGANIZATION_PERMISSIONS,
    member: MEMBER_PERMISSIONS,
    invitation: INVITATION_PERMISSIONS,
  };

  const permissionBody: { [key: string]: string[] } = {};

  for (const [permission, value] of permissionEntries as unknown as [
    keyof typeof DEFAULT_PERMISSIONS,
    boolean | { [key: string]: boolean },
  ][]) {
    if (typeof value === 'boolean') {
      permissionBody[permission] = DEFAULT_PERMISSIONS[permission];
    } else if (typeof value === 'object') {
      permissionBody[permission] = Object.entries(value)
        .map(([key, value]) => {
          if (value) {
            return key;
          }
        })
        .filter(Boolean) as string[];
    }
  }
  let result = false;
  try {
    const member = await auth.hasPermission({
      headers,
      body: {
        permissions: permissionBody,
      },
    });

    result = member.success;
  } catch (e) {
    console.error("There was an error checking the user's permissions: ", e);
    result = false;
  }

  // Only owners and admins can manage members
  return result;
}
