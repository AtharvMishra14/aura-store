"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { RefreshCw, Loader2 } from "lucide-react";

export function ReAnalyzeButton({
  appId,
  developerId,
}: {
  appId: string;
  developerId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  if (!checked) {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => {
        setUserId(user?.id ?? null);
        setChecked(true);
      });
    return null;
  }

  if (userId !== developerId) return null;

  const handleClick = async () => {
    setLoading(true);
    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${baseUrl}/api/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ app_id: appId }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="mt-4 flex items-center gap-2 rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      Re-analyze
    </button>
  );
}
