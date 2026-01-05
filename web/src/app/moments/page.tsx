"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Moment = {
  id: number;
  text: string;
  createdAt: string;
};

type QuestCompletion = {
  id: number;
  questId: number;
  title: string | null;
  category: string | null;
  mood: string | null;
  momentText: string | null;
  completedAt: string;
};

export default function MomentsPage() {
  const router = useRouter();
  const [moments, setMoments] = useState<Moment[]>([]);
  const [questCompletions, setQuestCompletions] = useState<QuestCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const [questLimit, setQuestLimit] = useState(10);
  const [questHasMore, setQuestHasMore] = useState(true);

  function dayKey(iso: string) {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function dayLabel(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }

  function groupByDay<T>(items: T[], getIso: (item: T) => string) {
    const groups = new Map<string, { label: string; items: T[] }>();

    for (const item of items) {
      const iso = getIso(item);
      const key = dayKey(iso);
      const label = dayLabel(iso);
      const existing = groups.get(key);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.set(key, { label, items: [item] });
      }
    }

    return Array.from(groups.entries())
      .sort(([a], [b]) => (a < b ? 1 : a > b ? -1 : 0))
      .map(([key, value]) => ({ key, ...value }));
  }

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (!id) {
      router.push("/login");
      return;
    }

    void load();
  }, [router]);

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (!id) return;

    void loadQuestCompletions(questLimit);
  }, [questLimit]);

  async function loadQuestCompletions(limit: number) {
    try {
      const completionsRes = await fetch(`/api/me/quests/completions?limit=${limit}`, {
        cache: "no-store",
        credentials: "include",
      });

      if (completionsRes.status === 401 || completionsRes.status === 403) {
        router.push("/login");
        return;
      }

      if (!completionsRes.ok) {
        setMsg("Failed to load quest history");
        setQuestCompletions([]);
        setQuestHasMore(false);
        return;
      }

      const completionsData: QuestCompletion[] = await completionsRes.json();
      const list = Array.isArray(completionsData) ? completionsData : [];
      setQuestCompletions(list);
      setQuestHasMore(list.length >= limit);
    } catch (err) {
      console.error("Failed to load quest history:", err);
      setMsg("Failed to load quest history");
      setQuestCompletions([]);
      setQuestHasMore(false);
    }
  }

  async function load() {
    setMsg("");
    setLoading(true);
    try {
      await loadQuestCompletions(questLimit);

      const res = await fetch("/api/me/moments?limit=50", {
        cache: "no-store",
        credentials: "include",
      });

      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        setMsg("Failed to load moments");
        setMoments([]);
        return;
      }

      const data: Moment[] = await res.json();
      setMoments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load moments:", err);
      setMsg("Failed to load moments");
      setMoments([]);
      setQuestCompletions([]);
    } finally {
      setLoading(false);
    }
  }

  async function createMoment() {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMsg("");
    setSaving(true);

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
        setMsg(t || "Failed to save moment");
        return;
      }

      const created: Moment = await res.json();
      setMoments((prev) => [created, ...prev].slice(0, 50));
      setText("");
      setMsg("✓ Moment saved");
      setTimeout(() => setMsg(""), 2500);
    } catch (err) {
      console.error("Failed to save moment:", err);
      setMsg("Failed to save moment");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30 flex items-center justify-center text-white font-bold">S</div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Moments</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Saved reflections</p>
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
            <a className="nav-pill" href="/">Today</a>
            <a className="nav-pill" href="/profile">Profile</a>
            <a className="nav-pill" href="/settings">Settings</a>
          </nav>
        </header>

        {msg ? (
          <div className={msg.startsWith("✓") ? "alert alert-success" : "alert alert-error"}>{msg}</div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          {loading ? (
            <div className="card lg:col-span-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Loading...</h2>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {questCompletions.length === 0 ? (
                  <div className="empty-card">
                    <p className="text-lg font-semibold">No completed quests yet</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Complete a quest to see it show up here.</p>
                  </div>
                ) : (
                  <div className="card space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Quests</p>
                      {questHasMore ? (
                        <button
                          className="pill pill-ghost"
                          onClick={() => setQuestLimit((n) => n + 10)}
                        >
                          Load 10 more
                        </button>
                      ) : null}
                    </div>
                    <div className="space-y-5">
                      {groupByDay(questCompletions, (c) => c.completedAt).map((group) => (
                        <div key={group.key} className="space-y-3">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{group.label}</p>
                          <div className="space-y-3">
                            {group.items.map((c) => (
                              <div
                                key={c.id}
                                className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-semibold text-slate-900 dark:text-slate-50">{c.title ?? "Quest"}</p>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                      {new Date(c.completedAt).toLocaleTimeString()}
                                    </span>
                                  </div>
                                  {c.category ? <span className="pill pill-ghost">{c.category}</span> : null}
                                </div>

                                <div className="mt-2 flex flex-wrap gap-2">
                                  {c.mood ? <span className="pill pill-ghost">Mood: {c.mood}</span> : null}
                                </div>

                                {c.momentText ? (
                                  <p className="mt-2 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{c.momentText}</p>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {moments.length === 0 ? (
                  <div className="empty-card">
                    <p className="text-lg font-semibold">No moments yet</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Add a reflection here any time, even without completing a quest.</p>
                  </div>
                ) : (
                  <div className="card space-y-3">
                    <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Moments</p>
                    <div className="space-y-5">
                      {groupByDay(moments, (m) => m.createdAt).map((group) => (
                        <div key={group.key} className="space-y-3">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{group.label}</p>
                          <div className="space-y-3">
                            {group.items.map((m) => (
                              <div
                                key={m.id}
                                className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800"
                              >
                                <div className="flex justify-end items-start">
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {new Date(m.createdAt).toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="mt-2 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{m.text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="card space-y-3">
                  <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Add a moment</p>
                  <textarea
                    className="input min-h-24 resize-none"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    maxLength={200}
                    placeholder="What went well today? What are you proud of?"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{text.trim().length}/200</span>
                    <button
                      className="btn-primary"
                      onClick={createMoment}
                      disabled={saving || !text.trim()}
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
