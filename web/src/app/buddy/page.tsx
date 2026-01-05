'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function BuddyPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<number | null>(null);
  const [mode, setMode] = useState('study');
  const [duration, setDuration] = useState(30);
  const [activeTab, setActiveTab] = useState<'start' | 'list'>('list');
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [checkinStatus, setCheckinStatus] = useState('doing_well');
  const [sessionDetails, setSessionDetails] = useState<any>(null);

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
    loadFriends();
    loadSessions();
    const interval = setInterval(loadSessions, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  const loadFriends = async () => {
    try {
      const res = await fetch(`/api/friends?userId=${userId}`, { credentials: "include" });
      const data = await res.json();
      setFriends(data);
    } catch (err) {
      console.error('Failed to load friends:', err);
    }
  };

  const loadSessions = async () => {
    try {
      const res = await fetch(`/api/buddy/list?userId=${userId}`, { credentials: "include" });
      const data = await res.json();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    }
  };

  const startSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFriend) {
      alert('Please select a friend');
      return;
    }

    try {
      const res = await fetch('/api/buddy/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({
          userId,
          friendId: selectedFriend,
          mode,
          durationMinutes: duration,
        }),
      });

      if (!res.ok) throw new Error('Failed to start session');
      alert('Session created!');
      setSelectedFriend(null);
      setMode('study');
      setDuration(30);
      setActiveTab('list');
      loadSessions();
    } catch (err) {
      alert('Error: ' + (err as Error).message);
    }
  };

  const joinSession = async (sessionId: number) => {
    try {
      const res = await fetch('/api/buddy/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({ sessionId, userId }),
      });

      if (!res.ok) throw new Error('Failed to join');
      alert('Joined!');
      loadSessions();
    } catch (err) {
      alert('Error: ' + (err as Error).message);
    }
  };

  const submitCheckin = async (sessionId: number) => {
    try {
      const res = await fetch('/api/buddy/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({
          sessionId,
          userId,
          status: checkinStatus,
        }),
      });

      if (!res.ok) throw new Error('Failed');
      alert('Checked in!');
      loadSessions();
      loadSessionDetails(sessionId);
    } catch (err) {
      alert('Error: ' + (err as Error).message);
    }
  };

  const endSession = async (sessionId: number) => {
    try {
      const res = await fetch('/api/buddy/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: "include",
        body: JSON.stringify({ sessionId, userId }),
      });

      if (!res.ok) throw new Error('Failed');
      alert('Session ended!');
      setSelectedSession(null);
      setSessionDetails(null);
      loadSessions();
    } catch (err) {
      alert('Error: ' + (err as Error).message);
    }
  };

  const loadSessionDetails = async (sessionId: number) => {
    try {
      const res = await fetch(`/api/buddy/session/${sessionId}`, { credentials: "include" });
      const data = await res.json();
      setSessionDetails(data);
    } catch (err) {
      console.error('Failed to load details:', err);
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
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Buddy</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Co-work and check in together</p>
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
            <section className="card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Sessions</p>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Buddy Sessions</h2>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab('list')}
                    className={activeTab === 'list' ? 'pill pill-active' : 'pill pill-ghost'}
                  >
                    My Sessions
                  </button>
                  <button
                    onClick={() => setActiveTab('start')}
                    className={activeTab === 'start' ? 'pill pill-active' : 'pill pill-ghost'}
                  >
                    Start New
                  </button>
                </div>
              </div>
            </section>

            {activeTab === 'start' && (
              <section className="card space-y-4">
                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">New</p>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Start a session</h2>
                </div>

                <form onSubmit={startSession} className="space-y-4">
                  <div>
                    <label className="label">Select Friend</label>
                    <select
                      value={selectedFriend || ''}
                      onChange={(e) => setSelectedFriend(Number(e.target.value))}
                      className="input w-full"
                    >
                      <option value="">-- Choose a friend --</option>
                      {friends.map((f) => (
                        <option key={f.friendId} value={f.friendId}>
                          {f.friendEmail}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Activity Type</label>
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value)}
                      className="input w-full"
                    >
                      <option value="study">Study</option>
                      <option value="exercise">Exercise</option>
                      <option value="meditation">Meditation</option>
                      <option value="work">Work</option>
                    </select>
                  </div>

                  <div>
                    <label className="label">Duration (minutes): {duration}</label>
                    <input
                      type="range"
                      min="15"
                      max="180"
                      step="15"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <button type="submit" className="btn-primary">
                    Create Session
                  </button>
                </form>
              </section>
            )}

            {activeTab === 'list' && (
              <div className="space-y-4">
                {sessions.length === 0 ? (
                  <div className="empty-card">No sessions yet</div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className="quest-card cursor-pointer"
                      onClick={() => {
                        setSelectedSession(session.id);
                        loadSessionDetails(session.id);
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-50">Session #{session.id}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-300">
                            Mode: {session.mode ?? "—"} • Duration: {session.durationMinutes ?? "—"}m
                          </p>
                        </div>
                        <span
                          className={`pill ${
                            session.status === 'active' ? 'pill-active' : 'pill-ghost'
                          }`}
                        >
                          {String(session.status || "").toUpperCase() || "—"}
                        </span>
                      </div>

                      {(session.latestCheckinUserA || session.latestCheckinUserB) && (
                        <div className="mt-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/40 p-3 text-sm">
                          {session.latestCheckinUserA && (
                            <p className="text-slate-700 dark:text-slate-200">User A: {session.latestCheckinUserA.status}</p>
                          )}
                          {session.latestCheckinUserB && (
                            <p className="text-slate-700 dark:text-slate-200">User B: {session.latestCheckinUserB.status}</p>
                          )}
                        </div>
                      )}

                      <div className="mt-4 flex gap-2">
                        {session.status === 'pending' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              joinSession(session.id);
                            }}
                            className="btn-primary"
                          >
                            Join
                          </button>
                        )}
                        {session.status === 'active' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              endSession(session.id);
                            }}
                            className="btn-primary"
                          >
                            End
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
      </div>

      {selectedSession && sessionDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-0">
            <div className="sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 p-6 flex justify-between items-center">
              <h2 className="text-xl font-semibold capitalize text-slate-900 dark:text-slate-50">
                {sessionDetails.mode}
              </h2>
              <button
                onClick={() => {
                  setSelectedSession(null);
                  setSessionDetails(null);
                }}
                className="pill pill-ghost"
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 p-4">
                <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">Info</h3>
                <p className="text-slate-700 dark:text-slate-200">
                  Status:{' '}
                  <span
                    className={`font-semibold ${
                      sessionDetails.status === 'active'
                        ? 'text-green-600'
                        : 'text-yellow-600'
                    }`}
                  >
                    {sessionDetails.status.toUpperCase()}
                  </span>
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-3">Check-ins</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {sessionDetails.checkins && sessionDetails.checkins.length > 0 ? (
                    sessionDetails.checkins.map((checkin: any) => (
                      <div
                        key={checkin.id}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/40 p-3 text-sm"
                      >
                        <p className="font-semibold text-slate-900 dark:text-slate-50">
                          User {checkin.userId}: {checkin.status}
                        </p>
                        <p className="text-slate-600 dark:text-slate-300">
                          {new Date(checkin.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-600 dark:text-slate-300">No check-ins</p>
                  )}
                </div>
              </div>

              {sessionDetails.status === 'active' && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 p-4">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50 mb-2">Check in</h3>
                  <div className="flex gap-2">
                    <select
                      value={checkinStatus}
                      onChange={(e) => setCheckinStatus(e.target.value)}
                      className="input flex-1"
                    >
                      <option value="doing_well">Doing Well</option>
                      <option value="need_break">Need Break</option>
                      <option value="energized">Energized</option>
                    </select>
                    <button
                      onClick={() => submitCheckin(selectedSession)}
                      className="btn-primary"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}