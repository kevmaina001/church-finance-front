// Front-end mirror of the backend role rules (backend remains the source of truth).
// Used to show/hide UI; it never replaces server-side enforcement.
export const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
};

const FULL_PARISH_ROLES = ['Admin', 'Special User', 'Vicar'];
const SCOPED_ROLES = ['Treasurer', 'Secretary'];

// Full authority over the whole parish (admin, vicar, or a parish-level treasurer/secretary).
export const isParishLevel = (user = getStoredUser()) => {
  if (FULL_PARISH_ROLES.includes(user.role)) return true;
  if (SCOPED_ROLES.includes(user.role) && !user.localChurch) return true;
  return false;
};

// View-only users cannot modify anything.
export const isReadOnly = (user = getStoredUser()) => ['Member', 'User'].includes(user.role);

// The church a user is locked to (Treasurer/Secretary tied to a church). Null otherwise.
// Such users can only ever view/act on their own church — never the parish or others.
export const lockedChurchId = (user = getStoredUser()) => {
  if (SCOPED_ROLES.includes(user.role) && user.localChurch) return user.localChurch;
  return null;
};

// Who may manage users: admin, vicar, and the parish treasurer.
export const canManageUsers = (user = getStoredUser()) => {
  if (['Admin', 'Special User', 'Vicar'].includes(user.role)) return true;
  if (user.role === 'Treasurer' && !user.localChurch) return true;
  return false;
};
