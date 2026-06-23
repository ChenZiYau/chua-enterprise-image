/**
 * Minimal client-side auth gate.
 *
 * v1 has no server sessions — access is gated by a localStorage flag. This is
 * intentionally lightweight; swap for real auth (NextAuth, Clerk, …) later
 * without touching callers, as long as these three helpers keep their shape.
 */

const AUTH_KEY = "chua.vault.auth";

/** True when the user has signed in (or continued as guest) on this device. */
export function isAuthed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(AUTH_KEY) === "1";
  } catch {
    return false;
  }
}

/** Mark the current device as signed in. */
export function signIn(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(AUTH_KEY, "1");
  } catch {
    /* storage unavailable — ignore */
  }
}

/** Clear the signed-in flag. */
export function signOut(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(AUTH_KEY);
  } catch {
    /* storage unavailable — ignore */
  }
}
