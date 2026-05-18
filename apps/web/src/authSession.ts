import type { StoredAuthSession } from "./types";

const authStorageKey = "koopcare-demo-auth-session";

export function readStoredAuthSession(): StoredAuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(authStorageKey);

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as StoredAuthSession;

    if (
      !parsed?.token ||
      !parsed.session?.role ||
      !parsed.session?.userId ||
      new Date(parsed.session.expiresAt).getTime() <= Date.now()
    ) {
      clearStoredAuthSession();
      return null;
    }

    return parsed;
  } catch {
    clearStoredAuthSession();
    return null;
  }
}

export function saveStoredAuthSession(session: StoredAuthSession) {
  window.localStorage.setItem(authStorageKey, JSON.stringify(session));
}

export function clearStoredAuthSession() {
  window.localStorage.removeItem(authStorageKey);
}
