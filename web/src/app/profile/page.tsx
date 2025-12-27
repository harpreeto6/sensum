"use client";

import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setUserId(localStorage.getItem("userId"));
  }, []);

  return (
    <main className="p-6 space-y-4">
      <header className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Profile</h1>
        <a className="underline" href="/">Today</a>
      </header>

      <p><b>User ID:</b> {userId ?? "(not logged in)"}</p>
      <p className="opacity-80">
        (Day 2 simple version: progress is shown on Today after completing a quest.)
      </p>
    </main>
  );
}
