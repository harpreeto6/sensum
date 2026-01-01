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

export default function StatsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [range, setRange] = useState(7);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      router.push("/login");
      return;
    }
    loadStats();
  }, [router, range]);

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
      <main className="p-6">
        <h1 className="text-2xl font-bold">Loading stats...</h1>
      </main>
    );
  }

  if (!stats) {
    return (
      <main className="p-6 max-w-4xl">
        <header className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">📊 Your Impact</h1>
          <a className="underline" href="/">Today</a>
        </header>
        
        <div className="border rounded-lg p-8 text-center bg-gray-50 dark:bg-gray-900 mt-6">
          <p className="text-lg font-semibold mb-2">No stats yet!</p>
          <p className="text-sm opacity-70 mb-4">
            Your stats will appear here as you use Sensum. Try:
          </p>
          <ul className="text-sm space-y-2 text-left max-w-md mx-auto">
            <li>🎯 Complete a quest to see your XP grow</li>
            <li>🔔 Let the extension nudge you (it tracks time automatically)</li>
            <li>📈 Come back tomorrow to see your streak!</li>
          </ul>
          <a 
            href="/" 
            className="inline-block mt-6 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Start a quest
          </a>
        </div>
      </main>
    );
  }

  const timeSavedHours = Math.floor(stats.totalMinutes / 60);
  const timeSavedMins = stats.totalMinutes % 60;

  return (
    <main className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <header className="flex items-center gap-4">
        <h1 className="text-3xl font-bold">📊 Your Impact</h1>
        <a className="underline" href="/">Today</a>
        <a className="underline" href="/settings">Settings</a>
      </header>

      {/* Range selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setRange(7)}
          className={`px-4 py-2 border rounded ${range === 7 ? "bg-blue-500 text-white" : ""}`}
        >
          Last 7 days
        </button>
        <button
          onClick={() => setRange(30)}
          className={`px-4 py-2 border rounded ${range === 30 ? "bg-blue-500 text-white" : ""}`}
        >
          Last 30 days
        </button>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm opacity-70">Time on tracked sites</p>
          <p className="text-3xl font-bold">
            {timeSavedHours}h {timeSavedMins}m
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-sm opacity-70">Nudges shown</p>
          <p className="text-3xl font-bold">{stats.nudgesShown}</p>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-sm opacity-70">Quests completed</p>
          <p className="text-3xl font-bold">{stats.questsCompleted}</p>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-sm opacity-70">Swap rate</p>
          <p className="text-3xl font-bold">{stats.swapRate.toFixed(1)}%</p>
          <p className="text-xs opacity-60 mt-1">
            {stats.nudgesClicked} / {stats.nudgesShown} nudges → action
          </p>
        </div>
      </div>

      {/* Impact message */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <p className="font-semibold text-green-900 dark:text-green-100">
          🎉 You've taken {stats.questsCompleted} intentional breaks instead of endless scrolling!
        </p>
        <p className="text-sm mt-2 opacity-80">
          That's {stats.totalMinutes} minutes you chose to spend on things that matter to you.
        </p>
      </div>

      {/* Daily breakdown */}
      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4">Daily Breakdown</h2>

        {stats.dailyBreakdown.length === 0 ? (
          <p className="opacity-60">No activity yet in this range.</p>
        ) : (
          <div className="space-y-3">
            {stats.dailyBreakdown.map((day) => (
              <div key={day.date} className="border-b pb-3 last:border-b-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">
                    {new Date(day.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <div className="text-sm space-x-4">
                    <span>⏱️ {day.minutes}m</span>
                    <span>🔔 {day.nudges}</span>
                    <span>✅ {day.quests}</span>
                  </div>
                </div>

                {/* Simple progress bar for minutes */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
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
        <div className="border rounded-lg p-4">
          <h2 className="text-xl font-bold mb-2">💡 Insights</h2>
          <ul className="space-y-2 text-sm">
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
    </main>
  );
}