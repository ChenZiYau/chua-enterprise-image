"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { SearchIcon, ImageIcon } from "@/components/icons";
import type { Property } from "@/lib/types";

interface PropertyWithCount extends Property {
  imageCount: number;
}

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; properties: PropertyWithCount[] };

export default function VaultPage() {
  return (
    <AuthGuard>
      <Properties />
    </AuthGuard>
  );
}

function Properties() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/properties");
        const data = await res.json();
        if (!active) return;
        if (!res.ok) {
          setState({
            status: "error",
            message: data?.error ?? "Could not load properties.",
          });
          return;
        }
        setState({ status: "ready", properties: data.properties ?? [] });
      } catch {
        if (active) {
          setState({ status: "error", message: "Network error." });
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    if (state.status !== "ready") return [];
    const q = query.trim().toLowerCase();
    if (!q) return state.properties;
    return state.properties.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.shortName.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q),
    );
  }, [state, query]);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="ui-kicker">Image Vault</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Properties
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Choose a property to manage its photos.
          </p>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <SearchIcon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-faint)" }}
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search properties…"
            className="ui-input"
          />
        </div>
      </div>

      <div className="mt-8">
        {state.status === "loading" && <SkeletonGrid />}

        {state.status === "error" && (
          <ErrorState message={state.message} />
        )}

        {state.status === "ready" && filtered.length === 0 && (
          <div
            className="ui-card grid place-items-center py-16 text-center"
            style={{ color: "var(--text-muted)" }}
          >
            <p className="text-sm">
              {query ? "No properties match your search." : "No properties found."}
            </p>
          </div>
        )}

        {state.status === "ready" && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <Link
                key={p.id}
                href={`/vault/${encodeURIComponent(p.id)}`}
                className="ui-card group p-5 transition hover:shadow-[var(--shadow-md)]"
                style={{ display: "block" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold tracking-tight truncate">
                      {p.name}
                    </h3>
                    <p
                      className="mt-0.5 text-sm truncate"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {p.city || "—"}
                    </p>
                  </div>
                  <span className="ui-chip shrink-0">
                    <ImageIcon size={12} />
                    {p.imageCount}
                  </span>
                </div>
                <div
                  className="mt-5 text-sm font-medium transition group-hover:translate-x-0.5"
                  style={{ color: "var(--accent)" }}
                >
                  Manage images →
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="ui-card p-5">
          <div
            className="h-4 w-2/3 rounded animate-pulse"
            style={{ background: "var(--surface-subtle)" }}
          />
          <div
            className="mt-3 h-3 w-1/3 rounded animate-pulse"
            style={{ background: "var(--surface-subtle)" }}
          />
          <div
            className="mt-6 h-3 w-1/2 rounded animate-pulse"
            style={{ background: "var(--surface-subtle)" }}
          />
        </div>
      ))}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="ui-card p-8 text-center">
      <div
        className="mx-auto grid h-11 w-11 place-items-center rounded-full"
        style={{ background: "rgba(211,84,84,.12)", color: "var(--danger)" }}
      >
        !
      </div>
      <h3 className="mt-4 font-semibold">Couldn’t load properties</h3>
      <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
        {message}
      </p>
      <button
        className="ui-btn mt-5"
        onClick={() => window.location.reload()}
      >
        Try again
      </button>
    </div>
  );
}
