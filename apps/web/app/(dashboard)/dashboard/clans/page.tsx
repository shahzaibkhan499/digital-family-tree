'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';

function getClanBanner(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 50%, 40%), hsl(${h2}, 55%, 55%))`;
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
      Verified
    </span>
  );
}

function ClanCard({ clan }: { clan: any }) {
  const initials = (clan.name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <Link
      href={`/dashboard/clans/${clan.slug || clan.id}`}
      className="group block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="relative h-28 w-full" style={{ background: getClanBanner(clan.name) }}>
        {clan.bannerUrl && <img src={clan.bannerUrl} alt="" className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>
      <div className="relative px-4 pb-4">
        <div className="-mt-8 mb-2 flex items-end gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-slate-600 to-slate-800 text-lg font-bold text-white shadow dark:border-slate-900">
            {clan.logoUrl ? <img src={clan.logoUrl} alt="" className="h-full w-full rounded-full object-cover" /> : initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">{clan.name}</h3>
              {clan.isVerified && <VerifiedBadge />}
            </div>
          </div>
        </div>
        {clan.description && (
          <p className="mb-3 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{clan.description}</p>
        )}
        <div className="flex items-center gap-4 text-[11px] text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {clan._count?.families ?? clan.familyCount ?? 0} families
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
            {clan._count?.members ?? clan.memberCount ?? 0} members
          </span>
          {(clan.country || clan.region) && (
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
              {clan.country || clan.region}
            </span>
          )}
        </div>
        <div className="mt-3 flex justify-end">
          <span className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700">View</span>
        </div>
      </div>
    </Link>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="h-28 bg-slate-200 dark:bg-slate-700" />
      <div className="px-4 pb-4">
        <div className="-mt-8 mb-2 flex items-end gap-3">
          <div className="h-14 w-14 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-700 mb-1" />
        <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-700 mb-3" />
        <div className="flex gap-4">
          <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  );
}

function HorizontalSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden">
      {[1, 2, 3].map((i) => (
        <div key={i} className="w-72 shrink-0"><SkeletonCard /></div>
      ))}
    </div>
  );
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{children}</h2>
      {action}
    </div>
  );
}

function ClanList({ clans, loading }: { clans: any[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }
  if (clans.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm text-slate-400 dark:text-slate-500 italic">No clans found.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {clans.map((clan: any) => <ClanCard key={clan.id || clan.slug} clan={clan} />)}
    </div>
  );
}

export default function ClansPage() {
  const [search, setSearch] = useState('');
  const [topClans, setTopClans] = useState<any[]>([]);
  const [popularClans, setPopularClans] = useState<any[]>([]);
  const [recentClans, setRecentClans] = useState<any[]>([]);
  const [userClans, setUserClans] = useState<any[]>([]);
  const [allClans, setAllClans] = useState<any[]>([]);
  const [stats, setStats] = useState<{ totalClans: number; totalFamilies: number; totalMembers: number; verifiedClans: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const results = await Promise.allSettled([
        api.clans.top(5),
        api.clans.popular(6),
        api.clans.recent(6),
        api.clans.user(),
        api.clans.list({ limit: 100 }),
      ]);
      if (results[0].status === 'fulfilled') {
        const data = results[0].value;
        setTopClans(Array.isArray(data) ? data : data?.clans || []);
      }
      if (results[1].status === 'fulfilled') {
        const data = results[1].value;
        setPopularClans(Array.isArray(data) ? data : data?.clans || []);
      }
      if (results[2].status === 'fulfilled') {
        const data = results[2].value;
        setRecentClans(Array.isArray(data) ? data : data?.clans || []);
      }
      if (results[3].status === 'fulfilled') {
        const data = results[3].value;
        setUserClans(Array.isArray(data) ? data : data?.clans || []);
      }
      if (results[4].status === 'fulfilled') {
        const data = results[4].value;
        const list = Array.isArray(data) ? data : data?.clans || [];
        setAllClans(list);
        setStats({
          totalClans: data?.total || list.length,
          totalFamilies: list.reduce((s: number, c: any) => s + (c._count?.families || c.familyCount || 0), 0),
          totalMembers: list.reduce((s: number, c: any) => s + (c._count?.members || c.memberCount || 0), 0),
          verifiedClans: list.filter((c: any) => c.isVerified || c.verified).length,
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSearch = useCallback(async () => {
    if (!search.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const data = await api.clans.list({ search: search.trim(), limit: 20 });
      const list = Array.isArray(data) ? data : data?.clans || [];
      setSearchResults(list);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [search]);

  const suggestedClans = allClans.filter((c) => !userClans.some((uc: any) => uc.id === c.id)).slice(0, 6);

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-8 dark:border-emerald-800/50 dark:from-emerald-900/20 dark:to-teal-900/20">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clans & Communities</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Discover and join family clans from around the world
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-lg">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search clans by name, country, or region..."
              className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <button onClick={handleSearch} disabled={searching} className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
            {searching ? 'Searching...' : 'Search'}
          </button>
          <Link href="/dashboard/clans/new" className="rounded-lg border border-emerald-600 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500 dark:bg-slate-900 dark:text-emerald-400 dark:hover:bg-slate-800">
            + Create Clan
          </Link>
        </div>
      </div>

      {searchResults !== null ? (
        <div className="space-y-4">
          <SectionTitle>
            Search Results ({searchResults.length})
          </SectionTitle>
          <button onClick={() => setSearchResults(null)} className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
            â† Clear search
          </button>
          <ClanList clans={searchResults} loading={searching} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total Clans" value={stats?.totalClans ?? 0} icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>} />
            <StatCard label="Total Families" value={stats?.totalFamilies ?? 0} icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
            <StatCard label="Total Members" value={stats?.totalMembers ?? 0} icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>} />
            <StatCard label="Verified Clans" value={stats?.verifiedClans ?? 0} icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.249-8.25-3.286z" /></svg>} />
          </div>

          {topClans.length > 0 && (
            <div className="space-y-4">
              <SectionTitle action={<Link href="/dashboard/clans" className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">View All</Link>}>
                Top Clans
              </SectionTitle>
              {loading ? (
                <HorizontalSkeleton />
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                  {topClans.map((clan: any) => (
                    <div key={clan.id || clan.slug} className="w-72 shrink-0">
                      <ClanCard clan={clan} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {userClans.length > 0 && (
            <div className="space-y-4">
              <SectionTitle>My Clans</SectionTitle>
              <ClanList clans={userClans} loading={loading} />
            </div>
          )}

          <div className="space-y-4">
            <SectionTitle>Popular Clans</SectionTitle>
            <ClanList clans={popularClans} loading={loading} />
          </div>

          <div className="space-y-4">
            <SectionTitle>Recently Active</SectionTitle>
            <ClanList clans={recentClans} loading={loading} />
          </div>

          {suggestedClans.length > 0 && (
            <div className="space-y-4">
              <SectionTitle>Suggested for You</SectionTitle>
              <ClanList clans={suggestedClans} loading={loading} />
            </div>
          )}

          {!loading && allClans.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No clans yet</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Be the first to create a clan and bring families together.</p>
              <Link href="/dashboard/clans/new" className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-all">
                + Create Clan
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
