import { NextResponse } from "next/server";
import { fetchProperties, MainAppError } from "@/lib/mainApp";
import { countImages } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/properties
 * Returns the property list from the main app, each annotated with the number
 * of images stored in the Vault. The shared API key never leaves the server.
 */
export async function GET() {
  try {
    const properties = await fetchProperties();

    const withCounts = await Promise.all(
      properties.map(async (p) => ({
        ...p,
        imageCount: await countImages(p.id),
      })),
    );

    return NextResponse.json({ properties: withCounts });
  } catch (err) {
    if (err instanceof MainAppError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status === 401 || err.status === 403 ? 401 : err.status },
      );
    }
    return NextResponse.json(
      { error: "Unexpected error loading properties." },
      { status: 500 },
    );
  }
}
