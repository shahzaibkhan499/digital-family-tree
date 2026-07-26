'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface Memory {
  id: string;
  displayId: string;
  title: string;
  description: string | null;
  story: string | null;
  date: string | null;
  location: string | null;
  visibility: string;
  tags: string[] | null;
  isHidden: boolean;
  createdAt: string;
  media: { id: string; url: string; type: string }[];
  members: { member: { id: string; firstName: string; lastName: string } }[];
  _count: { comments: number; reactions: number };
}

interface MemoriesResponse {
  memories: Memory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>{children}</div>;
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700 ${className}`} />;
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function MemoriesPage() {
  const { user } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const fetchMemories = useCallback(async (pageNum: number, searchVal: string, replace: boolean) => {
    try {
      const res: MemoriesResponse = await api.memories.list({
        page: pageNum,
        limit: 20,
        search: searchVal || undefined,
        sortBy,
        sortOrder,
      });
      if (replace) {
        setMemories(res.memories);
      } else {
        setMemories(prev => [...prev, ...res.memories]);
      }
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch { /* empty */ } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [sortBy, sortOrder]);

  useEffect(() => {
    if (!user) return;
    setMemories([]);
    setPage(1);
    setTotalPages(1);
    setLoading(true);
    fetchMemories(1, '', true);
  }, [user, fetchMemories]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  useEffect(() => {
    if (!user) return;
    setMemories([]);
    setPage(1);
    setLoading(true);
    fetchMemories(1, debouncedSearch, true);
  }, [debouncedSearch, fetchMemories, user]);

  useEffect(() => {
    if (page > 1) {
      fetchMemories(page, debouncedSearch, false);
    }
  }, [page, fetchMemories, debouncedSearch]);

  const loadMore = useCallback(() => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    setPage(prev => prev + 1);
  }, [loadingMore, page, totalPages]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading && !loadingMore && page < totalPages) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading, loadingMore, page, totalPages, loadMore]);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Memories</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">{total} memories shared across your families</p>
        </div>
        <Link
          href="/dashboard/memories/new"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
        >
          + New Memory
        </Link>
      </div>

      <Card>
        <div className="border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search memories..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
              />
            </div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="date-desc">Date (Newest)</option>
              <option value="date-asc">Date (Oldest)</option>
              <option value="title-asc">Title A-Z</option>
            </select>
            <div className="flex rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className={viewMode === 'grid' ? 'rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900' : 'flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900'}>
                  {viewMode === 'grid' ? (
                    <>
                      <Skeleton className="h-40 w-full rounded-lg" />
                      <Skeleton className="mt-3 h-5 w-3/4" />
                      <Skeleton className="mt-2 h-3 w-1/2" />
                    </>
                  ) : (
                    <>
                      <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-3 w-60" />
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : memories.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No memories yet</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Create your first memory to preserve family moments.</p>
              <Link href="/dashboard/memories/new" className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                + Create Memory
              </Link>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {memories.map(memory => (
                <Link
                  key={memory.id}
                  href={`/dashboard/memories/${memory.id}`}
                  className="group rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-emerald-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-800"
                >
                  {memory.media && memory.media.length > 0 ? (
                    <div className="relative h-40 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                      <img src={memory.media[0].url} alt={memory.title} className="h-full w-full object-cover" />
                      {memory.media.length > 1 && (
                        <span className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">+{memory.media.length - 1}</span>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-40 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/10">
                      <svg className="h-10 w-10 text-emerald-300 dark:text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                  )}
                  <h3 className="mt-3 text-sm font-semibold text-slate-900 group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-400 line-clamp-1">{memory.title}</h3>
                  {memory.description && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{memory.description}</p>}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {memory.date && <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(memory.date)}</span>}
                      {memory.location && (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {memory.location}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                      {memory._count.comments > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                          {memory._count.comments}
                        </span>
                      )}
                      {memory._count.reactions > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs">
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                          {memory._count.reactions}
                        </span>
                      )}
                    </div>
                  </div>
                  {memory.tags && memory.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {memory.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">{tag}</span>
                      ))}
                      {memory.tags.length > 3 && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">+{memory.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {memories.map(memory => (
                <Link
                  key={memory.id}
                  href={`/dashboard/memories/${memory.id}`}
                  className="group flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-emerald-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-800"
                >
                  {memory.media && memory.media.length > 0 ? (
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                      <img src={memory.media[0].url} alt={memory.title} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                      <svg className="h-6 w-6 text-emerald-300 dark:text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-400 truncate">{memory.title}</h3>
                    {memory.description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">{memory.description}</p>}
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                      {memory.date && <span>{formatDate(memory.date)}</span>}
                      {memory.location && <span>{memory.location}</span>}
                      {memory.tags && memory.tags.length > 0 && memory.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    {memory._count.comments > 0 && <span className="text-xs">{memory._count.comments} comments</span>}
                    {memory._count.reactions > 0 && <span className="text-xs">{memory._count.reactions} likes</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div ref={sentinelRef} />

        {!loading && memories.length > 0 && page < totalPages && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-all"
            >
              {loadingMore ? 'Loading...' : 'Load more'}
            </button>
          </div>
        )}

        {!loading && memories.length > 0 && page >= totalPages && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-center text-xs text-slate-400 dark:text-slate-500">All memories loaded</p>
          </div>
        )}
      </Card>
    </div>
  );
}
