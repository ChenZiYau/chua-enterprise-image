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

async function loadProperty(propertyId: string): Promise<Property | null> {
  // The property name is cosmetic here — if the main app is unreachable the
  // gallery must still render for the customer.
  try {
    const properties = await fetchProperties();
    return properties.find((p) => p.id === propertyId) ?? null;
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
  const propertyId = decodeURIComponent(raw);

  const [property, images] = await Promise.all([
    loadProperty(propertyId),
    loadImages(propertyId),
  ]);

  return <PublicGallery property={property} images={images} />;
}
