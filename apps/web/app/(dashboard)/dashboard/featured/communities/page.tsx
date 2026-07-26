'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

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

function FeaturedCard({ community }: { community: any }) {
  const initials = (community.name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const followerCount = community.followerCount ?? community._count?.followers ?? 0;
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
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
            {followerCount} followers
          </span>
          <span className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
            {community.country || community.region || 'Global'}
          </span>
        </div>
        <div className="mt-3 flex justify-end">
          <span className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700">View</span>
        </div>
      </div>
    </Link>
  );
}

function TrendingCard({ community }: { community: any }) {
  const initials = (community.name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const followerCount = community.followerCount ?? community._count?.followers ?? 0;
  return (
    <Link
      href={`/dashboard/communities/${community.slug || community.id}`}
      className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-800 text-sm font-bold text-white">
        {community.logoUrl ? <img src={community.logoUrl} alt="" className="h-full w-full rounded-full object-cover" /> : initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">{community.name}</h3>
          {community.isVerified && <VerifiedBadge />}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{community.country || community.region || 'Global'}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-slate-900 dark:text-white">{followerCount}</p>
        <p className="text-[10px] text-slate-400 dark:text-slate-500">followers</p>
      </div>
    </Link>
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

function SkeletonTrending() {
  return (
    <div className="animate-pulse flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="h-8 w-12 rounded bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}

export default function FeaturedCommunitiesPage() {
  const { user } = useAuth();
  const [featured, setFeatured] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [featRes, trendRes] = await Promise.allSettled([
          api.featured.communities(20),
          api.featured.trendingCommunities(10),
        ]);
        if (featRes.status === 'fulfilled') {
          const data: any = featRes.value;
          setFeatured(Array.isArray(data) ? data : data?.communities || []);
        }
        if (trendRes.status === 'fulfilled') {
          const data: any = trendRes.value;
          setTrending(Array.isArray(data) ? data : data?.communities || []);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load featured communities');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-8 dark:border-indigo-800/50 dark:from-indigo-900/20 dark:to-purple-900/20">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Featured Communities</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Discover the most notable and active communities on the platform
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Link href="/dashboard/communities" className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
            Browse All Communities
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="h-6 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-6 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <SkeletonTrending key={i} />)}
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800/50 dark:bg-red-900/10">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-2 rounded-lg bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700">
            Retry
          </button>
        </div>
      ) : (
        <>
          {featured.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Featured</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((c: any) => <FeaturedCard key={c.id || c.slug} community={c} />)}
              </div>
            </div>
          )}

          {trending.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Trending</h2>
              <div className="space-y-3">
                {trending.map((c: any) => <TrendingCard key={c.id || c.slug} community={c} />)}
              </div>
            </div>
          )}

          {!loading && featured.length === 0 && trending.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No featured communities yet</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Featured communities will appear here once they are curated.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
