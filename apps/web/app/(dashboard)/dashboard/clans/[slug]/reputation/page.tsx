'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

const BADGE_ICONS: Record<string, string> = {
  'Oldest Clan': 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  'Largest': 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  'Most Active': 'M13 10V3L4 14h7v7l9-11h-7z',
  'Fastest Growing': 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
};

const BADGE_COLORS: Record<string, string> = {
  'Oldest Clan': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'Largest': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  'Most Active': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Fastest Growing': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

function ScoreBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-400">{label}</span>
        <span className="font-semibold text-slate-900 dark:text-white">{value}{max === 100 ? '%' : ''}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ClanReputationPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params.slug as string;

  const [clan, setClan] = useState<any>(null);
  const [reputation, setReputation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRep, setLoadingRep] = useState(false);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.clans.get(slug);
        setClan(data);
      } catch {
        router.push('/dashboard/clans');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, router]);

  useEffect(() => {
    if (!clan) return;
    setLoadingRep(true);
    api.reputation.clan(clan.id)
      .then((data) => setReputation(data))
      .catch(() => setReputation(null))
      .finally(() => setLoadingRep(false));
  }, [clan]);

  const handleCalculate = async () => {
    if (!clan) return;
    setCalculating(true);
    try {
      const data = await api.reputation.calculateClan(clan.id);
      setReputation(data);
    } catch { /* empty */ } finally { setCalculating(false); }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!clan) return null;

  const heritageScore = reputation?.heritageScore ?? reputation?.heritage ?? 0;
  const preservationScore = reputation?.preservationScore ?? reputation?.preservation ?? 0;
  const overallScore = reputation?.overallScore ?? reputation?.score ?? Math.round((heritageScore + preservationScore) / 2);
  const badges = reputation?.badges ?? [];
  const factors = reputation?.factors ?? reputation?.breakdown ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/dashboard/clans/${slug}`} className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">&larr; {clan.name}</Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Clan Reputation</h1>
        </div>
        <button
          onClick={handleCalculate}
          disabled={calculating}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {calculating ? 'Calculating...' : 'Calculate Score'}
        </button>
      </div>

      {loadingRep ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        </div>
      ) : !reputation ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <svg className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No reputation data yet.</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Click &quot;Calculate Score&quot; to generate reputation data.</p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-center mb-6">
              <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600">
                <span className="text-3xl font-bold text-white">{overallScore}</span>
              </div>
              <p className="mt-2 text-sm font-medium text-slate-900 dark:text-white">Overall Reputation Score</p>
            </div>
            <div className="space-y-4">
              <ScoreBar label="Heritage Score" value={heritageScore} />
              <ScoreBar label="Preservation Score" value={preservationScore} />
            </div>
          </div>

          {badges.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Badges</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {badges.map((badge: string) => (
                  <div key={badge} className={`rounded-lg p-4 text-center ${BADGE_COLORS[badge] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                    <svg className="mx-auto h-6 w-6 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={BADGE_ICONS[badge] || BADGE_ICONS['Oldest Clan']} />
                    </svg>
                    <p className="text-xs font-semibold">{badge}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {factors && typeof factors === 'object' && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Score Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(factors).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-2 dark:bg-slate-800/50">
                    <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reputation.createdAt && (
            <p className="text-center text-xs text-slate-400 dark:text-slate-500">
              Last calculated: {new Date(reputation.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </>
      )}
    </div>
  );
}
