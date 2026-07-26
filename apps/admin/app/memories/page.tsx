'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { adminFetch } from '@/lib/admin-api';

interface MemoryStats {
  total: number;
  totalMedia: number;
  totalComments: number;
  totalReactions: number;
}

interface Memory {
  id: string;
  displayId: string;
  title: string;
  description: string | null;
  date: string | null;
  location: string | null;
  visibility: string;
  tags: string[] | null;
  isHidden: boolean;
  user: { id: string; name: string; email: string };
  family: { id: string; name: string } | null;
  _count: { media: number; comments: number; reactions: number };
  createdAt: string;
}

interface MemoriesResponse {
  memories: Memory[];
  total: number;
  totalPages: number;
}

function StatCard({ title, value, description }: { title: string; value: string | number; description: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function ErrorMessage({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
      <p className="text-sm text-destructive">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 text-sm font-medium text-primary hover:underline">
          Retry
        </button>
      )}
    </div>
  );
}

function UserAvatar({ user }: { user: { name: string } }) {
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
      {initials}
    </div>
  );
}

function VisibilityBadge({ visibility }: { visibility: string }) {
  const colors: Record<string, string> = {
    PUBLIC: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    FAMILY: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    PRIVATE: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[visibility] || 'bg-gray-100 text-gray-800'}`}>
      {visibility}
    </span>
  );
}

export default function AdminMemoriesPage() {
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadMemories = useCallback(async (pageNum: number, searchVal: string, visFilter: string) => {
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: '15' });
      if (searchVal) params.set('search', searchVal);
      if (visFilter) params.set('visibility', visFilter);
      const data = await adminFetch<MemoriesResponse>(`/memories?${params.toString()}`);
      setMemories(data.memories || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch { setMemories([]); }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await adminFetch<MemoryStats>('/memories/stats');
      setStats(data);
    } catch { setStats(null); }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadStats(), loadMemories(1, '', '')]);
    } catch { setError('Failed to load memories. Is the API running?'); }
    finally { setLoading(false); }
  }, [loadStats, loadMemories]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  useEffect(() => {
    loadMemories(page, debouncedSearch, visibilityFilter);
  }, [page, debouncedSearch, visibilityFilter, loadMemories]);

  const handleHide = async (id: string) => {
    setActionLoading(id);
    try {
      await adminFetch(`/memories/${id}/hide`, { method: 'PATCH' });
      setMemories(prev => prev.map(m => m.id === id ? { ...m, isHidden: true } : m));
      loadStats();
    } catch { setError('Failed to hide memory.'); }
    finally { setActionLoading(null); }
  };

  const handleRestore = async (id: string) => {
    setActionLoading(id);
    try {
      await adminFetch(`/memories/${id}/restore`, { method: 'PATCH' });
      setMemories(prev => prev.map(m => m.id === id ? { ...m, isHidden: false } : m));
      loadStats();
    } catch { setError('Failed to restore memory.'); }
    finally { setActionLoading(null); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this memory? This cannot be undone.')) return;
    setActionLoading(id);
    try {
      await adminFetch(`/memories/${id}`, { method: 'DELETE' });
      setMemories(prev => prev.filter(m => m.id !== id));
      setSelectedMemory(null);
      loadStats();
    } catch { setError('Failed to delete memory.'); }
    finally { setActionLoading(null); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Memories Management</h1>
        <p className="text-muted-foreground">View and manage all user memories across the platform. ({total} total)</p>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchAll} />}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Memories" value={stats?.total ?? 0} description="All memories created" />
            <StatCard title="Total Media" value={stats?.totalMedia ?? 0} description="Images and videos uploaded" />
            <StatCard title="Total Comments" value={stats?.totalComments ?? 0} description="Comments on memories" />
            <StatCard title="Total Reactions" value={stats?.totalReactions ?? 0} description="Reactions across all memories" />
          </div>

          <div className="rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="flex flex-col gap-3 border-b border-border/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-semibold">All Memories</h3>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  placeholder="Search memories..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <select
                  value={visibilityFilter}
                  onChange={(e) => { setVisibilityFilter(e.target.value); setPage(1); }}
                  className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All Visibility</option>
                  <option value="PUBLIC">Public</option>
                  <option value="FAMILY">Family</option>
                  <option value="PRIVATE">Private</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-muted-foreground">
                    <th className="px-6 py-3 font-medium">User</th>
                    <th className="px-6 py-3 font-medium">Title</th>
                    <th className="px-6 py-3 font-medium">Family</th>
                    <th className="px-6 py-3 font-medium">Visibility</th>
                    <th className="px-6 py-3 font-medium">Media</th>
                    <th className="px-6 py-3 font-medium">Comments</th>
                    <th className="px-6 py-3 font-medium">Reactions</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {memories.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-8 text-center text-muted-foreground">
                        No memories found
                      </td>
                    </tr>
                  ) : (
                    memories.map(m => (
                      <tr key={m.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <UserAvatar user={m.user} />
                            <div className="min-w-0">
                              <p className="truncate font-medium">{m.user.name}</p>
                              <p className="truncate text-xs text-muted-foreground">{m.user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <button onClick={() => setSelectedMemory(m)} className="font-medium text-primary hover:underline">
                            {m.title}
                          </button>
                          {m.displayId && <p className="text-xs text-muted-foreground font-mono">{m.displayId}</p>}
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">{m.family?.name ?? '—'}</td>
                        <td className="px-6 py-3"><VisibilityBadge visibility={m.visibility} /></td>
                        <td className="px-6 py-3 text-muted-foreground">{m._count.media}</td>
                        <td className="px-6 py-3 text-muted-foreground">{m._count.comments}</td>
                        <td className="px-6 py-3 text-muted-foreground">{m._count.reactions}</td>
                        <td className="px-6 py-3 text-muted-foreground">
                          {m.date ? new Date(m.date).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-3">
                          {m.isHidden ? (
                            <span className="inline-flex rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-destructive">Hidden</span>
                          ) : (
                            <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">Visible</span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex gap-1">
                            {m.isHidden ? (
                              <button
                                onClick={() => handleRestore(m.id)}
                                disabled={actionLoading === m.id}
                                className="rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 disabled:opacity-50"
                              >
                                Restore
                              </button>
                            ) : (
                              <button
                                onClick={() => handleHide(m.id)}
                                disabled={actionLoading === m.id}
                                className="rounded bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 disabled:opacity-50"
                              >
                                Hide
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(m.id)}
                              disabled={actionLoading === m.id}
                              className="rounded bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive hover:text-white disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border/60 px-6 py-3">
                <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="rounded border border-border/60 px-3 py-1 text-xs font-medium disabled:opacity-50">Prev</button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded border border-border/60 px-3 py-1 text-xs font-medium disabled:opacity-50">Next</button>
                </div>
              </div>
            )}
          </div>

          {selectedMemory && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedMemory(null)}>
              <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card p-6 shadow-xl border border-border/60" onClick={e => e.stopPropagation()}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold">{selectedMemory.title}</h2>
                    <p className="text-xs text-muted-foreground font-mono">{selectedMemory.displayId}</p>
                  </div>
                  <button onClick={() => setSelectedMemory(null)} className="rounded p-1 text-muted-foreground hover:text-foreground">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Author</span><span className="font-medium">{selectedMemory.user.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Family</span><span className="font-medium">{selectedMemory.family?.name ?? '—'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Visibility</span><VisibilityBadge visibility={selectedMemory.visibility} /></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span className="font-medium">{new Date(selectedMemory.createdAt).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={`font-medium ${selectedMemory.isHidden ? 'text-destructive' : 'text-green-600'}`}>{selectedMemory.isHidden ? 'Hidden' : 'Visible'}</span></div>
                  {selectedMemory.description && (
                    <div className="border-t pt-3 mt-3">
                      <p className="text-muted-foreground mb-1">Description</p>
                      <p>{selectedMemory.description}</p>
                    </div>
                  )}
                  {selectedMemory.tags && selectedMemory.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedMemory.tags.map(tag => (
                        <span key={tag} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-6 pt-4 border-t">
                  {selectedMemory.isHidden ? (
                    <button onClick={() => { handleRestore(selectedMemory.id); setSelectedMemory(null); }} className="rounded bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100">Restore</button>
                  ) : (
                    <button onClick={() => { handleHide(selectedMemory.id); setSelectedMemory(null); }} className="rounded bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100">Hide</button>
                  )}
                  <button onClick={() => { handleDelete(selectedMemory.id); }} className="rounded bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive hover:text-white">Delete</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
