'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { adminFetch } from '@/lib/admin-api';

interface SubClanStats {
  total: number;
  active: number;
  totalFamilies: number;
}

interface SubClanOwner {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface SubClanClan {
  id: string;
  name: string;
}

interface SubClan {
  id: string;
  displayId: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  owner: SubClanOwner | null;
  clan: SubClanClan | null;
  _count: { families: number };
  createdAt: string;
  updatedAt: string;
}

interface SubClansResponse {
  subclans: SubClan[];
  total: number;
  totalPages: number;
}

function StatCard({ title, value, description, color }: { title: string; value: string | number; description: string; color?: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className={`mt-2 text-3xl font-bold ${color || ''}`}>{value}</p>
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
        <button onClick={onRetry} className="mt-2 text-sm font-medium text-primary hover:underline">Retry</button>
      )}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  SUSPENDED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  ARCHIVED: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
};

const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED', 'ARCHIVED'];

export default function AdminSubClansPage() {
  const [stats, setStats] = useState<SubClanStats | null>(null);
  const [subclans, setSubClans] = useState<SubClan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedSubClan, setSelectedSubClan] = useState<SubClan | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadSubClans = useCallback(async (pageNum: number, searchVal: string, statFilter: string) => {
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: '20' });
      if (searchVal) params.set('search', searchVal);
      if (statFilter) params.set('status', statFilter);
      const data = await adminFetch<SubClansResponse>(`/admin-api/subclans?${params.toString()}`);
      setSubClans(data.subclans || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      setSubClans([]);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await adminFetch<SubClanStats>('/admin-api/subclans/stats');
      setStats(data);
    } catch {
      setStats(null);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadStats(), loadSubClans(1, '', '')]);
    } catch {
      setError('Failed to load subclans. Is the API running?');
    } finally {
      setLoading(false);
    }
  }, [loadStats, loadSubClans]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  useEffect(() => {
    loadSubClans(page, debouncedSearch, statusFilter);
  }, [page, debouncedSearch, statusFilter, loadSubClans]);

  const handleDelete = async (subclan: SubClan) => {
    if (!confirm(`Permanently delete subclan "${subclan.name}"? This cannot be undone.`)) return;
    setActionLoading(subclan.id);
    try {
      await adminFetch(`/admin-api/subclans/${subclan.id}`, { method: 'DELETE' });
      setSubClans((prev) => prev.filter((s) => s.id !== subclan.id));
      setSelectedSubClan(null);
      loadStats();
    } catch {
      setError('Failed to delete subclan.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SubClans Management</h1>
          <p className="text-muted-foreground">Manage all subclans across the platform. ({total} total)</p>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchAll} />}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard title="Total SubClans" value={stats?.total ?? 0} description="All subclans created" />
            <StatCard title="Active" value={stats?.active ?? 0} description="Currently active subclans" color="text-green-600" />
            <StatCard title="Total Families" value={stats?.totalFamilies ?? 0} description="Families across all subclans" color="text-blue-600" />
          </div>

          <div className="rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="flex flex-col gap-3 border-b border-border/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-semibold">All SubClans</h3>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  placeholder="Search subclans..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="PENDING">Pending</option>
                  <option value="SUSPENDED">Suspended</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-muted-foreground">
                    <th className="px-6 py-3 font-medium">Display ID</th>
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Parent Clan</th>
                    <th className="px-6 py-3 font-medium">Owner</th>
                    <th className="px-6 py-3 font-medium">Families</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Created</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subclans.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">No subclans found</td>
                    </tr>
                  ) : (
                    subclans.map((subclan) => (
                      <tr key={subclan.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-3">
                          <span className="font-mono text-xs text-muted-foreground">{subclan.displayId}</span>
                        </td>
                        <td className="px-6 py-3">
                          <button onClick={() => setSelectedSubClan(subclan)} className="font-medium text-primary hover:underline text-left">
                            {subclan.name}
                          </button>
                          <p className="text-xs text-muted-foreground">/{subclan.slug}</p>
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">{subclan.clan?.name ?? '—'}</td>
                        <td className="px-6 py-3 text-muted-foreground">{subclan.owner?.name ?? '—'}</td>
                        <td className="px-6 py-3 text-muted-foreground">{subclan._count?.families ?? 0}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[subclan.status] || 'bg-gray-100 text-gray-800'}`}>
                            {subclan.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">{new Date(subclan.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-3">
                          <div className="flex gap-1 flex-wrap">
                            <button
                              onClick={() => setSelectedSubClan(subclan)}
                              className="rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDelete(subclan)}
                              disabled={actionLoading === subclan.id}
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
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="rounded border border-border/60 px-3 py-1 text-xs font-medium disabled:opacity-50">Prev</button>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="rounded border border-border/60 px-3 py-1 text-xs font-medium disabled:opacity-50">Next</button>
                </div>
              </div>
            )}
          </div>

          {selectedSubClan && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedSubClan(null)}>
              <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card p-6 shadow-xl border border-border/60" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold">{selectedSubClan.name}</h2>
                    <p className="text-xs text-muted-foreground font-mono">{selectedSubClan.displayId} &middot; /{selectedSubClan.slug}</p>
                  </div>
                  <button onClick={() => setSelectedSubClan(null)} className="rounded p-1 text-muted-foreground hover:text-foreground">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Owner</span>
                    <span className="font-medium">{selectedSubClan.owner?.name ?? '—'} {selectedSubClan.owner?.email ? `(${selectedSubClan.owner.email})` : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Parent Clan</span>
                    <span className="font-medium">{selectedSubClan.clan?.name ?? '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[selectedSubClan.status] || ''}`}>{selectedSubClan.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Families</span>
                    <span className="font-medium">{selectedSubClan._count?.families ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">{new Date(selectedSubClan.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Updated</span>
                    <span className="font-medium">{new Date(selectedSubClan.updatedAt).toLocaleString()}</span>
                  </div>

                  {selectedSubClan.description && (
                    <div className="border-t pt-3 mt-3">
                      <p className="text-muted-foreground mb-1">Description</p>
                      <p>{selectedSubClan.description}</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-6 pt-4 border-t">
                  <button onClick={() => handleDelete(selectedSubClan)} className="rounded bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive hover:text-white">Delete</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
