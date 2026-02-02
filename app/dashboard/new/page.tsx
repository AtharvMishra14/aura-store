import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { UploadAppForm } from "./upload-app-form";

export default async function UploadAppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_developer")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Upload App</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Add a new app to the marketplace
        </p>
      </div>
      <UploadAppForm userId={user.id} isDeveloper={profile?.is_developer ?? false} />
    </div>
  );
}
