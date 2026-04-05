'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import UploadZone from '@/components/UploadZone';
import Leaderboard from '@/components/Leaderboard';

export default function LandingPage() {
  const router = useRouter();

  const handleSuccess = useCallback(
    (reportId: string) => {
      router.push(`/report/${reportId}`);
    },
    [router]
  );

  return (
    <main className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-[520px] mx-auto flex flex-col gap-8">

        {/* ── 1. Header ──────────────────────────────────── */}
        <div className="flex flex-col items-center text-center gap-3">
          <BriefcaseIcon className="w-11 h-11 text-[#E24B4A]" />

          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-gray-400">
            AI Human Resources Department
          </p>

          <h1 className="text-5xl font-black tracking-tight leading-none">
            <span className="text-gray-900">fireable</span>
            <span className="text-[#E24B4A]">.ai</span>
          </h1>

          <p className="text-sm text-gray-500 max-w-[340px] leading-relaxed mt-1">
            Find out if AI is about to fire you.
          </p>
        </div>

        {/* ── 2. Upload card ──────────────────────────────── */}
        <div className="border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-gray-400 mb-4">
            Submit your employment file
          </p>
          <UploadZone onSuccess={handleSuccess} />
        </div>

        {/* ── 3. Leaderboard ──────────────────────────────── */}
        <Leaderboard />

        {/* ── 4. Footer counter ───────────────────────────── */}
        <DeathCounter />

      </div>
    </main>
  );
}

function DeathCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then((r) => r.json())
      // daily count lives on a separate endpoint but we reuse the leaderboard
      // fetch timing; the actual per-day count is fetched here independently
      .catch(() => null);

    fetch('/api/daily-count')
      .then((r) => r.json())
      .then((d: { count: number }) => setCount(d.count))
      .catch(() => null);
  }, []);

  return (
    <p className="text-center text-xs text-gray-400 pb-4">
      {count !== null ? (
        <>
          <span className="font-semibold text-gray-600">{count.toLocaleString()}</span>{' '}
          {count === 1 ? 'employee' : 'employees'} terminated by AI today
        </>
      ) : (
        <span className="text-gray-300">— employees terminated by AI today</span>
      )}
    </p>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="12.01" />
      <path d="M2 12h20" />
    </svg>
  );
}
