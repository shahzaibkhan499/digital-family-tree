'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

const TABS = ['All', 'Communities', 'Clans'] as const;

const TYPE_COLORS: Record<string, string> = {
  COMMUNITY: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  CLAN: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

function getBanner(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 50%, 40%), hsl(${h2}, 55%, 55%))`;
}

function FollowCard({ item, onUnfollow }: { item: any; onUnfollow: (item: any) => void }) {
  const entityType = item.entityType || item.type || 'COMMUNITY';
  const name = item.name || item.entity?.name || 'Untitled';
  const slug = item.slug || item.entity?.slug || item.id;
  const description = item.description || item.entity?.description || '';
  const country = item.country || item.entity?.country || '';
  const detailHref = entityType === 'COMMUNITY' ? `/dashboard/communities/${slug}` : `/dashboard/clans/${slug}`;
  const typeLabel = entityType.charAt(0) + entityType.slice(1).toLowerCase();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl" style={{ background: getBanner(name) }}>
          {(item.bannerUrl || item.entity?.bannerUrl) && (
            <img src={item.bannerUrl || item.entity?.bannerUrl} alt="" className="h-full w-full object-cover" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={detailHref} className="text-base font-semibold text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400">
              {name}
            </Link>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${TYPE_COLORS[entityType] || 'bg-slate-100 text-slate-700'}`}>
              {typeLabel}
            </span>
          </div>
          {description && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{description}</p>
          )}
          {country && (
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{country}</p>
          )}
        </div>
        <button
          onClick={() => onUnfollow(item)}
          className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          Unfollow
        </button>
      </div>
    </div>
  );
}

export default function FollowingPage() {
  const { user } = useAuth();
  const [follows, setFollows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('All');

  const loadFollows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const typeParam = activeTab === 'All' ? undefined : activeTab === 'Communities' ? 'COMMUNITY' : 'CLAN';
      const data = await api.followers.myFollows(typeParam);
      const list = Array.isArray(data) ? data : data?.follows || data?.communities || [];
      setFollows(list);
    } catch (err: any) {
      setError(err.message || 'Failed to load follows');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadFollows();
  }, [loadFollows]);

  const handleUnfollow = async (item: any) => {
    const entityType = item.entityType || item.type || 'COMMUNITY';
    const entityId = item.entityId || item.entity?.id || item.id;
    try {
      if (entityType === 'COMMUNITY') {
        await api.followers.unfollowCommunity(entityId);
      } else {
        await api.followers.unfollowClan(entityId);
      }
      setFollows((prev) => prev.filter((f) => (f.id || f.entityId) !== (item.id || item.entityId)));
    } catch { /* empty */ }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-8 dark:border-blue-800/50 dark:from-blue-900/20 dark:to-cyan-900/20">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Following</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Communities and clans you are following
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800/50 dark:bg-red-900/10">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button onClick={loadFollows} className="mt-2 rounded-lg bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700">
            Retry
          </button>
        </div>
      ) : follows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <svg className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
          <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Not following anyone yet</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Follow communities and clans to stay updated on their activities.</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href="/dashboard/communities" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
              Browse Communities
            </Link>
            <Link href="/dashboard/clans" className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              Browse Clans
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {follows.map((item: any) => (
            <FollowCard key={item.id || item.entityId} item={item} onUnfollow={handleUnfollow} />
          ))}
        </div>
      )}
    </div>
  );
}
