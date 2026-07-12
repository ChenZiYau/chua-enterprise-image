import { HouseIcon } from "@/components/icons";

/** Public landing. There is nothing to sign in to here — galleries are
 *  reached only via the per-property links shared from the dashboard, and
 *  photo management happens inside the dashboard itself. */
export default function Home() {
  return (
    <main className="min-h-screen grid place-items-center px-6">
      <div className="text-center">
        <span
          className="mx-auto grid h-12 w-12 place-items-center rounded-xl"
          style={{ background: "var(--accent)" }}
        >
          <HouseIcon size={24} className="text-white" />
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          Chua Enterprise — Image Vault
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          Property photo galleries are available through the private links you
          were sent. If you reached this page by accident, please use your
          gallery link.
        </p>
      </div>
    </main>
  );
}
