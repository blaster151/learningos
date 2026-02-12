"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { authFetch } from "@/lib/api/authFetch";
import { Card } from "@/components/ui";

// ===================================
// Types
// ===================================

interface UserTokenData {
  userId: string;
  displayName: string;
  email: string;
  totalTokens: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalRequests: number;
  lastUsed: string | null;
  byEndpoint: Record<string, { tokens: number; requests: number }>;
  byModel: Record<string, { tokens: number; requests: number }>;
}

interface GrandTotal {
  totalTokens: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalRequests: number;
  totalUsers: number;
}

interface RecentRecord {
  id: string;
  userId: string;
  displayName: string;
  endpoint: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  timestamp: string;
}

interface TokenUsageResponse {
  grandTotal: GrandTotal;
  users: UserTokenData[];
  recent: RecentRecord[];
}

// ===================================
// Helpers
// ===================================

function formatTokenCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function estimateCost(tokens: number, model: string): string {
  // Rough cost estimation per 1K tokens (blended input/output)
  const rates: Record<string, number> = {
    "gpt-4": 0.045,
    "gpt-4o": 0.0075,
    "gpt-4o-mini": 0.0003,
    "gpt-3.5-turbo": 0.001,
  };
  const rate = rates[model] || 0.01;
  const cost = (tokens / 1000) * rate;
  return cost < 0.01 ? "<$0.01" : `$${cost.toFixed(2)}`;
}

function timeAgo(isoString: string | null): string {
  if (!isoString) return "never";
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ===================================
// Admin Dashboard Page
// ===================================

export default function AdminPage() {
  const { user } = useAuth();
  const [data, setData] = useState<TokenUsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(user, "/api/admin/token-usage?recent=true");
      if (!res.ok) {
        if (res.status === 403) {
          setError("Access denied. You are not an admin.");
        } else {
          setError(`Error: ${res.status}`);
        }
        return;
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400 text-lg animate-pulse">
          Loading admin dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-8 max-w-md text-center">
          <p className="text-red-600 dark:text-red-400 text-lg mb-4">🚫 {error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const { grandTotal, users, recent } = data;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            🛠️ Admin Dashboard
          </h1>
          <button
            onClick={fetchData}
            className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Grand Totals */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Total Tokens" value={formatTokenCount(grandTotal.totalTokens)} icon="📊" />
          <StatCard label="Total Requests" value={grandTotal.totalRequests.toLocaleString()} icon="🔢" />
          <StatCard label="Active Users" value={grandTotal.totalUsers.toString()} icon="👤" />
          <StatCard
            label="Est. Cost"
            value={estimateCost(grandTotal.totalTokens, "gpt-4o")}
            icon="💰"
            subtitle="blended rate"
          />
        </div>

        {/* Per-User Table */}
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Token Usage by User
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 text-xs uppercase bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3 text-right">Tokens</th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">Prompt</th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">Completion</th>
                  <th className="px-4 py-3 text-right">Requests</th>
                  <th className="px-4 py-3 text-right hidden md:table-cell">Last Used</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((u) => (
                  <UserRow
                    key={u.userId}
                    user={u}
                    expanded={expandedUser === u.userId}
                    onToggle={() =>
                      setExpandedUser(expandedUser === u.userId ? null : u.userId)
                    }
                  />
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      No token usage data yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Recent Activity */}
        {recent.length > 0 && (
          <Card className="overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent API Calls
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 text-xs uppercase bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Endpoint</th>
                    <th className="px-4 py-3">Model</th>
                    <th className="px-4 py-3 text-right">Tokens</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recent.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-4 py-2 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {timeAgo(r.timestamp)}
                      </td>
                      <td className="px-4 py-2 text-gray-900 dark:text-gray-100">
                        {r.displayName}
                      </td>
                      <td className="px-4 py-2">
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-mono">
                          {r.endpoint}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-500 dark:text-gray-400 font-mono text-xs">
                        {r.model}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-900 dark:text-gray-100 font-mono">
                        {r.totalTokens.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ===================================
// Sub-Components
// ===================================

function StatCard({
  label,
  value,
  icon,
  subtitle,
}: {
  label: string;
  value: string;
  icon: string;
  subtitle?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{icon}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {subtitle && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>
      )}
    </Card>
  );
}

function UserRow({
  user,
  expanded,
  onToggle,
}: {
  user: UserTokenData;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className="hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          <div>
            <span className="text-gray-900 dark:text-gray-100 font-medium">
              {expanded ? "▼" : "▶"} {user.displayName}
            </span>
            {user.email && (
              <p className="text-xs text-gray-400 dark:text-gray-500">{user.email}</p>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-right font-mono text-gray-900 dark:text-gray-100">
          {formatTokenCount(user.totalTokens)}
        </td>
        <td className="px-4 py-3 text-right font-mono text-gray-500 dark:text-gray-400 hidden sm:table-cell">
          {formatTokenCount(user.totalPromptTokens)}
        </td>
        <td className="px-4 py-3 text-right font-mono text-gray-500 dark:text-gray-400 hidden sm:table-cell">
          {formatTokenCount(user.totalCompletionTokens)}
        </td>
        <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">
          {user.totalRequests}
        </td>
        <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400 hidden md:table-cell whitespace-nowrap">
          {timeAgo(user.lastUsed)}
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr>
          <td colSpan={6} className="px-6 py-4 bg-gray-50 dark:bg-gray-800/40">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {/* By Endpoint */}
              <div>
                <h4 className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-2 font-semibold">
                  By Endpoint
                </h4>
                <div className="space-y-1">
                  {Object.entries(user.byEndpoint).map(([ep, data]) => (
                    <div key={ep} className="flex justify-between">
                      <span className="font-mono text-xs text-blue-600 dark:text-blue-400">
                        {ep}
                      </span>
                      <span className="text-gray-600 dark:text-gray-300 text-xs">
                        {formatTokenCount(data.tokens)} · {data.requests} reqs
                      </span>
                    </div>
                  ))}
                  {Object.keys(user.byEndpoint).length === 0 && (
                    <p className="text-gray-400 text-xs">No endpoint data</p>
                  )}
                </div>
              </div>

              {/* By Model */}
              <div>
                <h4 className="text-xs uppercase text-gray-500 dark:text-gray-400 mb-2 font-semibold">
                  By Model
                </h4>
                <div className="space-y-1">
                  {Object.entries(user.byModel).map(([model, data]) => (
                    <div key={model} className="flex justify-between">
                      <span className="font-mono text-xs text-purple-600 dark:text-purple-400">
                        {model}
                      </span>
                      <span className="text-gray-600 dark:text-gray-300 text-xs">
                        {formatTokenCount(data.tokens)} · {estimateCost(data.tokens, model)}
                      </span>
                    </div>
                  ))}
                  {Object.keys(user.byModel).length === 0 && (
                    <p className="text-gray-400 text-xs">No model data</p>
                  )}
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
