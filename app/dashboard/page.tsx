import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { BecomeDeveloperButton } from "./become-developer-button";
import { Plus } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: apps } = profile?.is_developer
    ? await supabase
        .from("apps")
        .select(`
          *,
          app_versions (
            ai_safety_score,
            created_at
          )
        `)
        .eq("developer_id", user.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  const appsWithScore = (apps ?? []).map((app: { id: string; icon_url?: string | null; title: string; platform: string; app_versions?: Array<{ ai_safety_score: number | null; created_at: string }> }) => {
    const versions = (app.app_versions ?? []) as Array<{
      ai_safety_score: number | null;
      created_at: string;
    }>;
    const latest = versions.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
    return { ...app, latestScore: latest?.ai_safety_score ?? null };
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Welcome back{profile?.username ? `, ${profile.username}` : ""}
          </h1>
          <p className="mt-1 text-zinc-400">
            {profile?.is_developer
              ? "Manage your apps and track performance"
              : "Become a developer to publish your apps"}
          </p>
        </div>
        {profile?.is_developer && (
          <Link
            href="/dashboard/new"
            className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200"
          >
            <Plus className="h-4 w-4" />
            Create New App
          </Link>
        )}
      </div>

      {!profile?.is_developer && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-medium text-white">Become a Developer</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Upgrade your account to publish apps to the marketplace. You&apos;ll be able to upload APK and IPA files
            and manage your app listings.
          </p>
          <BecomeDeveloperButton userId={user.id} />
        </div>
      )}

      {profile?.is_developer && (
        <div>
          <h2 className="mb-4 text-lg font-medium text-white">Your Apps</h2>
          {appsWithScore.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {appsWithScore.map((app) => (
                <Link
                  key={app.id}
                  href={`/dashboard/apps/${app.id}`}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition hover:border-zinc-700 hover:bg-zinc-900"
                >
                  <div className="flex items-start gap-4">
                    {app.icon_url ? (
                      <img
                        src={app.icon_url}
                        alt=""
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-800 text-zinc-500">
                        📱
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-white truncate">{app.title}</h3>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="text-xs text-zinc-500">{app.platform}</p>
                        {app.latestScore != null && (
                          <span
                            className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                              app.latestScore > 80
                                ? "bg-emerald-500/20 text-emerald-400"
                                : app.latestScore > 50
                                  ? "bg-amber-500/20 text-amber-400"
                                  : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {app.latestScore}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/30 p-12 text-center">
              <p className="text-zinc-400">You haven&apos;t published any apps yet.</p>
              <Link
                href="/dashboard/new"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white underline hover:no-underline"
              >
                <Plus className="h-4 w-4" />
                Upload your first app
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
