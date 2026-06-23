/**
 * Storage layer (server-only).
 *
 * v1 persists everything in Vercel Blob:
 *   - image binaries live at `vault/<propertyId>/img/<id>...`
 *   - per-property metadata lives in a single JSON index at
 *     `vault/<propertyId>/index.json`
 *
 * Everything the rest of the app touches goes through this module, so the
 * backend can later be swapped for Vercel KV / a database without changing
 * callers — keep the exported function signatures stable.
 */

import { put, list, del } from "@vercel/blob";
import type { ImageEntry, PropertyIndex } from "./types";

/** Deterministic pathname for a property's metadata index. */
function indexPath(propertyId: string): string {
  return `vault/${encodeURIComponent(propertyId)}/index.json`;
}

/** Folder prefix for a property's uploaded image binaries. */
function imagePrefix(propertyId: string): string {
  return `vault/${encodeURIComponent(propertyId)}/img/`;
}

function emptyIndex(propertyId: string): PropertyIndex {
  return { propertyId, images: [], updatedAt: new Date().toISOString() };
}

/**
 * Load the metadata index for one property.
 * Returns an empty index when nothing has been saved yet.
 */
export async function getIndex(propertyId: string): Promise<PropertyIndex> {
  const path = indexPath(propertyId);

  // Find the index blob (pathname is deterministic because we disable the
  // random suffix on write).
  const { blobs } = await list({ prefix: path, limit: 1 });
  const blob = blobs.find((b) => b.pathname === path);
  if (!blob) return emptyIndex(propertyId);

  const res = await fetch(blob.url, { cache: "no-store" });
  if (!res.ok) return emptyIndex(propertyId);

  try {
    const data = (await res.json()) as PropertyIndex;
    if (!Array.isArray(data.images)) return emptyIndex(propertyId);
    return { ...emptyIndex(propertyId), ...data, propertyId };
  } catch {
    return emptyIndex(propertyId);
  }
}

/** Persist the full set of image entries for a property. */
export async function saveIndex(
  propertyId: string,
  images: ImageEntry[],
): Promise<PropertyIndex> {
  const index: PropertyIndex = {
    propertyId,
    images,
    updatedAt: new Date().toISOString(),
  };

  await put(indexPath(propertyId), JSON.stringify(index, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });

  return index;
}

/**
 * Upload an image binary for a property and return its public Blob URL.
 * `kind` separates originals from cropped derivatives for easier debugging.
 */
export async function uploadImage(
  propertyId: string,
  file: File | Blob,
  opts: { id: string; kind: "original" | "cropped"; contentType?: string },
): Promise<string> {
  const ext = guessExtension(opts.contentType ?? (file as File).type);
  const pathname = `${imagePrefix(propertyId)}${opts.id}-${opts.kind}.${ext}`;

  const { url } = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: opts.contentType ?? (file as File).type ?? undefined,
  });
  return url;
}

/** Quick image-count for a property (used on the Properties grid). */
export async function countImages(propertyId: string): Promise<number> {
  try {
    return (await getIndex(propertyId)).images.length;
  } catch {
    return 0;
  }
}

/** Delete a previously uploaded blob by URL (best-effort). */
export async function deleteBlob(url: string): Promise<void> {
  try {
    await del(url);
  } catch {
    /* best-effort cleanup — ignore failures */
  }
}

function guessExtension(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/avif":
      return "avif";
    case "image/jpeg":
    case "image/jpg":
    default:
      return "jpg";
  }
}
