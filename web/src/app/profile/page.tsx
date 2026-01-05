"use client";

import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setUserId(localStorage.getItem("userId"));
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30 flex items-center justify-center text-white font-bold">S</div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Profile</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Your Sensum identity</p>
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
            <a className="nav-pill" href="/profile">Profile</a>
            <a className="nav-pill" href="/settings">Settings</a>
            <a className="nav-pill" href="/">Today</a>
          </nav>
        </header>

        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Account</p>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Basics</h2>
            </div>
            <a className="nav-pill" href="/settings">Edit</a>
          </div>

          <div className="stat-row">
            <span>User ID</span>
            <strong>{userId ?? "(not logged in)"}</strong>
          </div>
          <div className="stat-row">
            <span>Sharing</span>
            <strong className="text-sm text-slate-600 dark:text-slate-300">Manage in Settings</strong>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Progress (XP/level/streak) updates when you complete quests on the Today page.
          </p>
        </div>
      </div>
    </main>
  );
}
