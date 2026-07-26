'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { adminFetch } from '@/lib/admin-api';

interface CommunityStats {
  total: number;
  active: number;
  verified: number;
  private: number;
}

interface CommunityOwner {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface CommunityClan {
  id: string;
  name: string;
  _count?: { families: number };
}

interface Community {
  id: string;
  displayId: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  verified: boolean;
  isPrivate: boolean;
  country: string | null;
  bannerUrl: string | null;
  logoUrl: string | null;
  owner: CommunityOwner | null;
  clans: CommunityClan[];
  _count: { clans: number; members: number };
  createdAt: string;
  updatedAt: string;
}

interface CommunitiesResponse {
  communities: Community[];
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

export default function AdminCommunitiesPage() {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadCommunities = useCallback(async (pageNum: number, searchVal: string, statFilter: string, verFilter: string) => {
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: '20' });
      if (searchVal) params.set('search', searchVal);
      if (statFilter) params.set('status', statFilter);
      if (verFilter) params.set('verified', verFilter);
      const data = await adminFetch<CommunitiesResponse>(`/admin-api/communities?${params.toString()}`);
      setCommunities(data.communities || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch {
      setCommunities([]);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await adminFetch<CommunityStats>('/admin-api/communities/stats');
      setStats(data);
    } catch {
      setStats(null);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadStats(), loadCommunities(1, '', '', '')]);
    } catch {
      setError('Failed to load communities. Is the API running?');
    } finally {
      setLoading(false);
    }
  }, [loadStats, loadCommunities]);

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
    loadCommunities(page, debouncedSearch, statusFilter, verifiedFilter);
  }, [page, debouncedSearch, statusFilter, verifiedFilter, loadCommunities]);

  const handleToggleVerified = async (community: Community) => {
    const newVerified = !community.verified;
    setActionLoading(community.id);
    try {
      await adminFetch(`/admin-api/communities/${community.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ verified: newVerified }),
      });
      setCommunities((prev) =>
        prev.map((c) => (c.id === community.id ? { ...c, verified: newVerified } : c))
      );
      if (selectedCommunity?.id === community.id) {
        setSelectedCommunity((prev) => (prev ? { ...prev, verified: newVerified } : null));
      }
      loadStats();
    } catch {
      setError('Failed to update verification status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (community: Community) => {
    if (!confirm(`Permanently delete community "${community.name}"? This cannot be undone.`)) return;
    setActionLoading(community.id);
    try {
      await adminFetch(`/admin-api/communities/${community.id}`, { method: 'DELETE' });
      setCommunities((prev) => prev.filter((c) => c.id !== community.id));
      setSelectedCommunity(null);
      loadStats();
    } catch {
      setError('Failed to delete community.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Communities Management</h1>
          <p className="text-muted-foreground">Manage all communities across the platform. ({total} total)</p>
        </div>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchAll} />}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Communities" value={stats?.total ?? 0} description="All communities created" />
            <StatCard title="Active" value={stats?.active ?? 0} description="Currently active communities" color="text-green-600" />
            <StatCard title="Verified" value={stats?.verified ?? 0} description="Verified communities" color="text-blue-600" />
            <StatCard title="Private" value={stats?.private ?? 0} description="Private communities" color="text-purple-600" />
          </div>

          <div className="rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="flex flex-col gap-3 border-b border-border/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-semibold">All Communities</h3>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  placeholder="Search communities..."
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
                <select
                  value={verifiedFilter}
                  onChange={(e) => { setVerifiedFilter(e.target.value); setPage(1); }}
                  className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">All Verified</option>
                  <option value="true">Verified</option>
                  <option value="false">Unverified</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-muted-foreground">
                    <th className="px-6 py-3 font-medium">Display ID</th>
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Owner</th>
                    <th className="px-6 py-3 font-medium">Clans</th>
                    <th className="px-6 py-3 font-medium">Verified</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Country</th>
                    <th className="px-6 py-3 font-medium">Created</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {communities.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-muted-foreground">No communities found</td>
                    </tr>
                  ) : (
                    communities.map((community) => (
                      <tr key={community.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-3">
                          <span className="font-mono text-xs text-muted-foreground">{community.displayId}</span>
                        </td>
                        <td className="px-6 py-3">
                          <button onClick={() => setSelectedCommunity(community)} className="font-medium text-primary hover:underline text-left">
                            {community.name}
                          </button>
                          <p className="text-xs text-muted-foreground">/{community.slug}</p>
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">{community.owner?.name ?? '—'}</td>
                        <td className="px-6 py-3 text-muted-foreground">{community._count?.clans ?? 0}</td>
                        <td className="px-6 py-3">
                          {community.verified ? (
                            <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              Verified
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[community.status] || 'bg-gray-100 text-gray-800'}`}>
                            {community.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">{community.country || '—'}</td>
                        <td className="px-6 py-3 text-muted-foreground">{new Date(community.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-3">
                          <div className="flex gap-1 flex-wrap">
                            <button
                              onClick={() => setSelectedCommunity(community)}
                              className="rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleToggleVerified(community)}
                              disabled={actionLoading === community.id}
                              className={`rounded px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                                community.verified
                                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                              }`}
                            >
                              {community.verified ? 'Unverify' : 'Verify'}
                            </button>
                            <button
                              onClick={() => handleDelete(community)}
                              disabled={actionLoading === community.id}
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

          {selectedCommunity && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedCommunity(null)}>
              <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-card p-6 shadow-xl border border-border/60" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold">{selectedCommunity.name}</h2>
                    <p className="text-xs text-muted-foreground font-mono">{selectedCommunity.displayId} &middot; /{selectedCommunity.slug}</p>
                  </div>
                  <button onClick={() => setSelectedCommunity(null)} className="rounded p-1 text-muted-foreground hover:text-foreground">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                {(selectedCommunity.bannerUrl || selectedCommunity.logoUrl) && (
                  <div className="mb-4 flex items-center gap-4">
                    {selectedCommunity.bannerUrl && (
                      <img src={selectedCommunity.bannerUrl} alt="Banner" className="h-20 flex-1 rounded-lg object-cover" />
                    )}
                    {selectedCommunity.logoUrl && (
                      <img src={selectedCommunity.logoUrl} alt="Logo" className="h-16 w-16 rounded-full object-cover" />
                    )}
                  </div>
                )}

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Owner</span>
                    <span className="font-medium">{selectedCommunity.owner?.name ?? '—'} {selectedCommunity.owner?.email ? `(${selectedCommunity.owner.email})` : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[selectedCommunity.status] || ''}`}>{selectedCommunity.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Verified</span>
                    <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${selectedCommunity.verified ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                      {selectedCommunity.verified ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Private</span>
                    <span className="font-medium">{selectedCommunity.isPrivate ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Country</span>
                    <span className="font-medium">{selectedCommunity.country || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Clans</span>
                    <span className="font-medium">{selectedCommunity._count?.clans ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Members</span>
                    <span className="font-medium">{selectedCommunity._count?.members ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">{new Date(selectedCommunity.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Updated</span>
                    <span className="font-medium">{new Date(selectedCommunity.updatedAt).toLocaleString()}</span>
                  </div>

                  {selectedCommunity.description && (
                    <div className="border-t pt-3 mt-3">
                      <p className="text-muted-foreground mb-1">Description</p>
                      <p>{selectedCommunity.description}</p>
                    </div>
                  )}

                  {selectedCommunity.clans && selectedCommunity.clans.length > 0 && (
                    <div className="border-t pt-3 mt-3">
                      <p className="text-muted-foreground mb-2">Clans ({selectedCommunity.clans.length})</p>
                      <div className="space-y-1">
                        {selectedCommunity.clans.map((clan) => (
                          <div key={clan.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-xs">
                            <span className="font-medium">{clan.name}</span>
                            {clan._count && <span className="text-muted-foreground">{clan._count.families} families</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-6 pt-4 border-t">
                  <button
                    onClick={() => handleToggleVerified(selectedCommunity)}
                    className={`rounded px-4 py-2 text-sm font-medium transition-colors ${
                      selectedCommunity.verified
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    {selectedCommunity.verified ? 'Remove Verification' : 'Verify Community'}
                  </button>
                  <button onClick={() => handleDelete(selectedCommunity)} className="rounded bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive hover:text-white">Delete</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
