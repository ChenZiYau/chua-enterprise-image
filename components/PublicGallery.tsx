"use client";

import { useCallback, useEffect, useState } from "react";
import type { ImageEntry, Property } from "@/lib/types";

/**
 * Customer-facing gallery: hero photo, tappable grid, fullscreen lightbox.
 * Mobile-first — these links are opened from WhatsApp far more often than
 * from a desktop browser.
 */
export default function PublicGallery({
  property,
  images,
}: {
  property: Property | null;
  images: ImageEntry[];
}) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  const close = useCallback(() => setLightbox(null), []);
  const step = useCallback(
    (dir: 1 | -1) => {
      setLightbox((cur) =>
        cur === null ? cur : (cur + dir + images.length) % images.length,
      );
    },
    [images.length],
  );

  // Keyboard navigation while the lightbox is open.
  useEffect(() => {
    if (lightbox === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, close, step]);

  const title = property?.name ?? "Property Photos";
  const [hero, ...rest] = images;

  if (images.length === 0) {
    return (
      <main className="mx-auto grid min-h-[70vh] max-w-lg place-items-center px-5 text-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
            Photos for this property haven&apos;t been added yet — please check
            back soon.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">
      {/* Header */}
      <header className="mb-5">
        <p className="ui-kicker">Chua Enterprise</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          {title}
        </h1>
        {property?.city && (
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {property.city}
          </p>
        )}
      </header>

      {/* Hero — the first photo doubles as the gallery cover */}
      <button
        type="button"
        onClick={() => setLightbox(0)}
        className="block w-full overflow-hidden rounded-[var(--radius-lg)]"
        aria-label={hero.title || "Open photo"}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hero.imageUrl}
          alt={hero.title || title}
          className="aspect-[16/10] w-full object-cover"
        />
      </button>
      {(hero.title || hero.description) && (
        <Caption title={hero.title} description={hero.description} />
      )}

      {/* Grid of remaining photos */}
      {rest.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {rest.map((img, i) => (
            <figure key={img.id}>
              <button
                type="button"
                onClick={() => setLightbox(i + 1)}
                className="block w-full overflow-hidden rounded-[var(--radius-md)]"
                aria-label={img.title || `Photo ${i + 2}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.imageUrl}
                  alt={img.title || `Photo ${i + 2}`}
                  loading="lazy"
                  className="aspect-square w-full object-cover transition hover:opacity-90"
                />
              </button>
              {img.title && (
                <figcaption
                  className="mt-1 truncate text-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {img.title}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}

      <footer
        className="mt-10 border-t pt-5 text-center text-xs"
        style={{ borderColor: "var(--border-soft)", color: "var(--text-faint)" }}
      >
        {images.length} {images.length === 1 ? "photo" : "photos"} · Chua
        Enterprise
      </footer>

      {/* Lightbox */}
      {lightbox !== null && images[lightbox] && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: "rgba(10,11,14,0.94)" }}
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm tabular-nums" style={{ color: "rgba(255,255,255,0.7)" }}>
              {lightbox + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="grid h-9 w-9 place-items-center rounded-full text-lg"
              style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}
            >
              ×
            </button>
          </div>

          <div
            className="flex min-h-0 flex-1 items-center justify-center px-3"
            onClick={(e) => e.stopPropagation()}
          >
            <NavButton dir={-1} onClick={() => step(-1)} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[lightbox].imageUrl}
              alt={images[lightbox].title || `Photo ${lightbox + 1}`}
              className="max-h-full max-w-full rounded-md object-contain"
            />
            <NavButton dir={1} onClick={() => step(1)} />
          </div>

          <div
            className="px-5 py-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {images[lightbox].title && (
              <p className="text-sm font-medium" style={{ color: "#fff" }}>
                {images[lightbox].title}
              </p>
            )}
            {images[lightbox].description && (
              <p className="mt-1 text-xs" style={{ color: "rgba(255,255,255,0.65)" }}>
                {images[lightbox].description}
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function Caption({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-2">
      {title && <p className="text-sm font-medium">{title}</p>}
      {description && (
        <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
          {description}
        </p>
      )}
    </div>
  );
}

function NavButton({ dir, onClick }: { dir: 1 | -1; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === 1 ? "Next photo" : "Previous photo"}
      className="mx-2 hidden h-10 w-10 shrink-0 place-items-center rounded-full text-xl sm:grid"
      style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}
    >
      {dir === 1 ? "›" : "‹"}
    </button>
  );
}
