// One place that decides whether the stored login is still usable, and one place
// that tears it down. Everything session-related should go through here so an
// expired token can never leave the user sitting in the app watching requests fail.

const SESSION_KEYS = ['token', 'user', 'tenant', 'activeChurch'];

// Reads the `exp` claim out of the JWT without verifying the signature — the
// server is still the authority; this only lets the UI log out on time instead
// of waiting for a request to come back 401.
export const getTokenExpiry = (token = localStorage.getItem('token')) => {
  if (!token) return null;
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    const { exp } = JSON.parse(json);
    return exp ? exp * 1000 : null;
  } catch {
    return null;
  }
};

// Expire a few seconds early so a request can't leave while valid and arrive expired.
const CLOCK_SKEW_MS = 5000;

export const isSessionExpired = (token = localStorage.getItem('token')) => {
  if (!token) return true;
  const expiresAt = getTokenExpiry(token);
  if (!expiresAt) return false; // unreadable token: let the server rule on it
  return Date.now() >= expiresAt - CLOCK_SKEW_MS;
};

export const clearSession = () => {
  SESSION_KEYS.forEach((key) => localStorage.removeItem(key));
};

let redirecting = false;

// Ends the session and sends the user to the login screen. Safe to call from
// several failing requests at once — only the first one redirects.
export const endSession = ({ expired = true } = {}) => {
  clearSession();
  if (redirecting) return;
  if (window.location.pathname.startsWith('/login')) return; // already there; nothing to do
  redirecting = true;
  window.location.replace(expired ? '/login?expired=1' : '/login');
};
