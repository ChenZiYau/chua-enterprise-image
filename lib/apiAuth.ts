import "server-only";
import { NextRequest } from "next/server";

/** True when the request carries the shared dashboard secret.
 *
 *  Every mutating/metadata API in the vault requires this — the only callers
 *  are the dashboard's server-side proxies. Browsers never hold the key, so
 *  the vault has no credential surface to attack; visitors only ever see the
 *  server-rendered public galleries at /p/<propertyId>. */
export function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.VAULT_API_KEY;
  if (!expected) return false; // unconfigured server accepts nothing

  const auth = req.headers.get("authorization") ?? "";
  const given = `Bearer ${expected}`;

  // Constant-time comparison.
  if (auth.length !== given.length) return false;
  let diff = 0;
  for (let i = 0; i < given.length; i++) {
    diff |= auth.charCodeAt(i) ^ given.charCodeAt(i);
  }
  return diff === 0;
}
