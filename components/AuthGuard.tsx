"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthed, signOut } from "@/lib/auth";
import { HouseIcon } from "./icons";

/**
 * Client gate: renders children only when signed in, otherwise bounces to
 * /login. Also provides a slim top bar with the brand mark and a sign-out.
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isAuthed()) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) {
    return (
      <main className="min-h-screen grid place-items-center">
        <p className="ui-kicker">Loading…</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <header
        className="sticky top-0 z-30 border-b backdrop-blur"
        style={{
          borderColor: "var(--border-soft)",
          background: "color-mix(in srgb, var(--background) 85%, transparent)",
        }}
      >
        <div className="mx-auto max-w-6xl px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className="grid h-7 w-7 place-items-center rounded-lg"
              style={{ background: "var(--accent)" }}
            >
              <HouseIcon size={16} className="text-white" />
            </span>
            <span className="text-sm font-semibold tracking-tight">
              Chua Enterprise — Image Vault
            </span>
          </div>
          <button
            className="ui-btn"
            onClick={() => {
              signOut();
              router.replace("/login");
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}
