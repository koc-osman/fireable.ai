'use client';

import { useEffect, useState } from 'react';
import type { LeaderboardEntry } from '@/lib/types';

interface LeaderboardData {
  entries: LeaderboardEntry[];
}

function scoreColor(score: number): string {
  if (score >= 70) return '#E24B4A';
  if (score >= 40) return '#ef9f27';
  return '#1D9E75';
}

export default function Leaderboard() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then((d: LeaderboardData) => setData(d))
      .catch(() => {/* silently ignore — leaderboard is non-critical */})
      .finally(() => setLoading(false));
  }, []);

  const entries = data?.entries ?? [];

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-3 border-b border-gray-200">
        <h2 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-400">
          Most Fireable Jobs
        </h2>
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : entries.length === 0 ? (
        <EmptyState />
      ) : (
        <ol>
          {entries.map((entry, i) => (
            <li
              key={entry.job_title}
              className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-b-0 hover:bg-gray-50/50 transition-colors"
            >
              <span className="w-5 text-xs font-mono text-gray-300 shrink-0 text-right">
                {i + 1}
              </span>
              <span className="flex-1 text-sm text-gray-700 truncate min-w-0">
                {entry.job_title}
              </span>
              <span
                className="text-sm font-bold tabular-nums shrink-0"
                style={{ color: scoreColor(entry.average_score) }}
              >
                {entry.average_score}%
              </span>
              <span className="text-xs text-gray-300 tabular-nums shrink-0 w-14 text-right">
                {entry.total_autopsies.toLocaleString()} scanned
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="px-5 py-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-b-0">
          <div className="w-5 h-3 bg-gray-100 rounded animate-pulse" />
          <div className="flex-1 h-3 bg-gray-100 rounded animate-pulse" />
          <div className="w-8 h-3 bg-gray-100 rounded animate-pulse" />
          <div className="w-14 h-3 bg-gray-100 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="px-5 py-8 text-center">
      <p className="text-xs text-gray-400">No terminations processed yet.</p>
      <p className="text-xs text-gray-300 mt-1">Be the first case.</p>
    </div>
  );
}
