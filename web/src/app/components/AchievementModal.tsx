'use client';

import { useEffect, useMemo, useState } from 'react';

interface Achievement {
  id: number;
  name: string;
  icon: string;
  description: string;
}

interface AchievementModalProps {
  achievements: Achievement[];
  onClose: () => void;
}

export default function AchievementModal({
  achievements,
  onClose,
}: AchievementModalProps) {
  const [confetti, setConfetti] = useState(true);

  const confettiPieces = useMemo(
    () =>
      [...Array(18)].map(() => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2 + Math.random() * 1.6,
        size: 6 + Math.random() * 6,
      })),
    []
  );

  useEffect(() => {
    // Hide confetti after 3 seconds
    const timer = setTimeout(() => setConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-md">
        {confetti && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            {confettiPieces.map((p, i) => (
              <div
                key={i}
                className="absolute rounded-full bg-blue-500"
                style={{
                  left: `${p.left}%`,
                  top: `-12px`,
                  width: `${p.size}px`,
                  height: `${p.size}px`,
                  animation: `fall ${p.duration}s linear ${p.delay}s infinite`,
                }}
              />
            ))}
          </div>
        )}

        <div className="card relative z-10 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30 flex items-center justify-center text-white font-bold">
                S
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">New achievements</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">You earned new badges</p>
              </div>
            </div>

            <button onClick={onClose} className="pill pill-ghost">
              Close
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="stat-pill">
                <div className="flex items-start gap-3">
                  <div className="text-3xl leading-none">{achievement.icon}</div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-slate-50 truncate">
                      {achievement.name}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {achievement.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <button onClick={onClose} className="btn-primary w-full">
              Awesome
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}