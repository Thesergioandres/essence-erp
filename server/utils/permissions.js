// Matriz de permisos por rol y helper para calcular permisos efectivos
const ALL_ACTIONS = { read: true, create: true, update: true, delete: true };

export const ROLE_DEFAULT_PERMISSIONS = {
  admin: {
    products: ALL_ACTIONS,
    inventory: ALL_ACTIONS,
    sales: ALL_ACTIONS,
    promotions: ALL_ACTIONS,
    providers: ALL_ACTIONS,
    clients: ALL_ACTIONS,
    expenses: ALL_ACTIONS,
    analytics: { read: true, create: true, update: true, delete: true },
    config: ALL_ACTIONS,
    transfers: ALL_ACTIONS,
  },
  distribuidor: {
    products: { read: true },
    inventory: { read: true },
    sales: { read: true, create: true },
    promotions: { read: true },
    providers: { read: false },
    clients: { read: false },
    expenses: { read: false },
    analytics: { read: true },
    config: { read: false },
    transfers: { read: false },
  },
  viewer: {
    products: { read: true },
    inventory: { read: true },
    sales: { read: true },
    promotions: { read: true },
    providers: { read: true },
    clients: { read: true },
    expenses: { read: true },
    analytics: { read: true },
    config: { read: false },
    transfers: { read: false },
  },
};

const mergeModulePermissions = (base = {}, override = {}) => {
  const result = { ...base };
  for (const [module, perms] of Object.entries(override || {})) {
    result[module] = { ...(base[module] || {}), ...(perms || {}) };
  }
  return result;
};

export const buildEffectivePermissions = (membership) => {
  if (!membership) return {};
  const base = ROLE_DEFAULT_PERMISSIONS[membership.role] || {};
  const override = membership.permissions || {};
  return mergeModulePermissions(base, override);
};

export const isActionAllowed = (effectivePermissions, module, action) => {
  if (!module || !action) return false;
  const modulePerms = effectivePermissions?.[module];
  if (!modulePerms) return false;
  const value = modulePerms[action];
  return value === true;
};
