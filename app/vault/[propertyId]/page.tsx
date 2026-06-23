"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import CropModal from "@/components/CropModal";
import {
  ArrowLeftIcon,
  CropIcon,
  ImageIcon,
  PlusIcon,
  SaveIcon,
  UploadIcon,
  XIcon,
} from "@/components/icons";
import type { CropInfo, ImageEntry, Property, PropertyIndex } from "@/lib/types";

/** Working state for one image entry card (richer than the persisted shape). */
interface Card {
  id: string;
  title: string;
  description: string;
  /** Remote URL of the uploaded original ("" until first upload). */
  originalUrl: string;
  /** Pending local original to upload on save. */
  originalBlob: Blob | null;
  /** Source usable for preview + cropping (object URL or remote). */
  originalSrc: string;
  /** Pending cropped blob to upload on save. */
  croppedBlob: Blob | null;
  /** Cropped preview source (object URL or remote) when a crop is active. */
  croppedSrc: string | null;
  /** Remote cropped URL already saved (so we can keep it without re-upload). */
  croppedUrl: string;
  crop: CropInfo | null;
  hasImage: boolean;
}

function newCard(): Card {
  return {
    id: crypto.randomUUID(),
    title: "",
    description: "",
    originalUrl: "",
    originalBlob: null,
    originalSrc: "",
    croppedBlob: null,
    croppedSrc: null,
    croppedUrl: "",
    crop: null,
    hasImage: false,
  };
}

function cardFromEntry(e: ImageEntry): Card {
  const isCropped = !!e.imageUrl && e.imageUrl !== e.originalUrl;
  return {
    id: e.id || crypto.randomUUID(),
    title: e.title ?? "",
    description: e.description ?? "",
    originalUrl: e.originalUrl ?? e.imageUrl ?? "",
    originalBlob: null,
    originalSrc: e.originalUrl ?? e.imageUrl ?? "",
    croppedBlob: null,
    croppedSrc: isCropped ? e.imageUrl : null,
    croppedUrl: isCropped ? e.imageUrl : "",
    crop: e.crop ?? null,
    hasImage: !!(e.imageUrl || e.originalUrl),
  };
}

export default function ImageManagerPage() {
  return (
    <AuthGuard>
      <ImageManager />
    </AuthGuard>
  );
}

