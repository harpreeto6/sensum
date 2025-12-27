"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      setErr("Signup failed (email might already exist)");
      return;
    }

    const data = await res.json(); // { userId }
    localStorage.setItem("userId", String(data.userId));
    router.push("/");
  }

  return (
    <main className="p-6 max-w-md">
      <h1 className="text-2xl font-bold">Sign up</h1>

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
          Create account
        </button>
      </form>

      <p className="mt-4">
        Already have an account? <a className="underline" href="/login">Login</a>
      </p>
    </main>
  );
}
