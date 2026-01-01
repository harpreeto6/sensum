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
  const [msg, setMsg] = useState("");

  const [settings, setSettings] = useState<Settings | null>(null);

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

  const [domainInput, setDomainInput] = useState("");

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    setMsg("");
    setLoading(true);

    const res = await fetch("/api/me/settings", { credentials: "include", cache: "no-store" });
    if (res.status === 401 || res.status === 403) {
      router.push("/login");
      return;
    }
    if (!res.ok) {
      setMsg("Failed to load settings");
      setLoading(false);
      return;
    }

    const data = (await res.json()) as Settings;
    setSettings(data);
    setLoading(false);
  }

  function togglePath(p: (typeof PATHS)[number]) {
    if (!settings) return;
    const next = new Set(selectedPaths);
    if (next.has(p)) next.delete(p);
    else next.add(p);
    setSettings({ ...settings, selectedPaths: JSON.stringify(Array.from(next)) });
  }

  function addDomain() {
    if (!settings) return;
    const value = domainInput.trim().toLowerCase();
    if (!value) return;
    if (trackedDomains.includes(value)) return;

    setSettings({ ...settings, trackedDomains: JSON.stringify([value, ...trackedDomains]) });
    setDomainInput("");
  }

  function removeDomain(domain: string) {
    if (!settings) return;
    setSettings({ ...settings, trackedDomains: JSON.stringify(trackedDomains.filter((d) => d !== domain)) });
  }

  async function save() {
    if (!settings) return;
    setMsg("");

    const res = await fetch("/api/me/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(settings),
    });

    if (!res.ok) {
      setMsg("Save failed");
      return;
    }

    setMsg("Saved!");
    setSettings(await res.json());
  }

  if (loading) return <main className="p-6">Loading…</main>;
  if (!settings) return <main className="p-6">No settings.</main>;

  return (
    <main className="p-6 space-y-6">
      <header className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Settings</h1>
        <a className="underline" href="/">Today</a>
      </header>

      {msg && <p>{msg}</p>}

      <section className="border rounded p-4 space-y-3">
        <h2 className="text-lg font-semibold">Paths</h2>
        <div className="flex gap-2 flex-wrap">
          {PATHS.map((p) => (
            <button
              key={p}
              className={`border rounded px-3 py-1 ${selectedPaths.includes(p) ? "font-bold" : ""}`}
              onClick={() => togglePath(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      <section className="border rounded p-4 space-y-3">
        <h2 className="text-lg font-semibold">Sharing</h2>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.shareLevel}
            onChange={(e) => setSettings({ ...settings, shareLevel: e.target.checked })}
          />
          Share level
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.shareStreak}
            onChange={(e) => setSettings({ ...settings, shareStreak: e.target.checked })}
          />
          Share streak
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.shareCategories}
            onChange={(e) => setSettings({ ...settings, shareCategories: e.target.checked })}
          />
          Share categories
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.shareMoments}
            onChange={(e) => setSettings({ ...settings, shareMoments: e.target.checked })}
          />
          Share moments
        </label>
      </section>

      <section className="border rounded p-4 space-y-3">
        <h2 className="text-lg font-semibold">Nudges</h2>

        <label className="block">
          Threshold (minutes)
          <input
            className="border rounded p-2 w-full max-w-sm block mt-1"
            type="number"
            min={1}
            value={Math.round(settings.nudgeThresholdSec / 60)}
            onChange={(e) =>
              setSettings({ ...settings, nudgeThresholdSec: Number(e.target.value) * 60 })
            }
          />
        </label>

        <div className="space-y-2">
          <p className="font-semibold">Tracked domains</p>

          <div className="flex gap-2 flex-wrap items-center">
            <input
              className="border rounded p-2 w-full max-w-sm"
              placeholder="e.g. youtube.com"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
            />
            <button className="border px-4 py-2 rounded" onClick={addDomain}>
              Add
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            {trackedDomains.map((d) => (
              <button
                key={d}
                className="border rounded px-3 py-1"
                onClick={() => removeDomain(d)}
                title="Click to remove"
              >
                {d} ✕
              </button>
            ))}
            {trackedDomains.length === 0 && <p className="opacity-70">No domains yet.</p>}
          </div>
        </div>
      </section>

      <button className="border px-4 py-2 rounded" onClick={save}>
        Save settings
      </button>
    </main>
  );
}