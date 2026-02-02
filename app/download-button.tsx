"use client";

import { useState } from "react";
import { Download, X } from "lucide-react";
import { cn } from "@/utils/cn";

type AppWithVersion = {
  id: string;
  title: string;
  platform: string;
  latestVersion: {
    id: string;
    version_string: string;
    file_url: string;
    file_size_bytes: number;
  } | null;
};

export function DownloadButton({
  app,
  platform,
  latestVersion,
}: {
  app: AppWithVersion;
  platform: string;
  latestVersion: AppWithVersion["latestVersion"];
}) {
  const [showIosModal, setShowIosModal] = useState(false);

  const isIos = platform === "IOS" || platform === "BOTH";
  const isAndroid = platform === "ANDROID" || platform === "BOTH";

  const handleAndroidDownload = () => {
    if (!latestVersion) return;
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    window.location.href = `${baseUrl}/api/download/${latestVersion.id}`;
  };

  const handleIosInstall = () => {
    setShowIosModal(true);
  };

  const altStoreUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/altstore/source.json`
      : "/api/altstore/source.json";

  return (
    <>
      <div className="flex gap-2">
        {isAndroid && (
          <button
            onClick={handleAndroidDownload}
            disabled={!latestVersion}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition",
              latestVersion
                ? "bg-white text-zinc-900 hover:bg-zinc-200"
                : "cursor-not-allowed bg-zinc-800 text-zinc-500"
            )}
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        )}
        {isIos && (
          <button
            onClick={handleIosInstall}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-zinc-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            AltStore
          </button>
        )}
      </div>

      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80"
            onClick={() => setShowIosModal(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
            <button
              onClick={() => setShowIosModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-semibold text-white">
              Install on iOS
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              To install {app.title} on iOS, add this source to AltStore:
            </p>
            <div className="mt-4 rounded-lg bg-zinc-800 p-4">
              <code className="break-all text-sm text-zinc-300">
                {altStoreUrl}
              </code>
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(altStoreUrl);
                }}
                className="flex-1 rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Copy URL
              </button>
              <a
                href={altStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-lg bg-white px-4 py-2 text-center text-sm font-medium text-zinc-900 hover:bg-zinc-200"
              >
                Open in AltStore
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
