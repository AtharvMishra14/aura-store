"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Download, Smartphone } from "lucide-react";
import { DownloadButton } from "./download-button";
import { cn } from "@/utils/cn";

type AppWithVersion = {
  id: string;
  title: string;
  description: string;
  icon_url: string | null;
  category: string;
  platform: string;
  latestVersion: {
    id: string;
    version_string: string;
    file_url: string;
    file_size_bytes: number;
    download_count: number;
  } | null;
};

export function Storefront({ apps }: { apps: AppWithVersion[] }) {
  const [search, setSearch] = useState("");

  const filteredApps = useMemo(() => {
    if (!search.trim()) return apps;
    const q = search.toLowerCase();
    return apps.filter((app) =>
      app.title.toLowerCase().includes(q)
    );
  }, [apps, search]);

  return (
    <main>
      <section className="relative overflow-hidden border-b border-zinc-800 px-4 py-20 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 to-transparent" />
        <div className="relative mx-auto max-w-7xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Welcome to Aura Store
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
            The Open App Market. Discover and download apps for Android and iOS.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search apps..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900/50 py-3 pl-11 pr-4 text-white placeholder-zinc-500 outline-none transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="group rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 transition hover:border-zinc-700 hover:bg-zinc-900/50"
            >
              <Link href={`/app/${app.id}`} className="block">
                <div className="flex items-start gap-4">
                  {app.icon_url ? (
                    <img
                      src={app.icon_url}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-800">
                      <Smartphone className="h-7 w-7 text-zinc-500" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-white truncate group-hover:text-zinc-200">
                      {app.title}
                    </h3>
                    <p className="mt-0.5 text-xs text-zinc-500">{app.category}</p>
                  </div>
                </div>
                <p className="mt-4 line-clamp-2 text-sm text-zinc-400">
                  {app.description}
                </p>
              </Link>
              <div className="mt-4">
                <DownloadButton
                  app={app}
                  platform={app.platform}
                  latestVersion={app.latestVersion}
                />
              </div>
            </div>
          ))}
        </div>

        {filteredApps.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-700 py-16 text-center">
            <p className="text-zinc-500">
              {search ? "No apps match your search." : "No apps yet."}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
