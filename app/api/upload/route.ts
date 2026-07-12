import { NextRequest, NextResponse } from "next/server";
import { isAuthorized } from "@/lib/apiAuth";
import { uploadImage } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Allow reasonably large photos.
export const maxDuration = 30;

/**
 * POST /api/upload — bearer-protected (shared VAULT_API_KEY); only the
 * dashboard's server-side upload proxy calls this.
 * multipart/form-data: { file, propertyId, id, kind }
 * Stores the binary in Vercel Blob and returns its public URL.
 */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = form.get("file");
  const propertyId = form.get("propertyId");
  const id = form.get("id");
  const kind = form.get("kind");

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }
  if (typeof propertyId !== "string" || !propertyId) {
    return NextResponse.json({ error: "Missing propertyId." }, { status: 400 });
  }
  if (typeof id !== "string" || !id) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }

  const safeKind = kind === "cropped" ? "cropped" : "original";

  try {
    const url = await uploadImage(propertyId, file, {
      id,
      kind: safeKind,
      contentType: file.type || "image/jpeg",
    });
    return NextResponse.json({ url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
