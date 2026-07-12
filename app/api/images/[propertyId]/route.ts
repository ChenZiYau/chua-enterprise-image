import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/apiAuth";
import { getIndex, saveIndex } from "@/lib/storage";
import type { ImageEntry } from "@/lib/types";

// Bearer-protected: only the dashboard's server-side proxies hold the shared
// VAULT_API_KEY. The public gallery pages read the index server-side via
// lib/storage directly and never touch this route.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ propertyId: string }>;
}

/** GET /api/images/[propertyId] — load saved image metadata for a property. */
export async function GET(req: NextRequest, ctx: RouteContext) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const { propertyId } = await ctx.params;
  try {
    const index = await getIndex(propertyId);
    return NextResponse.json(index);
  } catch {
    return NextResponse.json(
      { error: "Could not load images." },
      { status: 500 },
    );
  }
}

/** PUT /api/images/[propertyId] — persist the full image list for a property. */
export async function PUT(req: NextRequest, ctx: RouteContext) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const { propertyId } = await ctx.params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const images = (body as { images?: unknown }).images;
  if (!Array.isArray(images)) {
    return NextResponse.json(
      { error: "Body must include an `images` array." },
      { status: 400 },
    );
  }

  try {
    const saved = await saveIndex(propertyId, images as ImageEntry[]);
    return NextResponse.json(saved);
  } catch {
    return NextResponse.json(
      { error: "Could not save images." },
      { status: 500 },
    );
  }
}
