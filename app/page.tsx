import { createClient } from "@/utils/supabase/server";
import { Storefront } from "./storefront";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();

  // DIAGNOSTIC FETCH: We removed the 'is_published' filter to see if anything shows up
  const { data: apps, error } = await supabase
    .from("apps")
    .select(`
      *,
      latestVersion:app_versions!latest_version_id(*)
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase Error:", error.message);
  }

  // If this works, the apps will appear regardless of their 'published' status
  return <Storefront apps={apps || []} />;
}