function ImageManager() {
  const params = useParams<{ propertyId: string }>();
  const propertyId = decodeURIComponent(params.propertyId);

  const [property, setProperty] = useState<Property | null>(null);
  const [cards, setCards] = useState<Card[]>([newCard()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cropCardId, setCropCardId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(
    null,
  );

  // Load property meta + saved images.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [propsRes, imgRes] = await Promise.all([
          fetch("/api/properties"),
          fetch(`/api/images/${encodeURIComponent(propertyId)}`),
        ]);
        const propsData = await propsRes.json().catch(() => ({}));
        const imgData: PropertyIndex | null = imgRes.ok
          ? await imgRes.json().catch(() => null)
          : null;
        if (!active) return;

        const found: Property | undefined = (propsData.properties ?? []).find(
          (p: Property) => p.id === propertyId,
        );
        setProperty(found ?? null);

        if (imgData && imgData.images.length > 0) {
          setCards(imgData.images.map(cardFromEntry));
        }
      } catch {
        /* leave the single blank card */
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [propertyId]);

  function patchCard(id: string, patch: Partial<Card>) {
    setCards((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function addCard() {
    setCards((cs) => [...cs, newCard()]);
  }

  function removeCard(id: string) {
    setCards((cs) => (cs.length <= 1 ? cs : cs.filter((c) => c.id !== id)));
  }

  function onSelectFile(id: string, file: File) {
    const src = URL.createObjectURL(file);
    patchCard(id, {
      originalBlob: file,
      originalSrc: src,
      originalUrl: "",
      croppedBlob: null,
      croppedSrc: null,
      croppedUrl: "",
      crop: null,
      hasImage: true,
    });
  }

  function onCropApply(id: string, blob: Blob, info: CropInfo) {
    const src = URL.createObjectURL(blob);
    patchCard(id, {
      croppedBlob: blob,
      croppedSrc: src,
      croppedUrl: "",
      crop: info,
    });
    setCropCardId(null);
  }

  async function uploadBlob(
    blob: Blob,
    id: string,
    kind: "original" | "cropped",
  ): Promise<string> {
    const form = new FormData();
    form.append("file", blob);
    form.append("propertyId", propertyId);
    form.append("id", id);
    form.append("kind", kind);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error ?? "Upload failed.");
    return data.url as string;
  }

  async function saveAll() {
    setSaving(true);
    setToast(null);
    try {
      const entries: ImageEntry[] = [];
      for (const card of cards) {
        let originalUrl = card.originalUrl;
        if (card.originalBlob) {
          originalUrl = await uploadBlob(card.originalBlob, card.id, "original");
        }

        let imageUrl = originalUrl;
        if (card.croppedBlob) {
          imageUrl = await uploadBlob(card.croppedBlob, card.id, "cropped");
        } else if (card.croppedUrl) {
          imageUrl = card.croppedUrl;
        }

        entries.push({
          id: card.id,
          title: card.title.trim(),
          description: card.description.trim(),
          imageUrl,
          originalUrl,
          crop: card.crop,
          updatedAt: new Date().toISOString(),
        });
      }

      const res = await fetch(
        `/api/images/${encodeURIComponent(propertyId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ images: entries }),
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Could not save.");
      }

      // Reflect uploaded URLs back into local state (clears pending blobs).
      setCards(entries.map(cardFromEntry));
      setToast({ kind: "ok", msg: "All images saved." });
    } catch (err) {
      setToast({
        kind: "err",
        msg: err instanceof Error ? err.message : "Save failed.",
      });
    } finally {
      setSaving(false);
    }
  }

  const imageCount = useMemo(
    () => cards.filter((c) => c.hasImage).length,
    [cards],
  );

  const cropCard = cards.find((c) => c.id === cropCardId) ?? null;

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      {/* Sticky sub-header */}
      <div
        className="sticky top-14 z-20 -mx-5 mb-6 border-b px-5 py-3 backdrop-blur"
        style={{
          borderColor: "var(--border-soft)",
          background: "color-mix(in srgb, var(--background) 85%, transparent)",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <Link
              href="/vault"
              className="inline-flex items-center gap-1 text-xs font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              <ArrowLeftIcon size={14} /> Properties
            </Link>
            <h1 className="mt-0.5 truncate text-xl font-semibold tracking-tight">
              {property?.name ?? (loading ? "Loading…" : "Property")}
            </h1>
          </div>
          <button
            className="ui-btn ui-btn-primary shrink-0"
            onClick={saveAll}
            disabled={saving}
          >
            <SaveIcon size={15} />
            {saving ? "Saving…" : "Save all"}
          </button>
        </div>
      </div>

      {toast && (
        <div
          className="mb-4 rounded-[var(--radius-md)] border px-4 py-2.5 text-sm"
          style={{
            borderColor:
              toast.kind === "ok"
                ? "rgba(47,158,111,.35)"
                : "rgba(211,84,84,.35)",
            background:
              toast.kind === "ok"
                ? "rgba(47,158,111,.10)"
                : "rgba(211,84,84,.10)",
            color: toast.kind === "ok" ? "var(--success)" : "var(--danger)",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Cards list — scrolls past ~3 entries so the page stays bounded. */}
      <div
        className={cards.length > 3 ? "overflow-y-auto pr-1" : ""}
        style={cards.length > 3 ? { maxHeight: "56vh" } : undefined}
      >
        <div className="space-y-4">
          {cards.map((card, i) => (
            <ImageCard
              key={card.id}
              card={card}
              index={i}
              canRemove={cards.length > 1}
              onChange={(patch) => patchCard(card.id, patch)}
              onSelectFile={(file) => onSelectFile(card.id, file)}
              onRemove={() => removeCard(card.id)}
              onCrop={() => setCropCardId(card.id)}
            />
          ))}
        </div>
      </div>

      {/* Add image */}
      <button
        type="button"
        onClick={addCard}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-dashed py-4 text-sm font-medium transition hover:bg-[var(--surface-muted)]"
        style={{ borderColor: "var(--border-strong)", color: "var(--accent)" }}
      >
        <PlusIcon size={16} /> Add Image
      </button>

      {/* Footer count */}
      <p
        className="mt-6 text-center text-sm"
        style={{ color: "var(--text-muted)" }}
      >
        {imageCount} {imageCount === 1 ? "image" : "images"} for this property
      </p>

      {cropCard && cropCard.originalSrc && (
        <CropModal
          src={cropCard.originalSrc}
          initial={cropCard.crop}
          onCancel={() => setCropCardId(null)}
          onApply={(blob, info) => onCropApply(cropCard.id, blob, info)}
        />
      )}
    </main>
  );
}

/* --------------------------- ImageCard --------------------------- */

interface ImageCardProps {
  card: Card;
  index: number;
  canRemove: boolean;
  onChange: (patch: Partial<Card>) => void;
  onSelectFile: (file: File) => void;
  onRemove: () => void;
  onCrop: () => void;
}

function ImageCard({
  card,
  index,
  canRemove,
  onChange,
  onSelectFile,
  onRemove,
  onCrop,
}: ImageCardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const preview = card.croppedSrc ?? (card.hasImage ? card.originalSrc : null);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (file && file.type.startsWith("image/")) onSelectFile(file);
  }

  return (
    <div className="ui-card relative p-4 sm:p-5">
      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        aria-label="Remove image"
        className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-md disabled:opacity-30"
        style={{ color: "var(--text-muted)" }}
      >
        <XIcon size={16} />
      </button>

      <p className="ui-kicker mb-3">Image {index + 1}</p>

      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        {/* Upload / preview zone */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            className="grid aspect-square w-full place-items-center overflow-hidden rounded-[var(--radius-md)] border border-dashed transition"
            style={{
              borderColor: dragOver ? "var(--accent)" : "var(--border-strong)",
              background: dragOver
                ? "var(--accent-soft)"
                : "var(--surface-muted)",
            }}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt={card.title || "Preview"}
                className="h-full w-full object-cover"
              />
            ) : (
              <span
                className="flex flex-col items-center gap-1.5 px-3 text-center"
                style={{ color: "var(--text-faint)" }}
              >
                <UploadIcon size={20} />
                <span className="text-xs">Click or drop image</span>
              </span>
            )}
          </button>

          {card.hasImage && (
            <button
              type="button"
              onClick={onCrop}
              className="ui-btn mt-2 w-full"
            >
              <CropIcon size={15} /> Crop / Resize
            </button>
          )}
        </div>

        {/* Fields */}
        <div className="space-y-3">
          <div>
            <label className="ui-label" htmlFor={`title-${card.id}`}>
              Image title
            </label>
            <input
              id={`title-${card.id}`}
              type="text"
              value={card.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="e.g. Master bedroom"
              className="ui-field"
            />
          </div>
          <div>
            <label className="ui-label" htmlFor={`desc-${card.id}`}>
              Description
            </label>
            <textarea
              id={`desc-${card.id}`}
              value={card.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="Notes about this photo…"
              rows={3}
              className="ui-field resize-y"
            />
          </div>
          {card.crop && (
            <p
              className="flex items-center gap-1.5 text-xs"
              style={{ color: "var(--text-muted)" }}
            >
              <ImageIcon size={12} />
              Cropped to {card.crop.width}×{card.crop.height}px
              {card.crop.aspect !== "free" ? ` (${card.crop.aspect})` : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
