"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/utils/cn";
import { Mail, Lock, Github, Loader2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const supabase = createClient();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // --- DEBUGGING LOG ---
    console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    // ---------------------

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage({ type: "error", text: error.message });
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const handleGitHubLogin = async () => {
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-xl">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-white">Aura Store</h1>
            <p className="mt-2 text-sm text-zinc-400">Sign in to your developer account</p>
          </div>

          {error === "auth" && (
            <div className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
              Authentication failed. Please try again.
            </div>
          )}

          {message && (
            <div
              className={cn(
                "mb-4 rounded-lg px-4 py-3 text-sm",
                message.type === "error"
                  ? "bg-red-500/10 text-red-400"
                  : "bg-emerald-500/10 text-emerald-400"
              )}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-zinc-300">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 py-2.5 pl-10 pr-4 text-white placeholder-zinc-500 outline-none transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-zinc-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 py-2.5 pl-10 pr-4 text-white placeholder-zinc-500 outline-none transition focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-white py-2.5 font-medium text-zinc-900 transition hover:bg-zinc-200 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-zinc-700" />
            <span className="text-xs text-zinc-500">or</span>
            <div className="h-px flex-1 bg-zinc-700" />
          </div>

          <button
            type="button"
            onClick={handleGitHubLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/50 py-2.5 font-medium text-zinc-200 transition hover:bg-zinc-800 hover:border-zinc-600 disabled:opacity-50"
          >
            <Github className="h-5 w-5" />
            Sign in with GitHub
          </button>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-white underline hover:no-underline">
              Create account
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          By signing in, you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}