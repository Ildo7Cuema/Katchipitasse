export const ROLES = {
  CLIENTE: 'cliente',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
}

export function isStaffRole(role) {
  return role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN
}

export function isSuperAdminRole(role) {
  return role === ROLES.SUPER_ADMIN
}

export function roleLabel(role) {
  const map = {
    cliente: 'Cliente',
    admin: 'Admin (loja)',
    super_admin: 'Super Admin',
  }
  return map[role] || role
}
