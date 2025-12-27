"use client";

import { useEffect, useState } from "react";

type Moment = {
  when: string;
  title: string;
  mood: string;
  momentText: string;
};

export default function MomentsPage() {
  const [moments, setMoments] = useState<Moment[]>([]);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("moments") || "[]");
    setMoments(data);
  }, []);

  return (
    <main className="p-6 space-y-4">
      <header className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Moments</h1>
        <a className="underline" href="/">Today</a>
      </header>

      {moments.length === 0 && <p>No moments yet.</p>}

      <div className="space-y-3">
        {moments.map((m, idx) => (
          <div key={idx} className="border rounded p-3">
            <p className="font-semibold">{m.title}</p>
            <p className="text-sm opacity-80">{new Date(m.when).toLocaleString()}</p>
            <p className="text-sm">Mood: {m.mood}</p>
            {m.momentText && <p className="mt-2">{m.momentText}</p>}
          </div>
        ))}
      </div>
    </main>
  );
}
