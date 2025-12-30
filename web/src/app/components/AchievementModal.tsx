'use client';

import { useEffect, useState } from 'react';

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

  useEffect(() => {
    // Hide confetti after 3 seconds
    const timer = setTimeout(() => setConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
        {/* Confetti effect (simple CSS) */}
        {confetti && (
          <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-10px`,
                  animation: `fall ${2 + Math.random() * 2}s linear infinite`,
                }}
              />
            ))}
          </div>
        )}

        {/* Content */}
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-4">🎉 Congratulations!</h2>
          <p className="text-gray-600 mb-6">You earned new badges!</p>

          {/* Achievement Cards */}
          <div className="space-y-3 mb-6">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border-2 border-yellow-300"
              >
                <div className="text-4xl mb-2">{achievement.icon}</div>
                <h3 className="font-bold text-lg">{achievement.name}</h3>
                <p className="text-sm text-gray-600">{achievement.description}</p>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700"
          >
            Awesome! 🎯
          </button>
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