import { Suspense } from "react";
import FriendsClient from "./FriendsClient";

export default function FriendsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
          <div className="mx-auto max-w-5xl px-4 py-8">
            <div className="card">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Loading friends...</h1>
            </div>
          </div>
        </main>
      }
    >
      <FriendsClient />
    </Suspense>
  );
}