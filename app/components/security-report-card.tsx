import { Shield, CheckCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/utils/cn";

type BadgeVariant = "safe" | "caution" | "warning" | "pending";

function getBadgeVariant(score: number | null): BadgeVariant {
  if (score == null) return "pending";
  if (score > 80) return "safe";
  if (score > 50) return "caution";
  return "warning";
}

export function SecurityReportCard({
  score,
  summary,
}: {
  score: number | null;
  summary: string | null;
}) {
  const variant = getBadgeVariant(score);

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
        <Shield className="h-5 w-5" />
        Security Report
      </h2>

      {variant === "pending" ? (
        <div className="mt-4 rounded-lg border border-dashed border-zinc-700 bg-zinc-800/30 px-4 py-3">
          <p className="text-zinc-500">Analysis Pending</p>
          <p className="mt-1 text-sm text-zinc-600">
            This app has not been analyzed yet. Check back later.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 font-bold",
                variant === "safe" && "bg-emerald-500/20 text-emerald-400",
                variant === "caution" && "bg-amber-500/20 text-amber-400",
                variant === "warning" && "bg-red-500/20 text-red-400"
              )}
            >
              <span className="text-2xl">{score}/100</span>
              <span className="text-sm font-normal">Safety Score</span>
            </div>

            <div
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
                variant === "safe" &&
                  "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
                variant === "caution" &&
                  "bg-amber-500/10 text-amber-400 border border-amber-500/30",
                variant === "warning" &&
                  "bg-red-500/10 text-red-400 border border-red-500/30"
              )}
            >
              {variant === "safe" && (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Verified Safe by AI
                </>
              )}
              {variant === "caution" && (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  Review Recommended
                </>
              )}
              {variant === "warning" && (
                <>
                  <AlertTriangle className="h-4 w-4" />
                  Warning: Potential Scam
                </>
              )}
            </div>
          </div>

          {summary && (
            <p className="text-zinc-400">{summary}</p>
          )}
        </div>
      )}
    </section>
  );
}
