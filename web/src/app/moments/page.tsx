"use client";

import { useEffect, useState } from "react";

type Moment = {
  when: string;
  title: string;
  mood: string;
  momentText: string;
};

export default function MomentsPage() {
  const [moments, setMoments] = useState<Moment[]>([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("moments") || "[]");
    setMoments(data);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30 flex items-center justify-center text-white font-bold">S</div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Moments</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Saved reflections from completed quests</p>
            </div>
          </div>

          <nav className="flex gap-3 text-sm">
            <a className="nav-pill" href="/">Today</a>
            <a className="nav-pill" href="/profile">Profile</a>
          </nav>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            {moments.length === 0 ? (
              <div className="empty-card">
                <p className="text-lg font-semibold">No moments yet</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Complete a quest and add an optional note to save your first moment.</p>
              </div>
            ) : (
              <div className="card space-y-3">
                <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Timeline</p>
                <div className="space-y-3">
                  {moments.map((m, idx) => (
                    <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-slate-900 dark:text-slate-50">{m.title}</p>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(m.when).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Mood: {m.mood}</p>
                      {m.momentText && <p className="mt-2 text-sm text-slate-800 dark:text-slate-200">{m.momentText}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="card sticky top-6 space-y-3">
              <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Navigation</p>
              <nav className="flex flex-col gap-2">
                <a className="pill pill-ghost text-left" href="/stats">📊 Stats</a>
                <a className="pill pill-ghost text-left" href="/friends">👥 Friends</a>
                <a className="pill pill-ghost text-left" href="/achievements">🏆 Achievements</a>
                <a className="pill pill-ghost text-left" href="/leaderboard">🎖️ Leaderboard</a>
                <a className="pill pill-ghost text-left" href="/buddy">🤝 Buddy</a>
                <a className="pill pill-ghost text-left" href="/settings">⚙️ Settings</a>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
