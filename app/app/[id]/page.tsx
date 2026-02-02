import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { ArrowLeft, Smartphone } from "lucide-react";
import { AppDetailsClient } from "./app-details-client";
import { SecurityReportCard } from "@/app/components/security-report-card";

export default async function AppDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: app, error } = await supabase
    .from("apps")
    .select(
      `
      id,
      title,
      description,
      icon_url,
      category,
      platform,
      created_at,
      profiles!developer_id (username),
      app_versions (
        id,
        version_string,
        file_url,
        file_size_bytes,
        download_count,
        ai_safety_score,
        ai_safety_summary,
        created_at
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !app) notFound();

  const versions = (app.app_versions ?? []) as Array<{
    id: string;
    version_string: string;
    file_url: string;
    file_size_bytes: number;
    download_count: number;
    ai_safety_score: number | null;
    ai_safety_summary: string | null;
    created_at: string;
  }>;

  const sortedVersions = [...versions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const latestVersion = sortedVersions[0];
  const developerName = (app.profiles as { username?: string } | null)?.username ?? "Unknown";

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-zinc-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Store
          </Link>
          <Link href="/" className="text-xl font-bold text-white">
            Aura Store
          </Link>
          <div className="w-24" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-start">
          <div className="shrink-0">
            {app.icon_url ? (
              <img
                src={app.icon_url}
                alt=""
                className="h-32 w-32 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-zinc-800">
                <Smartphone className="h-16 w-16 text-zinc-500" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">{app.title}</h1>
            <p className="mt-1 text-zinc-400">by {developerName}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300">
                {app.category}
              </span>
              <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300">
                {app.platform}
              </span>
            </div>

            <AppDetailsClient
              app={{
                id: app.id,
                title: app.title,
                platform: app.platform,
                latestVersion,
                allVersions: sortedVersions,
              }}
            />
          </div>
        </div>

        <div className="mt-12 space-y-8">
          <section>
            <h2 className="text-lg font-semibold text-white">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-zinc-400">
              {app.description}
            </p>
          </section>

          <SecurityReportCard
            score={latestVersion?.ai_safety_score ?? null}
            summary={latestVersion?.ai_safety_summary ?? null}
          />

          <section>
            <h2 className="text-lg font-semibold text-white">Version History</h2>
            <div className="mt-4 space-y-3">
              {sortedVersions.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 px-4 py-3"
                >
                  <div>
                    <span className="font-medium text-white">{v.version_string}</span>
                    <span className="ml-2 text-sm text-zinc-500">
                      {(v.file_size_bytes / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                  <span className="text-sm text-zinc-500">
                    {new Date(v.created_at).toLocaleDateString()} · {v.download_count} downloads
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
