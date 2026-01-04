"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DailyStats = {
  date: string;
  minutes: number;
  nudges: number;
  quests: number;
};

type SummaryStats = {
  totalMinutes: number;
  nudgesShown: number;
  nudgesClicked: number;
  questsCompleted: number;
  swapRate: number;
  dailyBreakdown: DailyStats[];
};

type TodayStats = {
  trackedSeconds: number;
  trackedMinutes: number;
  nudgesShown: number;
  questsCompletedToday: number;
  questsCompletedAfterFirstNudge: number;
};

export default function StatsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [todayStats, setTodayStats] = useState<TodayStats | null>(null);
  const [range, setRange] = useState(7);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      router.push("/login");
      return;
    }
    loadStats();
    loadTodayStats();
  }, [router, range]);

  async function loadTodayStats() {
    try {
      const res = await fetch("/api/stats/today", { cache: "no-store", credentials: "include" });
      if (!res.ok) return;
      setTodayStats(await res.json());
    } catch (err) {
      console.error("Error loading today stats:", err);
    }
  }

  async function loadStats() {
    setLoading(true);
    try {
      const res = await fetch(`/api/stats/summary?range=${range}`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!res.ok) {
        console.error("Failed to load stats:", res.status);
        return;
      }

      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Error loading stats:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="card">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Loading stats...</h1>
          </div>
        </div>
      </main>
    );
  }

  if (!stats) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30 flex items-center justify-center text-white font-bold">
                S
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Stats</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Your impact over time</p>
              </div>
            </div>

            <nav className="flex gap-3 text-sm">
              <a className="nav-pill" href="/settings">Settings</a>
              <a className="nav-pill" href="/profile">Profile</a>
            </nav>
          </header>

          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="card space-y-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Getting started</p>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">No stats yet</h2>
              </div>

              <div className="empty-card">
                <p className="text-sm text-slate-700 dark:text-slate-200 mb-3">
                  Your stats will appear here as you use Sensum. Try:
                </p>
                <ul className="text-sm space-y-2 text-slate-700 dark:text-slate-200">
                  <li>• Complete a quest to see your XP grow</li>
                  <li>• Let the extension nudge you (it tracks time automatically)</li>
                  <li>• Come back tomorrow to see your streak</li>
                </ul>
                <a href="/" className="btn-primary w-fit mt-4">
                  Start a quest
                </a>
              </div>
            </div>

            <div className="card sticky top-6 space-y-3">
              <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Navigation</p>
              <nav className="flex flex-col gap-2">
                <a className="pill pill-ghost text-left" href="/">🏠 Today</a>
                <a className="pill pill-ghost text-left" href="/moments">📔 Moments</a>
                <a className="pill pill-ghost text-left" href="/friends">👥 Friends</a>
                <a className="pill pill-ghost text-left" href="/achievements">🏆 Achievements</a>
                <a className="pill pill-ghost text-left" href="/leaderboard">🎖️ Leaderboard</a>
                <a className="pill pill-ghost text-left" href="/buddy">🤝 Buddy</a>
                <a className="pill pill-ghost text-left" href="/metrics">📈 Metrics</a>
              </nav>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const timeSavedHours = Math.floor(stats.totalMinutes / 60);
  const timeSavedMins = stats.totalMinutes % 60;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30 flex items-center justify-center text-white font-bold">
              S
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Stats</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Your impact over time</p>
            </div>
          </div>

          <nav className="flex gap-3 text-sm">
            <a className="nav-pill" href="/settings">Settings</a>
            <a className="nav-pill" href="/profile">Profile</a>
          </nav>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <section className="card space-y-4">
              <div className="flex items-end justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Range</p>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Summary</h2>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setRange(7)} className={range === 7 ? "pill pill-active" : "pill pill-ghost"}>
                    Last 7 days
                  </button>
                  <button onClick={() => setRange(30)} className={range === 30 ? "pill pill-active" : "pill pill-ghost"}>
                    Last 30 days
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-pill">
                  <p className="label">Time on tracked sites</p>
                  <p className="value">
                    {timeSavedHours}h {timeSavedMins}m
                  </p>
                </div>
                <div className="stat-pill">
                  <p className="label">Nudges shown</p>
                  <p className="value">{stats.nudgesShown}</p>
                </div>
                <div className="stat-pill">
                  <p className="label">Quests completed</p>
                  <p className="value">{stats.questsCompleted}</p>
                </div>
                <div className="stat-pill">
                  <p className="label">Swap rate</p>
                  <p className="value">{stats.swapRate.toFixed(1)}%</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {stats.nudgesClicked} / {stats.nudgesShown} nudges → action
                  </p>
                </div>
              </div>
            </section>

            <div className="alert alert-success">
              <div>
                <p className="font-semibold">
                  You've taken {stats.questsCompleted} intentional breaks instead of endless scrolling.
                </p>
                <p className="text-sm opacity-80 mt-1">
                  That's {stats.totalMinutes} minutes you chose to spend on things that matter to you.
                </p>
              </div>
            </div>

          {/* Daily breakdown */}
          <div className="card">
            <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Breakdown</p>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Last {range} days</h2>
            {stats.dailyBreakdown.length === 0 ? (
              <p className="mt-4 text-slate-600 dark:text-slate-300">No activity yet in this range.</p>
            ) : (
              <div className="space-y-3 mt-4">
                {stats.dailyBreakdown.map((day) => (
                  <div key={day.date} className="border-b border-slate-200 dark:border-slate-800 pb-3 last:border-b-0">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-50">
                        {new Date(day.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <div className="text-sm space-x-4 text-slate-600 dark:text-slate-300">
                        <span>⏱️ {day.minutes}m</span>
                        <span>🔔 {day.nudges}</span>
                        <span>✅ {day.quests}</span>
                      </div>
                    </div>

                    {/* Simple progress bar for minutes */}
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${Math.min((day.minutes / 60) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Insights */}
          {stats.questsCompleted > 0 && (
            <div className="card">
              <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Insights</p>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">💡 Your patterns</h2>
              <ul className="space-y-2 text-sm mt-4 text-slate-700 dark:text-slate-200">
                <li>
                  • You complete a quest after{" "}
                  {stats.nudgesShown > 0
                    ? Math.round(stats.nudgesShown / stats.questsCompleted)
                    : 0}{" "}
                  nudges on average
                </li>
                <li>
                  • Your swap rate is {stats.swapRate.toFixed(0)}% (
                  {stats.swapRate < 20
                    ? "keep building the habit!"
                    : stats.swapRate < 50
                    ? "you're getting there!"
                    : "excellent awareness!"}
                  )
                </li>
                <li>
                  • You've avoided {stats.totalMinutes} minutes of potential
                  doomscrolling
                </li>
              </ul>
            </div>
          )}
          </div>

          <div className="space-y-4">
            {todayStats && (
              <div className="card sticky top-6">
                <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Today</p>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Nudges & time</h2>
                <div className="mt-4 space-y-3">
                  <div className="stat-pill">
                    <p className="label">Tracked time</p>
                    <p className="value">{todayStats.trackedMinutes} min</p>
                  </div>
                  <div className="stat-pill">
                    <p className="label">Nudges shown</p>
                    <p className="value">{todayStats.nudgesShown}</p>
                  </div>
                  <div className="stat-pill">
                    <p className="label">Quests after first nudge</p>
                    <p className="value">{todayStats.questsCompletedAfterFirstNudge}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="card sticky top-6 space-y-3">
              <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Navigation</p>
              <nav className="flex flex-col gap-2">
                <a className="pill pill-ghost text-left" href="/">🏠 Today</a>
                <a className="pill pill-ghost text-left" href="/moments">📔 Moments</a>
                <a className="pill pill-ghost text-left" href="/friends">👥 Friends</a>
                <a className="pill pill-ghost text-left" href="/achievements">🏆 Achievements</a>
                <a className="pill pill-ghost text-left" href="/leaderboard">🎖️ Leaderboard</a>
                <a className="pill pill-ghost text-left" href="/buddy">🤝 Buddy</a>
                <a className="pill pill-ghost text-left" href="/metrics">📈 Metrics</a>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
