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

type FriendRow = {
  friendId: number;
  friendEmail: string;
  status: string;
};

type FeedItem = {
  friendId: number;
  friendEmail: string;
  at: string;

  xp?: number | null;
  level?: number | null;
  streak?: number | null;
  category?: string | null;
  momentText?: string | null;
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
  const [quickMomentText, setQuickMomentText] = useState("");
  const [quickMomentSaving, setQuickMomentSaving] = useState(false);
  const [quickMomentMsg, setQuickMomentMsg] = useState("");
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [msg, setMsg] = useState("");

  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [buddyFriendId, setBuddyFriendId] = useState<number | null>(null);
  const [buddyStarting, setBuddyStarting] = useState(false);
  const [buddyMsg, setBuddyMsg] = useState("");

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
    
    const id = Number(raw);
    void loadProgress();
    void loadFriends(id);
    void loadFeed(id);
  }, [router]);

  async function loadFriends(id: number) {
    try {
      const res = await fetch(`/api/friends?userId=${encodeURIComponent(String(id))}`, {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) {
        setFriends([]);
        return;
      }
      const rows: FriendRow[] = await res.json();
      setFriends(Array.isArray(rows) ? rows : []);

      const accepted = (Array.isArray(rows) ? rows : []).filter((f) => f.status === "accepted");
      if (accepted.length > 0 && buddyFriendId == null) {
        setBuddyFriendId(accepted[0].friendId);
      }
    } catch {
      setFriends([]);
    }
  }

  async function loadFeed(id: number) {
    try {
      const res = await fetch(`/api/friends/feed?userId=${encodeURIComponent(String(id))}`, {
        cache: "no-store",
        credentials: "include",
      });

      if (!res.ok) {
        setFeed([]);
        return;
      }

      const items: FeedItem[] = await res.json();
      setFeed(Array.isArray(items) ? items : []);
    } catch {
      setFeed([]);
    }
  }

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

  async function saveQuickMoment() {
    const trimmed = quickMomentText.trim();
    if (!trimmed) return;

    setQuickMomentMsg("");
    setQuickMomentSaving(true);

    try {
      const res = await fetch("/api/me/moments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ text: trimmed }),
      });

      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setQuickMomentMsg(t || "Failed to save moment");
        return;
      }

      setQuickMomentText("");
      setQuickMomentMsg("✓ Moment saved");
      setTimeout(() => setQuickMomentMsg(""), 2500);
    } catch (err) {
      setQuickMomentMsg("Failed to save moment");
    } finally {
      setQuickMomentSaving(false);
    }
  }

  async function startBuddyOneClick() {
    if (!userId) return;

    const accepted = friends.filter((f) => f.status === "accepted");
    const friendId = buddyFriendId ?? accepted[0]?.friendId;
    if (!friendId) {
      router.push("/friends");
      return;
    }

    setBuddyMsg("");
    setBuddyStarting(true);

    try {
      const res = await fetch("/api/buddy/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          userId,
          friendId,
          mode: "study",
          durationMinutes: 30,
        }),
      });

      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        setBuddyMsg(t || "Failed to start buddy session");
        return;
      }

      setBuddyMsg("✓ Buddy session created");
      setTimeout(() => setBuddyMsg(""), 2500);
      router.push("/buddy");
    } catch {
      setBuddyMsg("Failed to start buddy session");
    } finally {
      setBuddyStarting(false);
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
          <div className="space-y-4">
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
                <div
                  className={`alert ${
                    msg.includes("Nice") || msg.includes("Noted") || msg.includes("✓") || msg.includes("✨")
                      ? "alert-success"
                      : "alert-error"
                  }`}
                >
                  {msg}
                </div>
              )}

              <div className="space-y-3">
                <p className="label">Optional moment for this quest (1 line)</p>
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
                            <p className="text-xs text-slate-400 mt-2">
                              ⏱️ ~{Math.floor(q.durationSec / 60)} min · {q.category}
                            </p>
                          </div>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2 mt-4">
                          <button className="btn-primary" onClick={() => completeQuest(q)}>
                            ✓ Complete
                          </button>
                          <button className="btn-ghost" onClick={() => handleSkip(q.id)}>
                            Not interested
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="card space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Moments</p>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Quick moment</h2>
                </div>
                <a className="nav-pill" href="/moments">View all</a>
              </div>

              {quickMomentMsg ? (
                <div className={quickMomentMsg.startsWith("✓") ? "alert alert-success" : "alert alert-error"}>
                  {quickMomentMsg}
                </div>
              ) : null}

              <textarea
                className="input min-h-24 resize-none"
                placeholder="What went well today?"
                value={quickMomentText}
                onChange={(e) => setQuickMomentText(e.target.value)}
                maxLength={200}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">{quickMomentText.trim().length}/200</span>
                <button
                  className="btn-primary"
                  onClick={saveQuickMoment}
                  disabled={quickMomentSaving || !quickMomentText.trim()}
                >
                  {quickMomentSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Buddy</p>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Start together</h2>
                </div>
                <a className="nav-pill" href="/buddy">Open</a>
              </div>

              {buddyMsg ? (
                <div className={buddyMsg.startsWith("✓") ? "alert alert-success" : "alert alert-error"}>{buddyMsg}</div>
              ) : null}

              {friends.filter((f) => f.status === "accepted").length === 0 ? (
                <div className="text-sm text-slate-600 dark:text-slate-300">
                  Add a friend to start a buddy session. <a className="underline" href="/friends">Go to Friends</a>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  {friends.filter((f) => f.status === "accepted").length > 1 ? (
                    <select
                      className="input w-full max-w-sm"
                      value={buddyFriendId ?? ""}
                      onChange={(e) => setBuddyFriendId(Number(e.target.value))}
                    >
                      {friends
                        .filter((f) => f.status === "accepted")
                        .map((f) => (
                          <option key={f.friendId} value={f.friendId}>
                            {f.friendEmail}
                          </option>
                        ))}
                    </select>
                  ) : (
                    <div className="pill pill-ghost">
                      {friends.find((f) => f.status === "accepted")?.friendEmail}
                    </div>
                  )}

                  <button className="btn-primary" onClick={startBuddyOneClick} disabled={buddyStarting}>
                    {buddyStarting ? "Starting..." : "Start 30m session"}
                  </button>
                </div>
              )}
            </div>

            <div className="card sticky top-6 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Friends</p>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Highlights</h2>
                </div>
                <a className="nav-pill" href="/friends">Manage</a>
              </div>

              {feed.length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  No recent activity yet. When friends complete quests, you’ll see it here.
                </p>
              ) : (
                <div className="space-y-2">
                  {feed.slice(0, 3).map((item, idx) => (
                    <div
                      key={`${item.friendId}-${item.at}-${idx}`}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{item.friendEmail}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(item.at).toLocaleString()}</p>
                        </div>
                        {item.category ? <span className="pill pill-ghost">{item.category}</span> : null}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {typeof item.level === "number" ? <span className="pill pill-ghost">Level {item.level}</span> : null}
                        {typeof item.streak === "number" ? <span className="pill pill-ghost">Streak {item.streak}</span> : null}
                      </div>

                      {item.momentText ? (
                        <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">“{item.momentText}”</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
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
