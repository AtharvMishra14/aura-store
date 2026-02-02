"use client";

import { DownloadButton } from "@/app/download-button";

type AppDetailsClientProps = {
  app: {
    id: string;
    title: string;
    platform: string;
    developerId?: string;
    latestVersion: {
      id: string;
      version_string: string;
      file_url: string;
      file_size_bytes: number;
    } | null;
    allVersions: Array<{
      id: string;
      version_string: string;
      file_url: string;
      file_size_bytes: number;
    }>;
  };
};

export function AppDetailsClient({ app }: AppDetailsClientProps) {
  return (
    <div className="mt-6">
      <DownloadButton
        app={app}
        platform={app.platform}
        latestVersion={app.latestVersion}
      />
    </div>
  );
}
