// Moved to trash - Phase 3: Replaced with Public Storefront
import Link from "next/link";

export default function OldLandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4">
      <main className="text-center">
        <h1 className="text-4xl font-bold text-white">Aura Store</h1>
        <p className="mt-4 text-lg text-zinc-400">
          App marketplace for developers
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/login"
            className="rounded-lg bg-white px-6 py-3 font-medium text-zinc-900 transition hover:bg-zinc-200"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-zinc-700 px-6 py-3 font-medium text-white transition hover:bg-zinc-800"
          >
            Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
