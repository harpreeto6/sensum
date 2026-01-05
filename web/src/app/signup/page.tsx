"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      setErr("Signup failed (email might already exist)");
      return;
    }

    const data = await res.json(); // { userId }
    localStorage.setItem("userId", String(data.userId));
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30 flex items-center justify-center text-white font-bold">
              S
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Sign up</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Create your Sensum account</p>
            </div>
          </div>

          <nav className="flex gap-3 text-sm items-center">
            <details className="relative">
              <summary className="nav-pill cursor-pointer select-none">Menu</summary>
              <div className="absolute right-0 mt-2 w-56 card p-2 space-y-1 z-20">
                <a className="pill pill-ghost block" href="/moments">📔 Moments</a>
                <a className="pill pill-ghost block" href="/stats">📊 Stats</a>
                <a className="pill pill-ghost block" href="/friends">👥 Friends</a>
                <a className="pill pill-ghost block" href="/achievements">🏆 Achievements</a>
                <a className="pill pill-ghost block" href="/leaderboard">🎖️ Leaderboard</a>
                <a className="pill pill-ghost block" href="/buddy">🤝 Buddy</a>
                <a className="pill pill-ghost block" href="/metrics">📈 Metrics</a>
              </div>
            </details>
            <a className="nav-pill" href="/">Today</a>
            <a className="nav-pill" href="/login">Login</a>
          </nav>
        </header>

        <div className="card space-y-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Account</p>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Create account</h2>
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
              <input
                className="input w-full"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="input w-full"
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {err && <div className="alert alert-error">{err}</div>}
              <button className="btn-primary" type="submit">
                Create account
              </button>
            </form>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              Already have an account?{" "}
              <a className="underline" href="/login">
                Login
              </a>
            </p>
        </div>
      </div>
    </main>
  );
}
