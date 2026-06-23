"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthed, signIn } from "@/lib/auth";
import { HouseIcon, EyeIcon, EyeOffIcon } from "@/components/icons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);

  // Already signed in → straight to the vault.
  useEffect(() => {
    if (isAuthed()) router.replace("/vault");
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // v1: any non-empty credentials sign you in (client-only gate).
    signIn();
    router.replace("/vault");
  }

  function continueAsGuest() {
    signIn();
    router.replace("/vault");
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      {/* Left — branded property photo */}
      <aside
        className="relative hidden lg:block overflow-hidden"
        style={{ background: "var(--sidebar)" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/login-property.jpg"
          alt="A Chua Enterprise property"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(15,17,22,.10), rgba(15,17,22,.55) 60%, rgba(15,17,22,.85))",
          }}
        />

        {/* Brand mark */}
        <div className="absolute top-8 left-8 flex items-center gap-3">
          <span
            className="grid h-8 w-8 place-items-center rounded-lg"
            style={{ background: "var(--accent)" }}
          >
            <HouseIcon size={18} className="text-white" />
          </span>
          <span className="text-white font-semibold tracking-tight">
            Chua Enterprise — Image Vault
          </span>
        </div>

        {/* Bottom caption */}
        <div className="absolute bottom-10 left-8 right-8">
          <p
            className="text-white/70"
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              fontWeight: 600,
            }}
          >
            Property Media
          </p>
          <h2 className="mt-3 text-3xl lg:text-4xl font-semibold text-white leading-tight max-w-md">
            Every photo, every property, in one place.
          </h2>
        </div>
      </aside>

      {/* Right — sign-in form */}
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Brand mark (mobile only, since the left panel is hidden) */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span
              className="grid h-8 w-8 place-items-center rounded-lg"
              style={{ background: "var(--accent)" }}
            >
              <HouseIcon size={18} className="text-white" />
            </span>
            <span className="font-semibold tracking-tight">
              Chua Enterprise — Image Vault
            </span>
          </div>

          <p className="ui-kicker">Welcome back</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Access your property image vault.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="ui-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@chua.com"
                className="ui-field"
                style={{ paddingLeft: "0.75rem" }}
              />
            </div>

            <div>
              <label htmlFor="password" className="ui-label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="ui-field"
                  style={{ paddingLeft: "0.75rem", paddingRight: "2.75rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center h-8 w-8 rounded-md"
                  style={{ color: "var(--text-muted)" }}
                >
                  {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm select-none" style={{ color: "var(--text-secondary)" }}>
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                className="h-4 w-4 rounded"
                style={{ accentColor: "var(--accent)" }}
              />
              Keep me signed in
            </label>

            <button type="submit" className="ui-btn ui-btn-primary w-full">
              Sign in
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1" style={{ background: "var(--border)" }} />
            <span className="text-xs" style={{ color: "var(--text-faint)" }}>
              or
            </span>
            <span className="h-px flex-1" style={{ background: "var(--border)" }} />
          </div>

          <button onClick={continueAsGuest} className="ui-btn w-full">
            Continue as guest
          </button>
        </div>
      </section>
    </main>
  );
}
