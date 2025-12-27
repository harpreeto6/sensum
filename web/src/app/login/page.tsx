"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      setErr("Login failed");
      return;
    }

    const data = await res.json(); // expects { userId: number }
    localStorage.setItem("userId", String(data.userId));
    router.push("/");
  }

  return (
    <main className="p-6 max-w-md">
      <h1 className="text-2xl font-bold">Login</h1>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input
          className="w-full border p-2 rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full border p-2 rounded"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {err && <p className="text-red-600">{err}</p>}
        <button className="border px-4 py-2 rounded" type="submit">
          Log in
        </button>
      </form>

      <p className="mt-4">
        No account? <a className="underline" href="/signup">Sign up</a>
      </p>
    </main>
  );
}
