"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AchievementModal from './components/AchievementModal';

type Quest = {
  id: number;
  category: string;
  title: string;
  durationSec: number;
  prompt: string;
};

type ProgressResponse = {
  xp: number;
  level: number;
  streak: number;
  gainedXp: number;
  newAchievements?: any[];
};

const PATHS = ["music", "fitness", "study", "friends", "calm", "outdoors"] as const;
const MOODS = ["good", "okay", "stressed", "tired"] as const;

export default function TodayPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);

  const [path, setPath] = useState<(typeof PATHS)[number]>("calm");
  const [mood, setMood] = useState<(typeof MOODS)[number]>("okay");

  const [quests, setQuests] = useState<Quest[]>([]);
  const [momentText, setMomentText] = useState("");
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [msg, setMsg] = useState("");

  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [newAchievements, setNewAchievements] = useState<any[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("userId");
    if (!raw) {
      router.push("/login");
      return;
    }
    setUserId(Number(raw));

    const savedPath = localStorage.getItem("path");
    if (savedPath && PATHS.includes(savedPath as any)) setPath(savedPath as any);
    
    loadProgress();
  }, [router]);

  async function loadProgress() {
    try {
      const res = await fetch("/api/me", {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      setProgress({
        xp: Number(data?.xp ?? 0),
        level: Number(data?.level ?? 0),
        streak: Number(data?.streak ?? 0),
        gainedXp: 0,
      });
    } catch (err) {
      console.error("Error loading progress:", err);
    }
  }

  async function loadQuests(selectedPath = path) {
    setMsg("");
    localStorage.setItem("path", selectedPath);

    const res = await fetch(`/api/quests/recommendations?path=${encodeURIComponent(selectedPath)}`, {
      cache: "no-store",
      credentials: "include",
    });

    if (!res.ok) {
      setMsg("Failed to load quests");
      return;
    }
    const data = await res.json();
    setQuests(data);
  }

  async function completeQuest(q: Quest) {
    if (!userId) return;

    setMsg("");

    const res = await fetch("/api/quests/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        userId,
        questId: q.id,
        mood,
        momentText,
      }),
    });

    if (!res.ok) {
      setMsg("Complete failed");
      return;
    }

    const data: ProgressResponse = await res.json();

    // Handle newly unlocked achievements
  
    if (data.newAchievements && data.newAchievements.length > 0) {
      setShowAchievementModal(true);
      setNewAchievements(data.newAchievements);
    }
    setProgress(data);

    // store a simple "moments" list locally for Day 2
    const prev = JSON.parse(localStorage.getItem("moments") || "[]");
    prev.unshift({
      when: new Date().toISOString(),
      title: q.title,
      mood,
      momentText,
    });
    localStorage.setItem("moments", JSON.stringify(prev.slice(0, 50)));

    setMomentText("");
    setMsg(`✨ Nice work! +${data.gainedXp} XP earned`);
    setTimeout(() => setMsg(""), 3000);
    await loadQuests(path);
  }

  async function handleSkip(questId: number) {
    try {
      const res = await fetch("/api/quests/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questId }),
        credentials: "include",
      });

      if (!res.ok) {
        setMsg("❌ Couldn't skip that quest. Please try again.");
        return;
      }

      setMsg("✓ Noted! Sensum will show this quest less often.");
      setTimeout(() => setMsg(""), 3000);
      void loadQuests(path);
    } catch (err) {
      setMsg("❌ Connection issue. Check your internet and try again.");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30 flex items-center justify-center text-white font-bold">S</div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Sensum</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Today's quests</p>
            </div>
          </div>

          <nav className="flex gap-3 text-sm">
            <a className="nav-pill" href="/profile">Profile</a>
            <a className="nav-pill" href="/settings">Settings</a>
          </nav>
        </header>

        <div className="card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Progress</p>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">XP, Level, Streak</h2>
            </div>
            <button
              className="btn-primary"
              onClick={() => loadQuests()}
              disabled={quests.length > 0}
            >
              {quests.length > 0 ? "✓ Quests loaded" : "Get 3 quests"}
            </button>
          </div>

          {progress ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                {(() => {
                  const xpForCurrentLevel = (progress.level - 1) * 500;
                  const xpForNextLevel = progress.level * 500;
                  const xpInCurrentLevel = progress.xp - xpForCurrentLevel;
                  const progressPercent = Math.min((xpInCurrentLevel / 500) * 100, 100);
                  return (
                    <>
                      <div className="flex justify-between mb-1">
                        <p className="label">XP</p>
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-50">{xpInCurrentLevel} / 500</p>
                      </div>
                      <div className="w-full h-6 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-500 flex items-center justify-center transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        >
                          {progressPercent > 15 && (
                            <span className="text-xs font-bold text-white drop-shadow-sm">{Math.round(progressPercent)}%</span>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <p className="label">Level</p>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-50">{progress.level}</p>
                </div>
                <div className="w-full h-6 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-400 to-purple-500 flex items-center justify-center w-full">
                    <span className="text-xs font-bold text-white drop-shadow-sm">{progress.level}</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <p className="label">Streak</p>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-50">{progress.streak}</p>
                </div>
                <div className="w-full h-6 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 flex items-center justify-center w-full">
                    <span className="text-xs font-bold text-white drop-shadow-sm">{progress.streak}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex justify-between mb-1">
                  <p className="label">XP</p>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-50">0 / 500</p>
                </div>
                <div className="w-full h-6 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-400 to-blue-500 flex items-center justify-center w-full" style={{ width: "0%" }}>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <p className="label">Level</p>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-50">0</p>
                </div>
                <div className="w-full h-6 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-400 to-purple-500 flex items-center justify-center w-full">
                    <span className="text-xs font-bold text-white drop-shadow-sm">0</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <p className="label">Streak</p>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-50">0</p>
                </div>
                <div className="w-full h-6 rounded-lg bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 flex items-center justify-center w-full">
                    <span className="text-xs font-bold text-white drop-shadow-sm">0</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="card space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-3">
                <p className="label">Pick a path</p>
                <div className="flex flex-wrap gap-2">
                  {PATHS.map((p) => (
                    <button
                      key={p}
                      className={`pill ${p === path ? "pill-active" : "pill-ghost"}`}
                      onClick={() => {
                        setPath(p);
                        loadQuests(p);
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="label">How are you?</p>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map((m) => (
                    <button
                      key={m}
                      className={`pill ${m === mood ? "pill-active" : "pill-ghost"}`}
                      onClick={() => setMood(m)}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {msg && (
              <div className={`alert ${
                msg.includes("Nice") || msg.includes("Noted") || msg.includes("✓") || msg.includes("✨")
                  ? "alert-success"
                  : "alert-error"
              }`}>
                {msg}
              </div>
            )}

            <div className="space-y-3">
              <p className="label">Optional moment (1 line)</p>
              <input
                className="input"
                placeholder="e.g., Felt calmer after stepping outside"
                value={momentText}
                onChange={(e) => setMomentText(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              {quests.length === 0 ? (
                <div className="empty-card">
                  <p className="text-lg font-semibold">Ready for a tiny quest?</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Pick a path and mood, then tap "Get 3 quests" to see suggestions tailored to your vibe.
                  </p>
                  <p className="text-xs text-slate-400">💡 Sensum learns what you like. Complete favorites, skip the rest.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {quests.map((q) => (
                    <div key={q.id} className="quest-card">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{q.title}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{q.prompt}</p>
                          <p className="text-xs text-slate-400 mt-2">⏱️ ~{Math.floor(q.durationSec / 60)} min · {q.category}</p>
                        </div>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 mt-4">
                        <button
                          className="btn-primary"
                          onClick={() => completeQuest(q)}
                        >
                          ✓ Complete
                        </button>
                        <button
                          className="btn-ghost"
                          onClick={() => handleSkip(q.id)}
                        >
                          Not interested
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="card sticky top-6 space-y-4">
              <nav className="flex flex-col gap-2">
                <a className="pill pill-ghost text-left" href="/moments">📔 Moments</a>
                <a className="pill pill-ghost text-left" href="/stats">📊 Stats</a>
                <a className="pill pill-ghost text-left" href="/friends">👥 Friends</a>
                <a className="pill pill-ghost text-left" href="/achievements">🏆 Achievements</a>
                <a className="pill pill-ghost text-left" href="/leaderboard">🎖️ Leaderboard</a>
                <a className="pill pill-ghost text-left" href="/buddy">🤝 Buddy</a>
              </nav>
            </div>
          </div>
        </div>

        {showAchievementModal && (
          <AchievementModal
            achievements={newAchievements}
            onClose={() => setShowAchievementModal(false)}
          />
        )}
      </div>
    </main>
  );
}
