import type { Metadata } from "next";
import { getIndex } from "@/lib/storage";
import { fetchProperties } from "@/lib/mainApp";
import type { ImageEntry, Property } from "@/lib/types";
import PublicGallery from "@/components/PublicGallery";

/**
 * Public, no-login gallery page — this is the link the dashboard's Share
 * section copies for customers. Deliberately free of any vault admin chrome.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ propertyId: string }>;
}

async function loadProperty(key: string): Promise<Property | null> {
  // The URL segment is either a property id or a custom slug set from the
  // dashboard. If the main app is unreachable the gallery must still render
  // for the customer (id-based links keep working via the fallback below).
  try {
    const properties = await fetchProperties();
    const lower = key.toLowerCase();
    return (
      properties.find(
        (p) => p.id === key || (p.slug && p.slug.toLowerCase() === lower),
      ) ?? null
    );
  } catch {
    return null;
  }
}

async function loadImages(propertyId: string): Promise<ImageEntry[]> {
  try {
    const index = await getIndex(propertyId);
    return index.images.filter((img) => !!img.imageUrl);
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { propertyId } = await params;
  const property = await loadProperty(decodeURIComponent(propertyId));
  return {
    title: property ? `${property.name} — Photos` : "Property Photos",
    description: property
      ? `Photo gallery of ${property.name}${property.city ? `, ${property.city}` : ""}.`
      : "Property photo gallery.",
  };
}

export default async function PublicGalleryPage({ params }: PageProps) {
  const { propertyId: raw } = await params;
  const key = decodeURIComponent(raw);

  // Resolve a slug to its canonical property id; blob storage is keyed by id.
  const property = await loadProperty(key);
  const images = await loadImages(property?.id ?? key);

  return <PublicGallery property={property} images={images} />;
}
