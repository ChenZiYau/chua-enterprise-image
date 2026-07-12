/**
 * Server-only bridge to the main property-management dashboard.
 *
 * The Vault has no property database of its own — it asks the main app for the
 * canonical property list over an authenticated API. The shared secret
 * (`VAULT_API_KEY`) is read here and NEVER sent to the client.
 */

import type { Property } from "./types";

/** Error carrying an HTTP-ish status so callers can render precise UI states. */
export class MainAppError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "MainAppError";
    this.status = status;
  }
}

interface MainAppConfig {
  baseUrl: string;
  apiKey: string;
}

/** Read & validate required env vars. Throws a 500-style error if missing. */
function getConfig(): MainAppConfig {
  const baseUrl = process.env.MAIN_APP_URL;
  const apiKey = process.env.VAULT_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new MainAppError(
      "Server is not configured: set MAIN_APP_URL and VAULT_API_KEY.",
      500,
    );
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

/**
 * Fetch the property list from the main app.
 *
 * Expects the upstream to return an array of objects with at least
 * `{ id, name, shortName, city }`. We normalise loosely so small shape
 * differences upstream don't break the Vault.
 */
export async function fetchProperties(): Promise<Property[]> {
  const { baseUrl, apiKey } = getConfig();

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/vault/properties`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      // Properties change rarely; cache briefly to keep the Vault snappy.
      next: { revalidate: 60 },
    });
  } catch {
    throw new MainAppError("Could not reach the main app.", 502);
  }

  if (res.status === 401 || res.status === 403) {
    throw new MainAppError("API key was rejected by the main app.", res.status);
  }
  if (!res.ok) {
    throw new MainAppError(
      `Main app returned an error (${res.status}).`,
      res.status,
    );
  }

  const raw: unknown = await res.json();
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { properties?: unknown }).properties)
      ? (raw as { properties: unknown[] }).properties
      : [];

  return list
    .map(normaliseProperty)
    .filter((p): p is Property => p !== null);
}

function normaliseProperty(input: unknown): Property | null {
  if (typeof input !== "object" || input === null) return null;
  const obj = input as Record<string, unknown>;

  const id = str(obj.id ?? obj.pageId ?? obj.notionId);
  const name = str(obj.name ?? obj.title);
  if (!id || !name) return null;

  return {
    id,
    name,
    shortName: str(obj.shortName ?? obj.short ?? name),
    city: str(obj.city ?? obj.location ?? ""),
  };
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
