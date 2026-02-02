import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ versionId: string }> }
) {
  const { versionId } = await params;

  if (!versionId) {
    return NextResponse.json({ error: "Missing version ID" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: version, error: fetchError } = await supabase
    .from("app_versions")
    .select("file_url, download_count")
    .eq("id", versionId)
    .single();

  if (fetchError || !version?.file_url) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  await supabase
    .from("app_versions")
    .update({ download_count: (version.download_count ?? 0) + 1 })
    .eq("id", versionId);

  return NextResponse.redirect(version.file_url, { status: 302 });
}
