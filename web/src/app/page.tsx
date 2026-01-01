// export default async function Home() {
//   const res = await fetch("http://localhost:3000/api/health", { cache: "no-store" });
//   const text = await res.text();

//   return (
//     <main style={{ padding: 24 }}>
//       <h1>Sensum</h1>
//       <p>Backend health: {text}</p>
//     </main>
//   );
// }



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

type TodayStats = {
  trackedSeconds: number;
  trackedMinutes: number;
  nudgesShown: number;
  questsCompletedToday: number;
  questsCompletedAfterFirstNudge: number;
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

  const [stats, setStats] = useState<TodayStats | null>(null);

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

    loadStats();
  }, [router]);



  async function loadStats() {
      const res = await fetch("/api/stats/today", { cache: "no-store", credentials: "include" });
      if (!res.ok) return;
      setStats(await res.json());
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

    // store a simple “moments” list locally for Day 2
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

    await loadStats();

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
    <main className="p-6 space-y-5">
      <header className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Sensum — Today</h1>
        <a className="underline" href="/moments">Moments</a>
        <a className="underline" href="/profile">Profile</a>
        <a className="underline" href="/stats">Stats</a>
        <a className="underline" href="/friends">Friends</a>
        <a className="underline" href="/achievements">Achievements</a>
        <a className="underline" href="/leaderboard">Leaderboard</a>
        <a className="underline" href="/buddy">Buddy</a>
        <a className="underline" href="/settings">Settings</a>
        
      </header>

      {progress && (
        <div className="border rounded p-3">
          <p><b>XP:</b> {progress.xp} &nbsp; <b>Level:</b> {progress.level} &nbsp; <b>Streak:</b> {progress.streak}</p>
        </div>
      )}

      {stats && (
          <div className="border rounded p-3">
            <p><b>Time on tracked sites today:</b> {stats.trackedMinutes} min</p>
            <p><b>Nudges shown:</b> {stats.nudgesShown}</p>
            <p><b>Quests after first nudge:</b> {stats.questsCompletedAfterFirstNudge}</p>
          </div>
        )}

      <section className="space-y-2">
        <p className="font-semibold">Pick a path</p>
        <div className="flex gap-2 flex-wrap">
          {PATHS.map((p) => (
            <button
              key={p}
              className={`border rounded px-3 py-1 ${p === path ? "font-bold" : ""}`}
              onClick={() => {
                setPath(p);
                loadQuests(p);
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <p className="font-semibold">How are you?</p>
        <div className="flex gap-2 flex-wrap">
          {MOODS.map((m) => (
            <button
              key={m}
              className={`border rounded px-3 py-1 ${m === mood ? "font-bold" : ""}`}
              onClick={() => setMood(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <button 
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => loadQuests()}
          disabled={quests.length > 0}
        >
          {quests.length > 0 ? "✓ Quests loaded" : "Get 3 quests"}
        </button>

        {msg && (
          <div className={`p-3 rounded-lg ${
            msg.includes("Nice") || msg.includes("Noted") || msg.includes("✓") || msg.includes("✨")
              ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-900 dark:text-green-100"
              : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-100"
          }`}>
            {msg}
          </div>
        )}
      </section>

      <section className="space-y-2">
        <p className="font-semibold">Optional moment (1 line)</p>
        <input
          className="w-full max-w-xl border p-2 rounded"
          placeholder="e.g., Felt calmer after stepping outside"
          value={momentText}
          onChange={(e) => setMomentText(e.target.value)}
        />
      </section>

      <section className="space-y-3">
        {quests.length === 0 ? (
          <div className="border rounded-lg p-8 text-center bg-gray-50 dark:bg-gray-900">
            <p className="text-lg font-semibold mb-2">Ready for a tiny quest?</p>
            <p className="text-sm opacity-70 mb-4">
              Pick a path and mood above, then click "Get 3 quests" to see personalized suggestions.
            </p>
            <p className="text-xs opacity-60">
              💡 Tip: Sensum learns what you like. Complete quests you enjoy, skip the rest!
            </p>
          </div>
        ) : (
          quests.map((q) => (
            <div key={q.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <p className="font-semibold text-lg">{q.title}</p>
              <p className="text-sm opacity-80 mt-1">{q.prompt}</p>
              <p className="text-xs mt-2 opacity-60">
                ⏱️ ~{Math.floor(q.durationSec / 60)} min · {q.category}
              </p>
              <div className="flex gap-2 mt-3">
                <button 
                  className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium"
                  onClick={() => completeQuest(q)}
                >
                  ✓ Complete
                </button>
                <button 
                  className="flex-1 border border-gray-300 dark:border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => handleSkip(q.id)}
                >
                  Not interested
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {showAchievementModal && (
        <AchievementModal
          achievements={newAchievements}
          onClose={() => setShowAchievementModal(false)}
        />
      )}

    </main>
  );
}
