'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

const ENTITY_TABS = ['All', 'Communities', 'Clans', 'Profiles'] as const;

const ENTITY_TYPE_MAP: Record<string, string> = {
  Communities: 'COMMUNITY',
  Clans: 'CLAN',
  Profiles: 'PROFILE',
};

const TYPE_COLORS: Record<string, string> = {
  COMMUNITY: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  CLAN: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PROFILE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

function BookmarkCard({ bookmark, onRemove }: { bookmark: any; onRemove: (id: string) => void }) {
  const entity = bookmark.entity || bookmark;
  const entityType = bookmark.entityType || entity.entityType || 'UNKNOWN';
  const entityName = entity.name || entity.displayName || entity.title || 'Untitled';
  const entitySlug = entity.slug || entity.id;
  const entityDescription = entity.description || '';

  let detailHref = '#';
  if (entityType === 'COMMUNITY') detailHref = `/dashboard/communities/${entitySlug}`;
  else if (entityType === 'CLAN') detailHref = `/dashboard/clans/${entitySlug}`;
  else if (entityType === 'PROFILE') detailHref = `/dashboard/profile/${entitySlug}`;

  const typeLabel = entityType.charAt(0) + entityType.slice(1).toLowerCase();

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={detailHref} className="text-base font-semibold text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400">
              {entityName}
            </Link>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${TYPE_COLORS[entityType] || 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
              {typeLabel}
            </span>
          </div>
          {entityDescription && (
            <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{entityDescription}</p>
          )}
          {entity.country && (
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{entity.country}</p>
          )}
        </div>
        <button
          onClick={() => onRemove(bookmark.id)}
          className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-slate-700 dark:text-red-400 dark:hover:bg-red-900/20"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

export default function BookmarksPage() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('All');
  const [removing, setRemoving] = useState<string | null>(null);

  const loadBookmarks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (activeTab !== 'All') {
        params.entityType = ENTITY_TYPE_MAP[activeTab];
      }
      const data: any = await api.bookmarks.list(params);
      setBookmarks(Array.isArray(data) ? data : data?.bookmarks || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  const handleRemove = async (id: string) => {
    setRemoving(id);
    try {
      await api.bookmarks.remove(id);
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
    } catch { /* empty */ } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-8 dark:border-amber-800/50 dark:from-amber-900/20 dark:to-orange-900/20">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bookmarks</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Access your saved communities, clans, and profiles
        </p>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        {ENTITY_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-amber-600 text-amber-600 dark:text-amber-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-800/50 dark:bg-red-900/10">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button onClick={loadBookmarks} className="mt-2 rounded-lg bg-red-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-700">
            Retry
          </button>
        </div>
      ) : bookmarks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <svg className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
          <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">No bookmarks yet</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Save communities, clans, and profiles to quickly access them later.</p>
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
          {bookmarks.map((bookmark: any) => (
            <BookmarkCard key={bookmark.id} bookmark={bookmark} onRemove={handleRemove} />
          ))}
        </div>
      )}
    </div>
  );
}
