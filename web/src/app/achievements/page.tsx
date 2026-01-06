"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Achievement {
  id: number;
  name: string;
  icon: string;
  description: string;
  unlocked?: boolean;
  unlockedAt?: string;
}

export default function AchievementsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedCount, setUnlockedCount] = useState(0);

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
    const id = localStorage.getItem("userId");
    if (!id) {
      router.push("/login");
      return;
    }
    setUserId(Number(id));
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    loadAchievements();
  }, [userId]);

  const loadAchievements = async () => {
    try {
      const res = await fetch(`/api/achievements/all?userId=${userId}`, {credentials: "include"});
      
      if (!res.ok) {
        console.error("Failed to load achievements:", res.status);
        return;
      }
      
      const data = await res.json();
      
      // Make sure data is an array before setting
      if (Array.isArray(data)) {
        setAchievements(data);
        setUnlockedCount(data.filter((a: Achievement) => a.unlocked).length);
      } else {
        console.error("Expected array, got:", data);
      }
    } catch (err) {
      console.error("Failed to load achievements:", err);
    }
  };

  if (!userId) return <div className="p-8">Loading...</div>;

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30 flex items-center justify-center text-white font-bold">S</div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Achievements</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {unlockedCount} / {achievements.length} earned
              </p>
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
          {unlocked.length > 0 && (
            <div className="card space-y-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Unlocked</p>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">🏆 Your wins</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {unlocked.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-3xl">{achievement.icon}</div>
                        <p className="mt-2 font-semibold text-slate-900 dark:text-slate-50">{achievement.name}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{achievement.description}</p>
                      </div>
                    </div>
                    {achievement.unlockedAt && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                        Earned on {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {locked.length > 0 && (
            <div className="card space-y-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Locked</p>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">🔒 Next targets</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {locked.map((achievement) => (
                  <div
                    key={achievement.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white/60 dark:bg-slate-800/50 opacity-80"
                  >
                    <div className="text-3xl grayscale">{achievement.icon}</div>
                    <p className="mt-2 font-semibold text-slate-700 dark:text-slate-200">{achievement.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{achievement.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}