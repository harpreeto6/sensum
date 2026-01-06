'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type LeaderboardEntry = {
  rank: number;
  userId: number;
  email: string;
  xp: number;
  level: number;
  streak: number;
  questCount?: number;
};

export default function LeaderboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [view, setView] = useState<'global' | 'friends'>('global');
  const [metric, setMetric] = useState<'xp' | 'streak' | 'level' | 'quest_count'>('xp');

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore network errors; still clear local state and redirect.
    } finally {
      localStorage.removeItem("userId");
      router.push("/login");
    }
  }

  useEffect(() => {
    const id = localStorage.getItem('userId');
    if (!id) {
      router.push('/login');
      return;
    }
    setUserId(Number(id));
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    loadLeaderboard();
  }, [userId, view, metric]);

  const loadLeaderboard = async () => {
    try {
      const endpoint = view === 'global'
        ? `/api/leaderboard/global?type=${metric}`
        : `/api/leaderboard/friends?userId=${userId}&type=${metric}`;
      
      const res = await fetch(endpoint, {credentials: "include"});
      const data = await res.json();
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    }
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}.`;
  };

  const getMetricValue = (entry: LeaderboardEntry) => {
    switch (metric) {
      case 'xp':
        return `${entry.xp} XP`;
      case 'streak':
        return `${entry.streak} days`;
      case 'level':
        return `Level ${entry.level}`;
      case 'quest_count':
        return `${entry.questCount || 0} quests`;
    }
  };

  if (!userId) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="card">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Loading...</h1>
          </div>
        </div>
      </main>
    );
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
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Leaderboard</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Friendly competition, zero noise</p>
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
                <button className="pill pill-ghost block w-full text-left" type="button" onClick={logout}>🚪 Logout</button>
              </div>
            </details>
            <a className="nav-pill" href="/">Today</a>
            <a className="nav-pill" href="/profile">Profile</a>
            <a className="nav-pill" href="/settings">Settings</a>
          </nav>
        </header>

        <div className="space-y-4">
            <section className="card space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">View</p>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Rankings</h2>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setView('global')}
                    className={view === 'global' ? 'pill pill-active' : 'pill pill-ghost'}
                  >
                    Global
                  </button>
                  <button
                    onClick={() => setView('friends')}
                    className={view === 'friends' ? 'pill pill-active' : 'pill pill-ghost'}
                  >
                    Friends
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label className="label">Rank by</label>
                <select
                  value={metric}
                  onChange={(e) => setMetric(e.target.value as any)}
                  className="input"
                >
                  <option value="xp">XP</option>
                  <option value="streak">Streak</option>
                  <option value="level">Level</option>
                  <option value="quest_count">Quest Count</option>
                </select>
              </div>
            </section>

            <section className="card overflow-hidden p-0">
              {leaderboard.length === 0 ? (
                <div className="p-8 text-center text-slate-600 dark:text-slate-300">No data yet</div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.userId}
                      className={
                        entry.userId === userId
                          ? 'p-4 flex items-center gap-4 bg-slate-50 dark:bg-slate-900/40'
                          : 'p-4 flex items-center gap-4'
                      }
                    >
                      <div className="text-2xl font-bold w-12 text-center text-slate-900 dark:text-slate-50">
                        {getMedalEmoji(entry.rank)}
                      </div>

                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 dark:text-slate-50">
                          {entry.email}
                          {entry.userId === userId && (
                            <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">(You)</span>
                          )}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          Level {entry.level} • {entry.streak} day streak
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-lg font-bold text-slate-900 dark:text-slate-50">
                          {getMetricValue(entry)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
        </div>
      </div>
    </main>
  );
}