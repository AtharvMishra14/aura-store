import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

const CATEGORY_MAP: Record<string, string> = {
  Productivity: "utilities",
  Games: "games",
  Social: "social",
};

export async function GET() {
  const supabase = await createClient();

  const { data: apps, error } = await supabase
    .from("apps")
    .select(
      `
      id,
      title,
      description,
      icon_url,
      category,
      platform,
      profiles!developer_id (username),
      app_versions (
        id,
        version_string,
        file_url,
        file_size_bytes,
        created_at
      )
    `
    )
    .in("platform", ["IOS", "BOTH"])
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const altStoreApps = (apps ?? []).map((app) => {
    const versions = (app.app_versions ?? []) as Array<{
      id: string;
      version_string: string;
      file_url: string;
      file_size_bytes: number;
      created_at: string;
    }>;

    const sortedVersions = [...versions].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    const developerName =
      (app.profiles as { username?: string } | null)?.username ?? "Unknown";

    return {
      name: app.title,
      bundleIdentifier: `com.aura.store.${app.id.replace(/-/g, "")}`,
      developerName,
      subtitle: (app.description as string).slice(0, 80),
      localizedDescription: app.description,
      iconURL: app.icon_url ?? "",
      category: CATEGORY_MAP[app.category as string] ?? "other",
      versions: sortedVersions.map((v) => ({
        version: v.version_string,
        buildVersion: "1",
        date: new Date(v.created_at).toISOString().split("T")[0],
        downloadURL: v.file_url,
        size: v.file_size_bytes,
      })),
    };
  });

  const source = {
    name: "Aura Store",
    identifier: "com.aura.store",
    subtitle: "The Open App Market",
    description: "Discover and download apps for iOS.",
    apps: altStoreApps,
    news: [],
  };

  return NextResponse.json(source, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300",
    },
  });
}
