import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { DashboardNav } from "./dashboard-nav";
import { LogOut } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <aside className="fixed inset-y-0 left-0 z-40 w-64 border-r border-zinc-800 bg-zinc-900/50">
        <div className="flex h-16 items-center border-b border-zinc-800 px-6">
          <Link href="/dashboard" className="text-lg font-semibold text-white">
            Aura Store
          </Link>
        </div>
        <DashboardNav />
        <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-800 p-4">
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-zinc-800 hover:text-red-400"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="pl-64">
        <div className="min-h-screen p-8">{children}</div>
      </main>
    </div>
  );
}
