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
    <main className="p-6 space-y-6">
      <header className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Friends</h1>
        <a className="underline" href="/">Today</a>
        <a className="underline" href="/moments">Moments</a>
        <a className="underline" href="/profile">Profile</a>
      </header>

      <section className="border rounded p-3 space-y-2">
        <p>
          <b>User ID:</b> {userId ?? "(not logged in)"}
        </p>
        {msg && <p>{msg}</p>}
      </section>

      <section className="border rounded p-3 space-y-3">
        <h2 className="text-lg font-semibold">Invite</h2>

        <button className="border px-4 py-2 rounded" onClick={generateInvite}>
          Generate invite code
        </button>

        {invite && (
          <div className="space-y-1">
            <p>
              <b>Code:</b> {invite.code}
            </p>
            <p>
              <b>Link:</b>{" "}
              <a className="underline" href={invite.link}>
                {invite.link}
              </a>
            </p>
          </div>
        )}
      </section>

      <section className="border rounded p-3 space-y-3">
        <h2 className="text-lg font-semibold">Accept invite</h2>

        <div className="flex gap-2 flex-wrap items-center">
          <input
            className="border rounded p-2 w-full max-w-sm"
            placeholder="Invite code"
            value={acceptCode}
            onChange={(e) => setAcceptCode(e.target.value)}
          />
          <button className="border px-4 py-2 rounded" onClick={acceptInvite}>
            Accept
          </button>
        </div>
      </section>

      <section className="border rounded p-3 space-y-3">
        <h2 className="text-lg font-semibold">Your friends</h2>

        {friends.length === 0 ? (
          <div className="border rounded-lg p-8 text-center bg-gray-50 dark:bg-gray-900">
            <p className="text-lg font-semibold mb-2">No friends yet</p>
            <p className="text-sm opacity-70 mb-4">
              Invite someone to share your journey! Friends can see your progress (based on your privacy settings).
            </p>
            <p className="text-xs opacity-60">
              👥 Sensum is invite-only. No public profiles, no algorithms, just supportive connections.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map((f) => (
              <div key={f.friendId} className="border rounded p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{f.friendEmail}</p>
                  <p className="text-sm opacity-80">
                    id: {f.friendId} • {f.status}
                  </p>
                </div>

                {f.status === "accepted" && (
                  <button className="border px-3 py-1 rounded" onClick={() => removeFriend(f.friendId)}>
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="border rounded p-3 space-y-3">
        <h2 className="text-lg font-semibold">Friend activity</h2>

        {feed.length === 0 ? (
          <div className="border rounded-lg p-6 text-center bg-gray-50 dark:bg-gray-900">
            <p className="text-sm opacity-70">
              {friends.length === 0
                ? "Add friends to see their journey here"
                : "Your friends haven't shared anything yet, or they've turned sharing off in settings"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {feed.map((item, idx) => (
              <div key={`${item.friendId}-${item.at}-${idx}`} className="border rounded p-3">
                <p className="font-semibold">{item.friendEmail}</p>
                <p className="text-sm opacity-80">{new Date(item.at).toLocaleString()}</p>

                <div className="mt-2 text-sm space-y-1">
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
    </main>
  );
}
