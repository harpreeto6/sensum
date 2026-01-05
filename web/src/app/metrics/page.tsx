"use client";

import { useEffect, useState } from "react";

type Metrics = {
  totalRequests: number;
  successfulRequests: number;
  clientErrors: number;
  serverErrors: number;
  slowRequests: number;
  successRate: string;
  errorRate: string;
  avgResponseTimeMs: string;
  uptime: string;
  startTime: string;
  status: string;
};

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(loadMetrics, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  async function loadMetrics() {
    try {
      const res = await fetch("/api/metrics", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error("Failed to load metrics:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="card">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Loading metrics...</h1>
          </div>
        </div>
      </main>
    );
  }

  if (!metrics) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30 flex items-center justify-center text-white font-bold">
                S
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Metrics</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Service health snapshot</p>
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

          <div className="card space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Unable to load metrics. Is the backend running?
            </p>
            <a href="/" className="nav-pill w-fit">Back to Today</a>
          </div>
        </div>
      </main>
    );
  }

  const isHealthy = metrics.status === "healthy";
  const errorRateNum = parseFloat(metrics.errorRate);
  const avgResponseTime = parseFloat(metrics.avgResponseTimeMs);
  const totalRequestsSafe = metrics.totalRequests || 0;
  const percent = (count: number) => {
    if (totalRequestsSafe <= 0) return 0;
    return (count / totalRequestsSafe) * 100;
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30 flex items-center justify-center text-white font-bold">
              S
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Metrics</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">System health snapshot</p>
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

        <div className="space-y-4">
            <section className="card space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Controls</p>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Refresh</h2>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                    />
                    Auto-refresh (5s)
                  </label>
                  <button onClick={loadMetrics} className="btn-primary">
                    Refresh Now
                  </button>
                </div>
              </div>
            </section>

            <section
              className={`card ${
                isHealthy
                  ? 'border-green-200 dark:border-green-800 bg-green-50/60 dark:bg-green-900/20'
                  : 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/60 dark:bg-yellow-900/20'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-50">
                    {isHealthy ? '✅ System Healthy' : '⚠️ System Degraded'}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    Uptime: {metrics.uptime} • Started: {new Date(metrics.startTime).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-600 dark:text-slate-300">Success Rate</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{metrics.successRate}</p>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card">
                <p className="text-sm text-slate-600 dark:text-slate-300">Total Requests</p>
                <p className="text-3xl font-bold mt-1 text-slate-900 dark:text-slate-50">
                  {metrics.totalRequests.toLocaleString()}
                </p>
              </div>

              <div className="card">
                <p className="text-sm text-slate-600 dark:text-slate-300">Avg Response Time</p>
                <p
                  className={`text-3xl font-bold mt-1 ${
                    avgResponseTime > 1000 ? 'text-red-600' : avgResponseTime > 500 ? 'text-yellow-600' : 'text-slate-900 dark:text-slate-50'
                  }`}
                >
                  {metrics.avgResponseTimeMs}ms
                </p>
              </div>

              <div className="card">
                <p className="text-sm text-slate-600 dark:text-slate-300">Error Rate</p>
                <p
                  className={`text-3xl font-bold mt-1 ${
                    errorRateNum > 5 ? 'text-red-600' : errorRateNum > 1 ? 'text-yellow-600' : 'text-green-600'
                  }`}
                >
                  {metrics.errorRate}
                </p>
              </div>

              <div className="card">
                <p className="text-sm text-slate-600 dark:text-slate-300">Slow Requests</p>
                <p className="text-3xl font-bold mt-1 text-slate-900 dark:text-slate-50">{metrics.slowRequests}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">&gt; 1 second</p>
              </div>
            </section>

            <section className="card space-y-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Request Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">✅ Successful (2xx)</p>
                  <p className="text-2xl font-bold text-green-600">{metrics.successfulRequests}</p>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 mt-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${percent(metrics.successfulRequests)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">⚠️ Client Errors (4xx)</p>
                  <p className="text-2xl font-bold text-yellow-600">{metrics.clientErrors}</p>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 mt-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{ width: `${percent(metrics.clientErrors)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">❌ Server Errors (5xx)</p>
                  <p className="text-2xl font-bold text-red-600">{metrics.serverErrors}</p>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 mt-2">
                    <div
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${percent(metrics.serverErrors)}%` }}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="card">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">Performance Insights</h2>
              <ul className="space-y-2 text-sm">
                {avgResponseTime < 100 && (
                  <li className="text-green-600">✓ Excellent response time (&lt;100ms average)</li>
                )}
                {avgResponseTime >= 100 && avgResponseTime < 500 && (
                  <li className="text-blue-600">→ Good response time (100-500ms average)</li>
                )}
                {avgResponseTime >= 500 && avgResponseTime < 1000 && (
                  <li className="text-yellow-600">⚠ Slow response time (500-1000ms) - consider optimization</li>
                )}
                {avgResponseTime >= 1000 && (
                  <li className="text-red-600">❌ Very slow response time (&gt;1s) - investigate immediately</li>
                )}

                {errorRateNum < 1 && (
                  <li className="text-green-600">✓ Excellent error rate (&lt;1%)</li>
                )}
                {errorRateNum >= 1 && errorRateNum < 5 && (
                  <li className="text-yellow-600">⚠ Elevated error rate (1-5%) - monitor closely</li>
                )}
                {errorRateNum >= 5 && (
                  <li className="text-red-600">❌ High error rate (&gt;5%) - investigate errors</li>
                )}

                {metrics.slowRequests > 0 && (
                  <li className="text-slate-700 dark:text-slate-200">
                    → {metrics.slowRequests} requests took longer than 1 second ({percent(metrics.slowRequests).toFixed(1)}%)
                  </li>
                )}

                {metrics.totalRequests === 0 && (
                  <li className="text-slate-700 dark:text-slate-200">No requests recorded yet. Use the app to generate metrics!</li>
                )}
              </ul>
            </section>

            <section className="card">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Metrics are collected in-memory and reset when the server restarts.
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                For production, integrate with Prometheus, Grafana, or DataDog.
              </p>
            </section>
        </div>
      </div>
    </main>
  );
}
