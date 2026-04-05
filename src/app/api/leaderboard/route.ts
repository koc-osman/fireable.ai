import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/kv';
import type { LeaderboardEntry } from '@/lib/types';

// Cache this route for 60 seconds
export const revalidate = 60;

const MIN_AUTOPSIES = 3;

export async function GET() {
  const all: LeaderboardEntry[] = await getLeaderboard();

  const qualified = all.filter((e) => e.total_autopsies >= MIN_AUTOPSIES);
  const entries = qualified.length > 0 ? qualified : all;

  const sorted = [...entries]
    .sort((a, b) => b.average_score - a.average_score)
    .slice(0, 10);

  return NextResponse.json(
    { entries: sorted },
    {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
      },
    }
  );
}
