"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const PATHS = ["music", "fitness", "study", "friends", "calm", "outdoors"] as const;

type Settings = {
  selectedPaths: string;     // JSON string
  nudgeThresholdSec: number;
  trackedDomains: string;    // JSON string
  shareLevel: boolean;
  shareStreak: boolean;
  shareCategories: boolean;
  shareMoments: boolean;
};

export default function SettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const [settings, setSettings] = useState<Settings | null>(null);
  const [domainInput, setDomainInput] = useState("");

  const selectedPaths = useMemo<string[]>(() => {
    try {
      return settings ? JSON.parse(settings.selectedPaths || "[]") : [];
    } catch {
      return [];
    }
  }, [settings]);

  const trackedDomains = useMemo<string[]>(() => {
    try {
      return settings ? JSON.parse(settings.trackedDomains || "[]") : [];
    } catch {
      return [];
    }
  }, [settings]);

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (!id) {
      router.push("/login");
      return;
    }

    void load();
  }, [router]);

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore network errors; still clear local state and redirect.
    } finally {
      localStorage.removeItem("userId");
      router.push("/login");
    }
  }

  async function load() {
    setMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/me/settings", {
        cache: "no-store",
        credentials: "include",
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        setMsg("Failed to load settings");
        setSettings(null);
        return;
      }

      const data: Settings = await res.json();
      setSettings(data);
    } catch (err) {
      console.error("Failed to load settings:", err);
      setMsg("Failed to load settings");
      setSettings(null);
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    if (!settings) return;
    setMsg("");
    setSaving(true);

    try {
      const res = await fetch("/api/me/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        setMsg(text || "Save failed");
        return;
      }

      const data: Settings = await res.json();
      setSettings(data);
      setMsg("✓ Settings saved");
    } catch (err) {
      console.error("Failed to save settings:", err);
      setMsg("Save failed");
    } finally {
      setSaving(false);
    }
  }

  function togglePath(path: (typeof PATHS)[number]) {
    if (!settings) return;
    const next = selectedPaths.includes(path)
      ? selectedPaths.filter((p) => p !== path)
      : [...selectedPaths, path];
    setSettings({ ...settings, selectedPaths: JSON.stringify(next) });
  }

  function addDomain() {
    if (!settings) return;
    const raw = domainInput.trim();
    if (!raw) return;

    if (trackedDomains.includes(raw)) {
      setDomainInput("");
      return;
    }

    setSettings({ ...settings, trackedDomains: JSON.stringify([...trackedDomains, raw]) });
    setDomainInput("");
  }

  function removeDomain(domain: string) {
    if (!settings) return;
    setSettings({
      ...settings,
      trackedDomains: JSON.stringify(trackedDomains.filter((d) => d !== domain)),
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="card">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Loading settings...</h1>
          </div>
        </div>
      </main>
    );
  }

  if (!settings) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30 flex items-center justify-center text-white font-bold">S</div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Settings</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Paths, nudges, sharing</p>
              </div>
            </div>

            <nav className="flex gap-3 text-sm items-center">
              <details className="relative">
                <summary className="nav-pill cursor-pointer select-none">Menu</summary>
                <div className="absolute right-0 mt-2 w-56 card p-2 space-y-1 z-20">
                  <a className="pill pill-ghost block" href="/moments">📔 Moments</a>
                  <a className="pill pill-ghost block" href="/stats">📊 Stats</a>
                  <a className="pill pill-ghost block" href="/friends">👥 Friends</a>
                  <a className="pill pill-ghost block" href="/achievements">🏆 Achievements</a>
                  <a className="pill pill-ghost block" href="/leaderboard">🎖️ Leaderboard</a>
                  <a className="pill pill-ghost block" href="/buddy">🤝 Buddy</a>
                  <a className="pill pill-ghost block" href="/metrics">📈 Metrics</a>
                </div>
              </details>
              <a className="nav-pill" href="/">Today</a>
              <a className="nav-pill" href="/profile">Profile</a>
              <a className="nav-pill" href="/settings">Settings</a>
            </nav>
          </header>

          {msg && <div className="alert alert-error">{msg}</div>}

          <div className="card space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">Unable to load settings.</p>
            <button className="btn-primary w-fit" onClick={load}>Retry</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30 flex items-center justify-center text-white font-bold">S</div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Settings</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Paths, nudges, sharing</p>
            </div>
          </div>

          <nav className="flex gap-3 text-sm items-center">
            <details className="relative">
              <summary className="nav-pill cursor-pointer select-none">Menu</summary>
              <div className="absolute right-0 mt-2 w-56 card p-2 space-y-1 z-20">
                <a className="pill pill-ghost block" href="/moments">📔 Moments</a>
                <a className="pill pill-ghost block" href="/stats">📊 Stats</a>
                <a className="pill pill-ghost block" href="/friends">👥 Friends</a>
                <a className="pill pill-ghost block" href="/achievements">🏆 Achievements</a>
                <a className="pill pill-ghost block" href="/leaderboard">🎖️ Leaderboard</a>
                <a className="pill pill-ghost block" href="/buddy">🤝 Buddy</a>
                <a className="pill pill-ghost block" href="/metrics">📈 Metrics</a>
                <button className="pill pill-ghost block w-full text-left" type="button" onClick={logout}>🚪 Logout</button>
                <button className="pill pill-ghost block w-full text-left" type="button" onClick={logout}>🚪 Logout</button>
              </div>
            </details>
            <a className="nav-pill" href="/">Today</a>
            <a className="nav-pill" href="/profile">Profile</a>
            <a className="nav-pill" href="/settings">Settings</a>
          </nav>
        </header>

        {msg && (
          <div
            className={`alert ${
              msg.includes("✓") || msg.toLowerCase().includes("saved")
                ? "alert-success"
                : "alert-error"
            }`}
          >
            {msg}
          </div>
        )}

        <div className="space-y-4">
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Paths</p>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">What to focus on</h2>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Pick 1–3</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {PATHS.map((p) => (
                  <button
                    key={p}
                    className={`pill ${selectedPaths.includes(p) ? "pill-active" : "pill-ghost"}`}
                    onClick={() => togglePath(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="card space-y-3">
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Sharing</p>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">What friends can see</h2>
              </div>
              <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={settings.shareLevel}
                  onChange={(e) => setSettings({ ...settings, shareLevel: e.target.checked })}
                />
                Share level
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={settings.shareStreak}
                  onChange={(e) => setSettings({ ...settings, shareStreak: e.target.checked })}
                />
                Share streak
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={settings.shareCategories}
                  onChange={(e) => setSettings({ ...settings, shareCategories: e.target.checked })}
                />
                Share categories
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={settings.shareMoments}
                  onChange={(e) => setSettings({ ...settings, shareMoments: e.target.checked })}
                />
                Share moments
              </label>
            </div>

            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Nudges</p>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Frequency</h2>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">Tracked sites only</span>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <span>Show a nudge every</span>
                <input
                  type="number"
                  min={60}
                  step={60}
                  value={settings.nudgeThresholdSec}
                  onChange={(e) => setSettings({ ...settings, nudgeThresholdSec: Number(e.target.value) })}
                  className="input w-28"
                />
                <span>seconds on tracked sites</span>
              </label>
            </div>

            <div className="card space-y-3">
              <div>
                <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Tracked sites</p>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Where to nudge</h2>
              </div>

              <div className="flex gap-2 flex-wrap">
                <input
                  className="input flex-1"
                  placeholder="e.g. reddit.com"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                />
                <button className="btn-primary" onClick={addDomain}>Add</button>
              </div>

              <div className="flex gap-2 flex-wrap">
                {trackedDomains.map((d) => (
                  <span key={d} className="pill pill-ghost flex items-center gap-2">
                    {d}
                    <button
                      className="text-xs text-red-500"
                      onClick={() => removeDomain(d)}
                    >
                      remove
                    </button>
                  </span>
                ))}
                {trackedDomains.length === 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No tracked domains yet.</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                className="btn-primary"
                onClick={save}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>

              <button className="btn-ghost" onClick={load}>
                Reset
              </button>
            </div>
        </div>
      </div>
    </main>
  );
}