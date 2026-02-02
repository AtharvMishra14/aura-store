import { createClient } from "@/utils/supabase/server";
import { Storefront } from "./storefront";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();

  const { data: apps } = await supabase
    .from("apps")
    .select(`
      *,
      latestVersion:app_versions!latest_version_id(*)
    `)
    //.eq("is_published", true)
    .order("created_at", { ascending: false });

  // This just sends the data to the storefront. 
  // Storefront.tsx already has the Prism Header inside it.
  return <Storefront apps={apps || []} />;
}