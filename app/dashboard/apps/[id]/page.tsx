import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { ArrowLeft, Smartphone } from "lucide-react";
import { ReAnalyzeButton } from "@/app/components/re-analyze-button";
import { SecurityReportCard } from "@/app/components/security-report-card";

export default async function DashboardAppDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: app, error } = await supabase
    .from("apps")
    .select(
      `
      id,
      developer_id,
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
        ai_safety_score,
        ai_safety_summary,
        created_at
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !app) notFound();
  if (app.developer_id !== user.id) notFound();

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

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/apps"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to My Apps
      </Link>

      <div className="flex flex-col gap-6 md:flex-row md:items-start">
        <div className="shrink-0">
          {app.icon_url ? (
            <img
              src={app.icon_url}
              alt=""
              className="h-24 w-24 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-zinc-800">
              <Smartphone className="h-12 w-12 text-zinc-500" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-white">{app.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {app.platform} · {app.category}
          </p>

          <div className="mt-4">
            <Link
              href={`/app/${app.id}`}
              className="inline-block rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800"
            >
              View on Store
            </Link>
          </div>
        </div>
      </div>

      <SecurityReportCard
        score={latestVersion?.ai_safety_score ?? null}
        summary={latestVersion?.ai_safety_summary ?? null}
      />

      <ReAnalyzeButton appId={app.id} developerId={app.developer_id} />

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
                {v.ai_safety_score != null && (
                  <span
                    className={`ml-2 text-xs font-medium ${
                      v.ai_safety_score > 80
                        ? "text-emerald-400"
                        : v.ai_safety_score > 50
                          ? "text-amber-400"
                          : "text-red-400"
                    }`}
                  >
                    {v.ai_safety_score}/100
                  </span>
                )}
              </div>
              <span className="text-sm text-zinc-500">
                {new Date(v.created_at).toLocaleDateString()} · {v.download_count}{" "}
                downloads
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
