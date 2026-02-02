"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/utils/cn";
import { Loader2, Upload, Image, FileArchive } from "lucide-react";

const CATEGORIES = ["Productivity", "Games", "Social"] as const;
const PLATFORMS = [
  { value: "ANDROID", label: "Android" },
  { value: "IOS", label: "iOS" },
] as const;

const ICON_ACCEPT = "image/png,image/jpeg,image/jpg,image/webp";
const APP_ACCEPT = ".apk,.ipa";

type FormState = {
  appName: string;
  description: string;
  category: string;
  platform: string;
  iconFile: File | null;
  appFile: File | null;
};

type UploadStatus =
  | "idle"
  | "ensuring-developer"
  | "uploading-icon"
  | "uploading-app"
  | "saving"
  | "analyzing"
  | "success"
  | "error";

export function UploadAppForm({
  userId,
  isDeveloper,
}: {
  userId: string;
  isDeveloper: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>({
    appName: "",
    description: "",
    category: "Productivity",
    platform: "ANDROID",
    iconFile: null,
    appFile: null,
  });
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.appName.trim()) {
      setError("App name is required");
      return;
    }
    if (!form.description.trim()) {
      setError("Description is required");
      return;
    }
    if (!form.iconFile) {
      setError("App icon is required");
      return;
    }
    if (!form.appFile) {
      setError("App file (.apk or .ipa) is required");
      return;
    }

    const ext = form.appFile.name.split(".").pop()?.toLowerCase();
    if (ext !== "apk" && ext !== "ipa") {
      setError("App file must be .apk or .ipa");
      return;
    }

    const supabase = createClient();

    try {
      // Step 0: Ensure user is a developer
      if (!isDeveloper) {
        setStatus("ensuring-developer");
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ is_developer: true })
          .eq("id", userId);

        if (updateError) {
          setError("Failed to upgrade account: " + updateError.message);
          setStatus("error");
          return;
        }
      }

      // Step 1: Upload icon to icons/
      setStatus("uploading-icon");
      const iconExt = form.iconFile.name.split(".").pop()?.toLowerCase() ?? "png";
      const iconPath = `icons/${userId}/${crypto.randomUUID()}.${iconExt}`;

      const { error: iconError } = await supabase.storage
        .from("app-files")
        .upload(iconPath, form.iconFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (iconError) {
        setError("Failed to upload icon: " + iconError.message);
        setStatus("error");
        return;
      }

      const {
        data: { publicUrl: iconUrl },
      } = supabase.storage.from("app-files").getPublicUrl(iconPath);

      // Step 2: Upload app file to installers/
      setStatus("uploading-app");
      const appPath = `installers/${userId}/${crypto.randomUUID()}.${ext}`;

      const { error: appError } = await supabase.storage
        .from("app-files")
        .upload(appPath, form.appFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (appError) {
        setError("Failed to upload app file: " + appError.message);
        setStatus("error");
        return;
      }

      const {
        data: { publicUrl: fileUrl },
      } = supabase.storage.from("app-files").getPublicUrl(appPath);

      // Step 3: Insert app
      setStatus("saving");
      const { data: app, error: appInsertError } = await supabase
        .from("apps")
        .insert({
          developer_id: userId,
          title: form.appName.trim(),
          description: form.description.trim(),
          icon_url: iconUrl,
          category: form.category,
          platform: form.platform,
        })
        .select("id")
        .single();

      if (appInsertError) {
        setError("Failed to save app: " + appInsertError.message);
        setStatus("error");
        return;
      }

      // Step 4: Insert app_version
      const { error: versionError } = await supabase.from("app_versions").insert({
        app_id: app.id,
        version_string: "1.0.0",
        file_url: fileUrl,
        file_size_bytes: form.appFile.size,
      });

      if (versionError) {
        setError("Failed to save version: " + versionError.message);
        setStatus("error");
        return;
      }

      setStatus("analyzing");
      try {
        const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
        const auditRes = await fetch(`${baseUrl}/api/audit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ app_id: app.id }),
        });
        if (!auditRes.ok) {
          console.warn("Audit failed, continuing:", await auditRes.text());
        }
      } catch (auditErr) {
        console.warn("Audit request failed:", auditErr);
      }

      setStatus("success");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setStatus("error");
    }
  };

  const isSubmitting = status !== "idle" && status !== "success" && status !== "error";

  const statusMessage =
    status === "ensuring-developer"
      ? "Upgrading account..."
      : status === "uploading-icon"
        ? "Uploading icon..."
        : status === "uploading-app"
          ? "Uploading app file..."
          : status === "saving"
            ? "Saving app details..."
            : status === "analyzing"
              ? "Analyzing app security..."
              : "";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6"
    >
      {error && (
        <div className="mb-6 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label
            htmlFor="appName"
            className="mb-1.5 block text-sm font-medium text-zinc-300"
          >
            App Name
          </label>
          <input
            id="appName"
            type="text"
            value={form.appName}
            onChange={(e) => updateField("appName", e.target.value)}
            placeholder="My Awesome App"
            disabled={isSubmitting}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white placeholder-zinc-500 outline-none transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-1.5 block text-sm font-medium text-zinc-300"
          >
            Description
          </label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Describe your app..."
            rows={4}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white placeholder-zinc-500 outline-none transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 disabled:opacity-50 resize-none"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label
              htmlFor="category"
              className="mb-1.5 block text-sm font-medium text-zinc-300"
            >
              Category
            </label>
            <select
              id="category"
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 disabled:opacity-50"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="platform"
              className="mb-1.5 block text-sm font-medium text-zinc-300"
            >
              Platform
            </label>
            <select
              id="platform"
              value={form.platform}
              onChange={(e) => updateField("platform", e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-white outline-none transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 disabled:opacity-50"
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">
              App Icon
            </label>
            <label
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition",
                form.iconFile
                  ? "border-zinc-600 bg-zinc-800/30"
                  : "border-zinc-700 bg-zinc-800/20 hover:border-zinc-600",
                isSubmitting && "cursor-not-allowed opacity-50"
              )}
            >
              <input
                type="file"
                accept={ICON_ACCEPT}
                onChange={(e) =>
                  updateField("iconFile", e.target.files?.[0] ?? null)
                }
                disabled={isSubmitting}
                className="hidden"
              />
              {form.iconFile ? (
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <Image className="h-4 w-4" />
                  {form.iconFile.name}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-zinc-500">
                  <Image className="h-8 w-8" />
                  <span className="text-sm">PNG, JPG, WebP</span>
                </div>
              )}
            </label>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-300">
              App File (.apk / .ipa)
            </label>
            <label
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-8 transition",
                form.appFile
                  ? "border-zinc-600 bg-zinc-800/30"
                  : "border-zinc-700 bg-zinc-800/20 hover:border-zinc-600",
                isSubmitting && "cursor-not-allowed opacity-50"
              )}
            >
              <input
                type="file"
                accept={APP_ACCEPT}
                onChange={(e) =>
                  updateField("appFile", e.target.files?.[0] ?? null)
                }
                disabled={isSubmitting}
                className="hidden"
              />
              {form.appFile ? (
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <FileArchive className="h-4 w-4" />
                  {form.appFile.name}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-zinc-500">
                  <FileArchive className="h-8 w-8" />
                  <span className="text-sm">APK or IPA</span>
                </div>
              )}
            </label>
          </div>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {statusMessage}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Upload App
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="rounded-lg border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
