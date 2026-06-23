"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthed } from "@/lib/auth";

/** Root: route to the vault when signed in, otherwise to login. */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(isAuthed() ? "/vault" : "/login");
  }, [router]);

  return (
    <main className="min-h-screen grid place-items-center">
      <p className="ui-kicker">Loading…</p>
    </main>
  );
}
