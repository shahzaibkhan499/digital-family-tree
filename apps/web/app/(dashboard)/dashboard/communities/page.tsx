'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';

function getBanner(name: string) {
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

function CommunityCard({ community }: { community: any }) {
  const initials = (community.name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <Link
      href={`/dashboard/communities/${community.slug || community.id}`}
      className="group block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="relative h-28 w-full" style={{ background: getBanner(community.name) }}>
        {community.bannerUrl && <img src={community.bannerUrl} alt="" className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>
      <div className="relative px-4 pb-4">
        <div className="-mt-8 mb-2 flex items-end gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-indigo-600 to-purple-800 text-lg font-bold text-white shadow dark:border-slate-900">
            {community.logoUrl ? <img src={community.logoUrl} alt="" className="h-full w-full rounded-full object-cover" /> : initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">{community.name}</h3>
              {community.isVerified && <VerifiedBadge />}
            </div>
          </div>
        </div>
        {community.description && (
          <p className="mb-3 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{community.description}</p>
        )}
        <div className="flex items-center gap-4 text-[11px] text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
            {community._count?.clans ?? community.clanCount ?? 0} clans
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {community._count?.families ?? community.familyCount ?? 0} families
          </span>
          {(community.country || community.region) && (
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
              {community.country || community.region}
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
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
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

function CommunityList({ communities, loading }: { communities: any[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }
  if (communities.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm text-slate-400 dark:text-slate-500 italic">No communities found.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {communities.map((c: any) => <CommunityCard key={c.id || c.slug} community={c} />)}
    </div>
  );
}

export default function CommunitiesPage() {
  const [search, setSearch] = useState('');
  const [topCommunities, setTopCommunities] = useState<any[]>([]);
  const [popularCommunities, setPopularCommunities] = useState<any[]>([]);
  const [recentCommunities, setRecentCommunities] = useState<any[]>([]);
  const [userCommunities, setUserCommunities] = useState<any[]>([]);
  const [allCommunities, setAllCommunities] = useState<any[]>([]);
  const [stats, setStats] = useState<{ totalCommunities: number; totalClans: number; totalFamilies: number; totalMembers: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const results = await Promise.allSettled([
        api.communities.top(5),
        api.communities.popular(6),
        api.communities.recent(6),
        api.communities.user(),
        api.communities.list({ limit: 100 }),
      ]);
      if (results[0].status === 'fulfilled') {
        const data = results[0].value;
        setTopCommunities(Array.isArray(data) ? data : data?.communities || []);
      }
      if (results[1].status === 'fulfilled') {
        const data = results[1].value;
        setPopularCommunities(Array.isArray(data) ? data : data?.communities || []);
      }
      if (results[2].status === 'fulfilled') {
        const data = results[2].value;
        setRecentCommunities(Array.isArray(data) ? data : data?.communities || []);
      }
      if (results[3].status === 'fulfilled') {
        const data = results[3].value;
        setUserCommunities(Array.isArray(data) ? data : data?.communities || []);
      }
      if (results[4].status === 'fulfilled') {
        const data = results[4].value;
        const list = Array.isArray(data) ? data : data?.communities || [];
        setAllCommunities(list);
        setStats({
          totalCommunities: data?.total || list.length,
          totalClans: list.reduce((s: number, c: any) => s + (c._count?.clans || c.clanCount || 0), 0),
          totalFamilies: list.reduce((s: number, c: any) => s + (c._count?.families || c.familyCount || 0), 0),
          totalMembers: list.reduce((s: number, c: any) => s + (c._count?.members || c.memberCount || 0), 0),
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
      const data = await api.communities.list({ search: search.trim(), limit: 20 });
      const list = Array.isArray(data) ? data : data?.communities || [];
      setSearchResults(list);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [search]);

  const suggestedCommunities = allCommunities.filter((c) => !userCommunities.some((uc: any) => uc.id === c.id)).slice(0, 6);

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-8 dark:border-indigo-800/50 dark:from-indigo-900/20 dark:to-purple-900/20">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Communities</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Discover ethnic groups, tribes, and communities worldwide
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
              placeholder="Search communities by name, country, or region..."
              className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <button onClick={handleSearch} disabled={searching} className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
            {searching ? 'Searching...' : 'Search'}
          </button>
          <Link href="/dashboard/communities/new" className="rounded-lg border border-indigo-600 bg-white px-5 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-500 dark:bg-slate-900 dark:text-indigo-400 dark:hover:bg-slate-800">
            + Create Community
          </Link>
        </div>
      </div>

      {searchResults !== null ? (
        <div className="space-y-4">
          <SectionTitle>
            Search Results ({searchResults.length})
          </SectionTitle>
          <button onClick={() => setSearchResults(null)} className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
            â† Clear search
          </button>
          <CommunityList communities={searchResults} loading={searching} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total Communities" value={stats?.totalCommunities ?? 0} icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>} />
            <StatCard label="Total Clans" value={stats?.totalClans ?? 0} icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>} />
            <StatCard label="Total Families" value={stats?.totalFamilies ?? 0} icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>} />
            <StatCard label="Total Members" value={stats?.totalMembers ?? 0} icon={<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>} />
          </div>

          {topCommunities.length > 0 && (
            <div className="space-y-4">
              <SectionTitle action={<Link href="/dashboard/communities" className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">View All</Link>}>
                Top Communities
              </SectionTitle>
              {loading ? (
                <HorizontalSkeleton />
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                  {topCommunities.map((c: any) => (
                    <div key={c.id || c.slug} className="w-72 shrink-0">
                      <CommunityCard community={c} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {userCommunities.length > 0 && (
            <div className="space-y-4">
              <SectionTitle>My Communities</SectionTitle>
              <CommunityList communities={userCommunities} loading={loading} />
            </div>
          )}

          <div className="space-y-4">
            <SectionTitle>Popular Communities</SectionTitle>
            <CommunityList communities={popularCommunities} loading={loading} />
          </div>

          <div className="space-y-4">
            <SectionTitle>Recently Created</SectionTitle>
            <CommunityList communities={recentCommunities} loading={loading} />
          </div>

          {suggestedCommunities.length > 0 && (
            <div className="space-y-4">
              <SectionTitle>Suggested for You</SectionTitle>
              <CommunityList communities={suggestedCommunities} loading={loading} />
            </div>
          )}

          {!loading && allCommunities.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No communities yet</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Be the first to create a community and bring people together.</p>
              <Link href="/dashboard/communities/new" className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-all">
                + Create Community
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
