"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type InviteResponse = { code: string; link: string };

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

export default function FriendsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [userId, setUserId] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  const [invite, setInvite] = useState<InviteResponse | null>(null);
  const [acceptCode, setAcceptCode] = useState("");

  const [friends, setFriends] = useState<FriendRow[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);

  const urlCode = useMemo(() => searchParams.get("code") || "", [searchParams]);

  useEffect(() => {
    const raw = localStorage.getItem("userId");
    if (!raw) {
      router.push("/login");
      return;
    }

    const id = Number(raw);
    setUserId(id);

    if (urlCode) setAcceptCode(urlCode);

    void refreshAll(id);
  }, [router, urlCode]);

  async function refreshAll(id = userId ?? undefined) {
    if (!id) return;
    await Promise.all([loadFriends(id), loadFeed(id)]);
  }

  async function loadFriends(id: number) {
    const res = await fetch(`/api/friends?userId=${encodeURIComponent(String(id))}`, {
      cache: "no-store",
      credentials: "include",
    });

    if (!res.ok) {
      setMsg("Failed to load friends");
      return;
    }
    setFriends(await res.json());
  }

  async function loadFeed(id: number) {
    const res = await fetch(`/api/friends/feed?userId=${encodeURIComponent(String(id))}`, {
      cache: "no-store",
      credentials: "include",
    });

    if (!res.ok) {
      // Feed is optional; don't block the whole page on it
      setFeed([]);
      return;
    }
    setFeed(await res.json());
  }

  async function generateInvite() {
    if (!userId) return;
    setMsg("");

    const res = await fetch("/api/friends/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId }),
    });

    if (!res.ok) {
      setMsg("Invite failed");
      return;
    }

    const data: InviteResponse = await res.json();
    setInvite(data);
    setMsg("Invite created");
  }

  async function acceptInvite() {
    if (!userId) return;
    if (!acceptCode.trim()) {
      setMsg("Enter an invite code");
      return;
    }

    setMsg("");

    const res = await fetch("/api/friends/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, code: acceptCode.trim() }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      setMsg(text || "Accept failed");
      return;
    }

    setMsg("Friend added");
    setInvite(null);

    // clean the URL if it had ?code=...
    router.replace("/friends");

    await refreshAll(userId);
  }

  async function removeFriend(friendId: number) {
    if (!userId) return;

    const friendToRemove = friends.find((f) => f.friendId === friendId);
    const confirmed = window.confirm(
      `Remove ${friendToRemove?.friendEmail || "this friend"} from your friends? You can always re-add them later.`
    );

    if (!confirmed) return;

    setMsg("");

    const res = await fetch(
      `/api/friends/${friendId}?userId=${encodeURIComponent(String(userId))}`,
      { method: "DELETE", credentials: "include" }
    );

    if (!res.ok) {
      setMsg("❌ Couldn't remove friend. Please try again.");
      return;
    }

    setMsg("✓ Friend removed");
    setTimeout(() => setMsg(""), 3000);
    await refreshAll(userId);
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
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Friends</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Invite-only, low-noise connections</p>
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

        <div className="space-y-4">
            <section className="card space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Account</p>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Your ID</h2>
                </div>
                <div className="pill pill-ghost">{userId ?? "(not logged in)"}</div>
              </div>
              {msg && <div className="alert">{msg}</div>}
            </section>

            <section className="card space-y-3">
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Invite</p>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Share a code</h2>
              </div>

              <button className="btn-primary" onClick={generateInvite}>
                Generate invite code
              </button>

              {invite && (
                <div className="space-y-2 text-sm">
                  <div className="stat-row">
                    <span>Code</span>
                    <strong>{invite.code}</strong>
                  </div>
                  <div className="stat-row">
                    <span>Link</span>
                    <a className="underline" href={invite.link}>
                      {invite.link}
                    </a>
                  </div>
                </div>
              )}
            </section>

            <section className="card space-y-3">
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Accept</p>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Enter a code</h2>
              </div>

              <div className="flex gap-2 flex-wrap items-center">
                <input
                  className="input w-full max-w-sm"
                  placeholder="Invite code"
                  value={acceptCode}
                  onChange={(e) => setAcceptCode(e.target.value)}
                />
                <button className="btn-primary" onClick={acceptInvite}>
                  Accept
                </button>
              </div>
            </section>

            <section className="card space-y-3">
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Friends</p>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Your list</h2>
              </div>

              {friends.length === 0 ? (
                <div className="empty-card">
                  <p className="text-lg font-semibold mb-2 text-slate-900 dark:text-slate-50">No friends yet</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                    Invite someone to share your journey! Friends can see your progress (based on your privacy settings).
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    👥 Sensum is invite-only. No public profiles, no algorithms, just supportive connections.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {friends.map((f) => (
                    <div key={f.friendId} className="quest-card">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-slate-50">{f.friendEmail}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                          id: {f.friendId} • {f.status}
                        </p>
                      </div>

                      {f.status === "accepted" && (
                        <button className="btn-ghost" onClick={() => removeFriend(f.friendId)}>
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="card space-y-3">
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Feed</p>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Friend activity</h2>
              </div>

              {feed.length === 0 ? (
                <div className="empty-card">
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {friends.length === 0
                      ? "Add friends to see their journey here"
                      : "Your friends haven't shared anything yet, or they've turned sharing off in settings"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {feed.map((item, idx) => (
                    <div key={`${item.friendId}-${item.at}-${idx}`} className="card">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-50">{item.friendEmail}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {new Date(item.at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 text-sm space-y-1 text-slate-700 dark:text-slate-200">
                        {(item.level != null || item.xp != null) && (
                          <p>
                            <b>Level:</b> {item.level ?? "—"} &nbsp; <b>XP:</b> {item.xp ?? "—"}
                          </p>
                        )}
                        {item.streak != null && (
                          <p>
                            <b>Streak:</b> {item.streak}
                          </p>
                        )}
                        {item.category && (
                          <p>
                            <b>Category:</b> {item.category}
                          </p>
                        )}
                        {item.momentText && (
                          <p>
                            <b>Moment:</b> {item.momentText}
                          </p>
                        )}
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
