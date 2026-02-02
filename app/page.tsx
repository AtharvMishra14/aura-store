import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Storefront } from "./storefront";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: apps } = await supabase
    .from("apps")
    .select(`
      id,
      title,
      description,
      icon_url,
      category,
      platform,
      app_versions (
        id,
        version_string,
        file_url,
        file_size_bytes,
        download_count,
        created_at
      )
    `)
    .order("created_at", { ascending: false });

  const appsWithLatestVersion = (apps ?? []).map((app) => {
    const versions = (app.app_versions ?? []) as Array<{
      id: string;
      version_string: string;
      file_url: string;
      file_size_bytes: number;
      download_count: number;
      created_at: string;
    }>;
    const latest = versions.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
    return {
      ...app,
      latestVersion: latest,
    };
  });

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold text-white">
            Aura Store
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-zinc-400 transition hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200"
            >
              Developer Dashboard
            </Link>
          </div>
        </div>
      </header>

      <Storefront apps={appsWithLatestVersion} />
    </div>
  );
}
