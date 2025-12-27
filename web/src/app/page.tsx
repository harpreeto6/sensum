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

  useEffect(() => {
    const raw = localStorage.getItem("userId");
    if (!raw) {
      router.push("/login");
      return;
    }
    setUserId(Number(raw));

    const savedPath = localStorage.getItem("path");
    if (savedPath && PATHS.includes(savedPath as any)) setPath(savedPath as any);
  }, [router]);

  async function loadQuests(selectedPath = path) {
    setMsg("");
    localStorage.setItem("path", selectedPath);

    const res = await fetch(`/api/quests/recommendations?path=${encodeURIComponent(selectedPath)}`, {
      cache: "no-store",
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
    setMsg(`Nice. +${data.gainedXp} XP`);
    await loadQuests(path);
  }

  return (
    <main className="p-6 space-y-5">
      <header className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Sensum — Today</h1>
        <a className="underline" href="/moments">Moments</a>
        <a className="underline" href="/profile">Profile</a>
      </header>

      {progress && (
        <div className="border rounded p-3">
          <p><b>XP:</b> {progress.xp} &nbsp; <b>Level:</b> {progress.level} &nbsp; <b>Streak:</b> {progress.streak}</p>
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
        <button className="border px-4 py-2 rounded" onClick={() => loadQuests()}>
          Get 3 quests
        </button>

        {msg && <p>{msg}</p>}
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
        {quests.map((q) => (
          <div key={q.id} className="border rounded p-3">
            <p className="font-semibold">{q.title}</p>
            <p className="text-sm opacity-80">{q.prompt}</p>
            <p className="text-sm mt-1">~ {q.durationSec}s • {q.category}</p>
            <button className="border px-3 py-1 rounded mt-2" onClick={() => completeQuest(q)}>
              Complete
            </button>
          </div>
        ))}
      </section>
    </main>
  );
}
