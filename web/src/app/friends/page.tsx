import { Suspense } from "react";
import FriendsClient from "./FriendsClient";

export default function FriendsPage() {
  return (
    <Suspense
      fallback={
        <main className="p-6">
          <h1 className="text-2xl font-bold">Loading friends...</h1>
        </main>
      }
    >
      <FriendsClient />
    </Suspense>
  );
}