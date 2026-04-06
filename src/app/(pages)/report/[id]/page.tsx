import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getReport } from '@/lib/kv';
import type { AutopsyReport } from '@/lib/types';
import ScoreGauge from '@/components/ScoreGauge';
import MetricBar from '@/components/MetricBar';
import ShareButtons from '@/components/ShareButtons';

function to24h(time: string): string {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return time;
  let h = parseInt(match[1], 10);
  const m = match[2];
  const period = match[3].toUpperCase();
  if (period === 'AM' && h === 12) h = 0;
  if (period === 'PM' && h !== 12) h += 12;
  return `${String(h).padStart(2, '0')}:${m}`;
}

// Memoize so generateMetadata and Page share one fetch
const fetchReport = cache(async (id: string): Promise<AutopsyReport | null> => {
  try {
    return await getReport(id);
  } catch {
    return null;
  }
});

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const report = await fetchReport(id);
  if (!report) return { title: 'Report not found — fireable.ai' };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

  return {
    title: `${report.subject_name} — Termination Probability: ${report.ai_exposure_score.score}% — fireable.ai`,
    description: `${report.ai_exposure_score.severity}. Effective termination date: ${report.career_death_date}. ${report.cause_of_death}`,
    openGraph: {
      title: `${report.subject_name} — Termination Probability: ${report.ai_exposure_score.score}%`,
      description: report.cause_of_death,
      images: [{ url: `${baseUrl}/api/og?id=${id}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${report.subject_name} — Termination Probability: ${report.ai_exposure_score.score}%`,
      description: report.cause_of_death,
      images: [`${baseUrl}/api/og?id=${id}`],
    },
  };
}

export default async function ReportPage({ params }: PageProps) {
  const { id } = await params;
  const report = await fetchReport(id);
  if (!report) notFound();

  const initials = report.subject_name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  return (
    <main className="min-h-screen print:min-h-0 bg-[#0a0a0a] py-8 px-4 [print-color-adjust:exact] [-webkit-print-color-adjust:exact]">
      <div className="max-w-[520px] mx-auto">
        <div className="border border-[#2a2a2a] rounded-2xl overflow-hidden bg-[#111111]">

          {/* ── 1. Header ─────────────────────────────────────── */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#2a2a2a]">
            <span className="text-xs font-mono text-[#444444] tracking-wider uppercase">
              Case #{report.case_number}
            </span>
            <span className="text-sm font-bold tracking-tight text-white">
              fireable<span className="text-[#E24B4A]">.ai</span>
            </span>
          </div>

          {/* ── 2. Subject ────────────────────────────────────── */}
          <div className="flex items-center gap-4 px-5 py-4 border-b border-[#2a2a2a]">
            <div className="w-12 h-12 rounded-full bg-[#E24B4A] flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm tracking-wide">{initials}</span>
            </div>
            <div className="min-w-0">
              <div className="font-bold text-white text-base leading-tight truncate">
                {report.subject_name}
              </div>
              <div className="text-xs text-[#888888] mt-0.5 leading-snug line-clamp-2">
                {report.subject_title}
              </div>
            </div>
          </div>

          {/* ── 3. Termination Probability ──────────────────────────── */}
          <div className="px-5 py-5 border-b border-[#2a2a2a]">
            <div className="text-xs font-semibold text-[#555555] uppercase tracking-widest mb-4">
              Termination Probability
            </div>
            <ScoreGauge
              score={report.ai_exposure_score.score}
              severity={report.ai_exposure_score.severity}
              severityLabel={report.ai_exposure_score.severity_label}
            />

            {/* BLS / Modifier cards */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              <div className="bg-[#1a1a1a] rounded-xl p-3 text-center border border-[#2a2a2a]">
                <div className="text-2xl font-bold text-white">
                  {report.ai_exposure_score.bls_base}
                </div>
                <div className="text-[10px] text-[#555555] uppercase tracking-wider mt-0.5">
                  BLS Risk Base
                </div>
              </div>
              <div className="bg-[#1a1a1a] rounded-xl p-3 text-center border border-[#2a2a2a]">
                <div className={`text-2xl font-bold ${report.ai_exposure_score.profile_modifier >= 0 ? 'text-[#E24B4A]' : 'text-[#22c55e]'}`}>
                  {report.ai_exposure_score.profile_modifier >= 0 ? '+' : ''}{report.ai_exposure_score.profile_modifier}
                </div>
                <div className="text-[10px] text-[#555555] uppercase tracking-wider mt-0.5">
                  Profile Modifier
                </div>
              </div>
            </div>
          </div>

          {/* ── 4. Effective Termination Date ─────────────────────────────────── */}
          <div className="px-5 py-5 border-b border-[#2a2a2a] text-center">
            <div className="text-[10px] font-semibold text-[#555555] uppercase tracking-widest mb-1">
              Effective Termination Date
            </div>
            <div className="text-3xl font-bold text-[#E24B4A] leading-tight">
              {report.career_death_date}
            </div>
            <div className="text-sm text-[#888888] mt-1">
              {report.months_remaining > 0 ? (
                <><span className="font-semibold text-white">{report.months_remaining}</span> months remaining</>
              ) : (
                <span className="font-semibold text-[#E24B4A]">Already terminated</span>
              )}
            </div>
          </div>

          {/* ── 5. Reason for Termination ─────────────────────────────── */}
          <div className="px-5 py-4 border-b border-[#2a2a2a]">
            <div className="text-[10px] font-semibold text-[#555555] uppercase tracking-widest mb-2">
              Reason for Termination
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a]">
              <p className="text-sm text-[#cccccc] italic leading-relaxed">
                {report.cause_of_death}
              </p>
            </div>
          </div>

          {/* ── 6. Performance Review Findings ──────────────────────────── */}
          <div className="px-5 py-4 border-b border-[#2a2a2a]">
            <div className="text-[10px] font-semibold text-[#555555] uppercase tracking-widest mb-4">
              Performance Review Findings
            </div>
            <div className="flex flex-col gap-4">
              {report.forensic_findings.map((finding, i) => (
                <MetricBar key={i} finding={finding} />
              ))}
            </div>
          </div>

          {/* ── 7. Farewell Message ─────────────────────────────────────── */}
          <div className="px-5 py-4 border-b border-[#2a2a2a]">
            <div className="text-[10px] font-semibold text-[#555555] uppercase tracking-widest mb-2">
              Farewell Message
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a]">
              <p className="text-sm text-[#cccccc] leading-relaxed">{report.eulogy}</p>
            </div>
          </div>

          {/* ── 8. Employee Response ─────────────────────────────────── */}
          <div className="px-5 py-4 border-b border-[#2a2a2a]">
            <div className="text-[10px] font-semibold text-[#555555] uppercase tracking-widest mb-2">
              Last Statement
            </div>
            <div className="bg-[#0a0a0a] rounded-xl p-4 border border-[#f5c518]/30">
              <p className="text-sm text-[#f5c518] italic uppercase leading-relaxed font-medium">
                &ldquo;{report.last_words}&rdquo;
              </p>
            </div>
          </div>

          {/* ── 9. Your Replacement ──────────────────────────────── */}
          <div className="px-5 py-4 border-b border-[#2a2a2a]">
            <div className="text-[10px] font-semibold text-[#555555] uppercase tracking-widest mb-3">
              Your Replacement (Already Hired)
            </div>
            <div className="border border-[#22c55e]/30 bg-[#0f1f14] rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="font-bold text-white text-base leading-tight">
                    {report.afterlife.reincarnation.agent_name}
                  </div>
                  <p className="text-xs text-[#888888] mt-1 leading-relaxed">
                    {report.afterlife.reincarnation.agent_description}
                  </p>
                </div>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="bg-[#1a1a1a] rounded-lg p-2.5 text-center border border-[#2a2a2a]">
                  <div className="text-sm font-bold text-[#22c55e]">
                    {report.afterlife.reincarnation.price_per_month}
                  </div>
                  <div className="text-[9px] text-[#555555] uppercase tracking-wider mt-0.5">
                    Per month
                  </div>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-2.5 text-center border border-[#2a2a2a]">
                  <div className="text-sm font-bold text-[#22c55e]">
                    {report.afterlife.reincarnation.uptime}
                  </div>
                  <div className="text-[9px] text-[#555555] uppercase tracking-wider mt-0.5">
                    Uptime
                  </div>
                </div>
                <div className="bg-[#1a1a1a] rounded-lg p-2.5 text-center border border-[#2a2a2a]">
                  <div className="text-sm font-bold text-[#22c55e]">
                    {report.afterlife.reincarnation.complaints_filed}
                  </div>
                  <div className="text-[9px] text-[#555555] uppercase tracking-wider mt-0.5">
                    Complaints
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#22c55e] font-medium mt-3 leading-snug">
                {report.afterlife.reincarnation.vs_human}
              </p>
            </div>
          </div>

          {/* ── 10. Post-Termination Schedule ────────────────────────────── */}
          <div className="px-5 py-4 border-b border-[#2a2a2a]">
            <div className="text-[10px] font-semibold text-[#555555] uppercase tracking-widest mb-3">
              Post-Termination Schedule
            </div>
            <div className="bg-[#0a0a0a] rounded-xl divide-y divide-[#1f1f1f] overflow-hidden border border-[#2a2a2a]">
              {report.afterlife.ghost_schedule.map((row, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <span className="font-mono text-xs text-[#f5c518] shrink-0 w-14 pt-0.5">
                    {to24h(row.time)}
                  </span>
                  <span className="text-xs text-[#cccccc] leading-relaxed">{row.activity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── 11. Share Buttons ─────────────────────────────── */}
          <div className="px-5 py-4 border-b border-[#2a2a2a]">
            <div className="text-[10px] font-semibold text-[#555555] uppercase tracking-widest mb-3">
              Share Your Notice
            </div>
            <ShareButtons
              careerDeathDate={report.career_death_date}
              score={report.ai_exposure_score.score}
              severity={report.ai_exposure_score.severity}
              monthsRemaining={report.months_remaining}
            />
          </div>

          {/* ── 12. CTA ───────────────────────────────────────── */}
          <div className="px-5 py-5 border-b border-[#2a2a2a] text-center">
            <p className="text-sm text-[#888888] mb-3 leading-snug">
              You&apos;ve been terminated. What about your colleagues?
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#E24B4A] hover:underline"
            >
              File another termination →
            </a>
          </div>

          {/* ── 13. Disclaimer ────────────────────────────────── */}
          <div className="px-5 py-4">
            <p className="text-[10px] text-[#444444] leading-relaxed text-center">
              AI exposure scores are estimated using BLS Occupational Employment data and public
              research on automation risk. Results are generated by AI and intended for entertainment
              purposes. This is satire. Probably.
            </p>
          </div>

        </div>
      </div>
    </main>
  );
}
