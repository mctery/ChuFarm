import { getUserInfo } from './storage_service';

/**
 * Get current user's role and permissions from localStorage.
 */
function getUserAuth() {
  const info = getUserInfo();
  if (!info) return { role: null, permissions: [] };
  return {
    role: info.role || 'user',
    permissions: info.permissions || [],
  };
}

/**
 * Check if user is an admin (bypasses all permission checks).
 */
export function isAdmin() {
  const { role, permissions } = getUserAuth();
  return role === 'admin' || permissions.includes('*');
}

/**
 * Check if user has a specific permission.
 * Admins always return true.
 */
export function hasPermission(key) {
  if (isAdmin()) return true;
  const { permissions } = getUserAuth();
  return permissions.includes(key);
}

/**
 * Check if user has ALL of the specified permissions.
 * Admins always return true.
 */
export function hasAllPermissions(...keys) {
  if (isAdmin()) return true;
  const { permissions } = getUserAuth();
  return keys.every((key) => permissions.includes(key));
}

/**
 * Check if user has ANY of the specified permissions.
 * Admins always return true.
 */
export function hasAnyPermission(...keys) {
  if (isAdmin()) return true;
  const { permissions } = getUserAuth();
  return keys.some((key) => permissions.includes(key));
}
