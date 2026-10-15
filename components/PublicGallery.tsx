"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ImageEntry, Property } from "@/lib/types";

/**
 * Customer-facing gallery: horizontal photo carousel and fullscreen lightbox.
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
  const [active, setActive] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const selected = useRef(0);

  function goTo(index: number) {
    const container = track.current;
    if (!container) return;
    container.scrollTo({
      left: Math.max(0, Math.min(index, images.length - 1)) * container.clientWidth,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    });
  }

  useEffect(() => {
    const container = track.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      container.scrollTo({ left: selected.current * container.clientWidth, behavior: "instant" });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [images.length]);

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

      <section
        aria-label="Property photos"
        aria-roledescription="carousel"
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            goTo(active + (event.key === "ArrowRight" ? 1 : -1));
          }
        }}
      >
        <div
          ref={track}
          tabIndex={0}
          aria-label="Swipe left or right to browse photos"
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-[var(--radius-lg)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={(event) => {
            const container = event.currentTarget;
            if (container.clientWidth) {
              const index = Math.max(0, Math.min(images.length - 1, Math.round(container.scrollLeft / container.clientWidth)));
              selected.current = index;
              setActive(index);
            }
          }}
        >
          {images.map((img, index) => (
            <div key={img.id} role="group" aria-roledescription="slide" aria-label={String(index + 1) + " of " + images.length} className="w-full shrink-0 snap-start snap-always">
              <button
                type="button"
                tabIndex={active === index ? 0 : -1}
                onClick={() => setLightbox(index)}
                className="block w-full overflow-hidden rounded-[var(--radius-lg)] bg-[var(--surface-subtle)]"
                aria-label={"Open " + (img.title || "photo " + (index + 1)) + " fullscreen"}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.imageUrl} alt={img.title || "Photo " + (index + 1)} loading={index === 0 ? "eager" : "lazy"} draggable={false} className="h-[min(60dvh,560px)] w-full object-contain" />
              </button>
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex items-center justify-between gap-3">
            <button type="button" className="ui-btn" disabled={active === 0} onClick={() => goTo(active - 1)} aria-label="Previous photo">&larr; Previous</button>
            <span className="text-xs tabular-nums" role="status">{active + 1} / {images.length}</span>
            <button type="button" className="ui-btn" disabled={active === images.length - 1} onClick={() => goTo(active + 1)} aria-label="Next photo">Next &rarr;</button>
          </div>
        )}
        <div className="h-24 overflow-y-auto" aria-live="polite">
          <Caption title={images[active]?.title ?? ""} description={images[active]?.description ?? ""} />
        </div>
      </section>

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
          aria-label="Fullscreen photos"
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
            style={{ touchAction: "pan-y pinch-zoom" }}
            onTouchStart={(event) => {
              const touch = event.touches[0];
              touchStart.current = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null;
            }}
            onTouchCancel={() => { touchStart.current = null; }}
            onTouchEnd={(event) => {
              const start = touchStart.current;
              touchStart.current = null;
              if (!start) return;
              const touch = event.changedTouches[0];
              const dx = touch.clientX - start.x;
              const dy = touch.clientY - start.y;
              if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <NavButton dir={-1} onClick={() => step(-1)} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[lightbox].imageUrl}
              alt={images[lightbox].title || `Photo ${lightbox + 1}`}
              className="min-w-0 max-h-full max-w-full flex-1 rounded-md object-contain"
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
      className="mx-2 grid h-10 w-10 shrink-0 place-items-center rounded-full text-xl"
      style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}
    >
      {dir === 1 ? "›" : "‹"}
    </button>
  );
}
