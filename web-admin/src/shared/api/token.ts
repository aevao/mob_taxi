const STORAGE_KEY = "whyp.admin.token";

type Listener = () => void;

let current = sessionStorage.getItem(STORAGE_KEY);
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
}

/**
 * Admin token lives in sessionStorage so closing the tab signs the admin out.
 * Subscribers (the session entity) re-render when it changes, e.g. on a 401.
 */
export const tokenStorage = {
  get: () => current,
  set(token: string) {
    current = token;
    sessionStorage.setItem(STORAGE_KEY, token);
    emit();
  },
  clear() {
    if (current === null) return;
    current = null;
    sessionStorage.removeItem(STORAGE_KEY);
    emit();
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};
