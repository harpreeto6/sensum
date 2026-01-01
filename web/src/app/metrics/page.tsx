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
      <main className="p-6">
        <h1 className="text-2xl font-bold">Loading metrics...</h1>
      </main>
    );
  }

  if (!metrics) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold">📊 Metrics</h1>
        <p className="mt-4">Unable to load metrics. Is the backend running?</p>
        <a href="/" className="underline mt-4 block">Back to Today</a>
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
    <main className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">📊 System Metrics</h1>
          <a className="underline" href="/">Today</a>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input 
              type="checkbox" 
              checked={autoRefresh} 
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh (5s)
          </label>
          <button 
            onClick={loadMetrics}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            Refresh Now
          </button>
        </div>
      </header>

      {/* Status Banner */}
      <div className={`p-4 rounded-lg border ${
        isHealthy 
          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
          : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-lg">
              {isHealthy ? "✅ System Healthy" : "⚠️ System Degraded"}
            </p>
            <p className="text-sm opacity-80 mt-1">
              Uptime: {metrics.uptime} • Started: {new Date(metrics.startTime).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-70">Success Rate</p>
            <p className="text-2xl font-bold">{metrics.successRate}</p>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-sm opacity-70">Total Requests</p>
          <p className="text-3xl font-bold mt-1">{metrics.totalRequests.toLocaleString()}</p>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-sm opacity-70">Avg Response Time</p>
          <p className={`text-3xl font-bold mt-1 ${
            avgResponseTime > 1000 ? "text-red-600" : avgResponseTime > 500 ? "text-yellow-600" : ""
          }`}>
            {metrics.avgResponseTimeMs}ms
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-sm opacity-70">Error Rate</p>
          <p className={`text-3xl font-bold mt-1 ${
            errorRateNum > 5 ? "text-red-600" : errorRateNum > 1 ? "text-yellow-600" : "text-green-600"
          }`}>
            {metrics.errorRate}
          </p>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-sm opacity-70">Slow Requests</p>
          <p className="text-3xl font-bold mt-1">{metrics.slowRequests}</p>
          <p className="text-xs opacity-60 mt-1">&gt; 1 second</p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Request Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm opacity-70 mb-2">✅ Successful (2xx)</p>
            <p className="text-2xl font-bold text-green-600">{metrics.successfulRequests}</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div 
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${percent(metrics.successfulRequests)}%` }}
              />
            </div>
          </div>

          <div>
            <p className="text-sm opacity-70 mb-2">⚠️ Client Errors (4xx)</p>
            <p className="text-2xl font-bold text-yellow-600">{metrics.clientErrors}</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full"
                style={{ width: `${percent(metrics.clientErrors)}%` }}
              />
            </div>
          </div>

          <div>
            <p className="text-sm opacity-70 mb-2">❌ Server Errors (5xx)</p>
            <p className="text-2xl font-bold text-red-600">{metrics.serverErrors}</p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
              <div 
                className="bg-red-500 h-2 rounded-full"
                style={{ width: `${percent(metrics.serverErrors)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">💡 Performance Insights</h2>
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
            <li className="opacity-70">
              → {metrics.slowRequests} requests took longer than 1 second ({percent(metrics.slowRequests).toFixed(1)}%)
            </li>
          )}
          
          {metrics.totalRequests === 0 && (
            <li className="opacity-70">No requests recorded yet. Use the app to generate metrics!</li>
          )}
        </ul>
      </div>

      {/* Footer */}
      <div className="text-sm opacity-60 text-center">
        <p>Metrics are collected in-memory and reset when the server restarts.</p>
        <p className="mt-1">For production, integrate with Prometheus, Grafana, or DataDog.</p>
      </div>
    </main>
  );
}
