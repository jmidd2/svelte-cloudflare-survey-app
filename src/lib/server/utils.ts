import type { Session, User } from '@auth/core/types';

export function isAdmin(user: Session['user']) {
  const ADMIN_ROLE = 'admin';

  return user.roles.includes(ADMIN_ROLE);
}

export function getSessionTenant(user: Session['user']) {
  return user.tenant;
}
