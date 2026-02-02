"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";

export function BecomeDeveloperButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ is_developer: true })
      .eq("id", userId);

    if (!error) {
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="mt-4 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200 disabled:opacity-50"
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Upgrading...
        </span>
      ) : (
        "Become a Developer"
      )}
    </button>
  );
}
