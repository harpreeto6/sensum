'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type LeaderboardEntry = {
  rank: number;
  userId: number;
  email: string;
  xp: number;
  level: number;
  streak: number;
  questCount?: number;
};

export default function LeaderboardPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [view, setView] = useState<'global' | 'friends'>('global');
  const [metric, setMetric] = useState<'xp' | 'streak' | 'level' | 'quest_count'>('xp');

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
    loadLeaderboard();
  }, [userId, view, metric]);

  const loadLeaderboard = async () => {
    try {
      const endpoint = view === 'global'
        ? `/api/leaderboard/global?type=${metric}`
        : `/api/leaderboard/friends?userId=${userId}&type=${metric}`;
      
      const res = await fetch(endpoint);
      const data = await res.json();
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    }
  };

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}.`;
  };

  const getMetricValue = (entry: LeaderboardEntry) => {
    switch (metric) {
      case 'xp':
        return `${entry.xp} XP`;
      case 'streak':
        return `${entry.streak} days`;
      case 'level':
        return `Level ${entry.level}`;
      case 'quest_count':
        return `${entry.questCount || 0} quests`;
    }
  };

  if (!userId) return <div className="p-8">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-6">🏆 Leaderboard</h1>

      {/* View Toggle */}
      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setView('global')}
          className={`px-6 py-2 rounded font-semibold ${
            view === 'global'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Global
        </button>
        <button
          onClick={() => setView('friends')}
          className={`px-6 py-2 rounded font-semibold ${
            view === 'friends'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Friends
        </button>
      </div>

      {/* Metric Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Rank by:</label>
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value as any)}
          className="border rounded px-4 py-2"
        >
          <option value="xp">XP</option>
          <option value="streak">Streak</option>
          <option value="level">Level</option>
          <option value="quest_count">Quest Count</option>
        </select>
      </div>

      {/* Leaderboard List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {leaderboard.length === 0 ? (
          <div className="p-6 text-center text-gray-500">No data yet</div>
        ) : (
          <div className="divide-y">
            {leaderboard.map((entry) => (
              <div
                key={entry.userId}
                className={`p-4 flex items-center gap-4 ${
                  entry.userId === userId
                    ? 'bg-blue-50 border-l-4 border-blue-600'
                    : ''
                }`}
              >
                {/* Rank */}
                <div className="text-2xl font-bold w-12 text-center">
                  {getMedalEmoji(entry.rank)}
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <p className="font-semibold">
                    {entry.email}
                    {entry.userId === userId && (
                      <span className="ml-2 text-sm text-blue-600">(You)</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600">
                    Level {entry.level} • {entry.streak} day streak
                  </p>
                </div>

                {/* Metric Value */}
                <div className="text-right">
                  <p className="text-xl font-bold text-blue-600">
                    {getMetricValue(entry)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}