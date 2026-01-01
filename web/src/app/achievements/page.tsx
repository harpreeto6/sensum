'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Achievement {
  id: number;
  name: string;
  icon: string;
  description: string;
  unlocked?: boolean;
  unlockedAt?: string;
}

export default function AchievementsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<number | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [unlockedCount, setUnlockedCount] = useState(0);

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
    loadAchievements();
  }, [userId]);

  const loadAchievements = async () => {
    try {
      const res = await fetch(`/api/achievements/all?userId=${userId}`, {credentials: "include"});
      
      if (!res.ok) {
        console.error('Failed to load achievements:', res.status);
        return;
      }
      
      const data = await res.json();
      
      // Make sure data is an array before setting
      if (Array.isArray(data)) {
        setAchievements(data);
        setUnlockedCount(data.filter((a: Achievement) => a.unlocked).length);
      } else {
        console.error('Expected array, got:', data);
      }
    } catch (err) {
      console.error('Failed to load achievements:', err);
    }
  };

  if (!userId) return <div className="p-8">Loading...</div>;

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  return (
    <div className="max-w-6xl mx-auto p-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-2">Achievements</h1>
      <p className="text-xl text-gray-600 mb-6">
        {unlockedCount} / {achievements.length} earned
      </p>

      {/* Unlocked Achievements */}
      {unlocked.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">🏆 Unlocked</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlocked.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-gradient-to-br from-yellow-100 to-orange-100 p-6 rounded-lg border-2 border-yellow-400 shadow-md"
              >
                <div className="text-5xl mb-3">{achievement.icon}</div>
                <h3 className="text-xl font-bold mb-2">{achievement.name}</h3>
                <p className="text-sm text-gray-700 mb-3">
                  {achievement.description}
                </p>
                {achievement.unlockedAt && (
                  <p className="text-xs text-gray-600">
                    Earned on {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Achievements */}
      {locked.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">🔒 Locked</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locked.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-gray-200 p-6 rounded-lg border-2 border-gray-400 shadow-md opacity-60"
              >
                <div className="text-5xl mb-3 grayscale">{achievement.icon}</div>
                <h3 className="text-xl font-bold mb-2 text-gray-600">
                  {achievement.name}
                </h3>
                <p className="text-sm text-gray-600">
                  {achievement.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}