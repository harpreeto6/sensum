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
      const res = await fetch(`/api/friends?userId=${userId}`);
      const data = await res.json();
      setFriends(data);
    } catch (err) {
      console.error('Failed to load friends:', err);
    }
  };

  const loadSessions = async () => {
    try {
      const res = await fetch(`/api/buddy/list?userId=${userId}`);
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
      const res = await fetch(`/api/buddy/session/${sessionId}`);
      const data = await res.json();
      setSessionDetails(data);
    } catch (err) {
      console.error('Failed to load details:', err);
    }
  };

  if (!userId) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Buddy Sessions</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('list')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'list'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600'
          }`}
        >
          My Sessions
        </button>
        <button
          onClick={() => setActiveTab('start')}
          className={`px-4 py-2 font-semibold ${
            activeTab === 'start'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600'
          }`}
        >
          Start New
        </button>
      </div>

      {/* Start New Session Tab */}
      {activeTab === 'start' && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-2xl font-bold mb-4">Start a Buddy Session</h2>
          <form onSubmit={startSession} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Friend
              </label>
              <select
                value={selectedFriend || ''}
                onChange={(e) => setSelectedFriend(Number(e.target.value))}
                className="w-full border rounded px-4 py-2"
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
              <label className="block text-sm font-medium mb-2">
                Activity Type
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full border rounded px-4 py-2"
              >
                <option value="study">Study</option>
                <option value="exercise">Exercise</option>
                <option value="meditation">Meditation</option>
                <option value="work">Work</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Duration (minutes): {duration}
              </label>
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

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700"
            >
              Create Session
            </button>
          </form>
        </div>
      )}

      {/* Sessions List Tab */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="bg-white p-6 rounded-lg text-center text-gray-500">
              No sessions yet
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="bg-white p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition"
                onClick={() => {
                  setSelectedSession(session.id);
                  loadSessionDetails(session.id);
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold capitalize mb-2">
                      {session.mode}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {session.durationMinutes} min
                    </p>
                  </div>
                  <span
                    className={`px-4 py-2 rounded font-semibold text-white ${
                      session.status === 'pending'
                        ? 'bg-yellow-500'
                        : session.status === 'active'
                        ? 'bg-green-500'
                        : 'bg-gray-500'
                    }`}
                  >
                    {session.status.toUpperCase()}
                  </span>
                </div>

                {(session.latestCheckinUserA || session.latestCheckinUserB) && (
                  <div className="bg-gray-50 p-3 rounded mb-4 text-sm">
                    {session.latestCheckinUserA && (
                      <p>User A: {session.latestCheckinUserA.status}</p>
                    )}
                    {session.latestCheckinUserB && (
                      <p>User B: {session.latestCheckinUserB.status}</p>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  {session.status === 'pending' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        joinSession(session.id);
                      }}
                      className="flex-1 bg-green-500 text-white py-2 rounded hover:bg-green-600"
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
                      className="flex-1 bg-red-500 text-white py-2 rounded hover:bg-red-600"
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

      {/* Session Details Modal */}
      {selectedSession && sessionDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold capitalize">
                {sessionDetails.mode}
              </h2>
              <button
                onClick={() => {
                  setSelectedSession(null);
                  setSessionDetails(null);
                }}
                className="text-2xl text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="font-bold mb-2">Info</h3>
                <p>
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
                <h3 className="font-bold mb-3">Check-ins</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {sessionDetails.checkins && sessionDetails.checkins.length > 0 ? (
                    sessionDetails.checkins.map((checkin: any) => (
                      <div
                        key={checkin.id}
                        className="bg-blue-50 p-3 rounded text-sm border-l-4 border-blue-500"
                      >
                        <p className="font-semibold">
                          User {checkin.userId}: {checkin.status}
                        </p>
                        <p className="text-gray-600">
                          {new Date(checkin.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No check-ins</p>
                  )}
                </div>
              </div>

              {sessionDetails.status === 'active' && (
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-bold mb-2">Check in</h3>
                  <div className="flex gap-2">
                    <select
                      value={checkinStatus}
                      onChange={(e) => setCheckinStatus(e.target.value)}
                      className="flex-1 border rounded px-3 py-2"
                    >
                      <option value="doing_well">Doing Well</option>
                      <option value="need_break">Need Break</option>
                      <option value="energized">Energized</option>
                    </select>
                    <button
                      onClick={() => submitCheckin(selectedSession)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
    </div>
  );
}