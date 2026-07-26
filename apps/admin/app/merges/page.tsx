'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { adminFetch } from '@/lib/admin-api';

interface MergeStats {
  total: number;
  completed: number;
  undone: number;
}

interface MemberSnapshot {
  id: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  deathDate?: string;
  gender?: string;
  email?: string;
  phone?: string;
  bio?: string;
  familyId?: string;
  familyName?: string;
}

interface MergeRecord {
  id: string;
  snapshotId: string;
  sourceMember: MemberSnapshot;
  targetMember: MemberSnapshot;
  strategy: string;
  performedBy: string;
  status: string;
  createdAt: string;
}

interface MergesResponse {
  merges: MergeRecord[];
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
  MERGED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  UNDONE: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

const STRATEGY_COLORS: Record<string, string> = {
  MANUAL: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  AUTO: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  FORCE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  CONSERVATIVE: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
};

export default function MergesPage() {
  const [stats, setStats] = useState<MergeStats | null>(null);
  const [merges, setMerges] = useState<MergeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMerge, setSelectedMerge] = useState<MergeRecord | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadMerges = useCallback(async (pageNum: number, searchVal: string) => {
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: '20' });
      if (searchVal) params.set('search', searchVal);

      const data = await adminFetch<MergesResponse>(`/merge/history?${params.toString()}`);
      setMerges(data.merges || []);
      setTotalPages(data.totalPages || 1);
    } catch { setMerges([]); }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await adminFetch<MergeStats>('/merge/history/stats');
      setStats(data);
    } catch { setStats(null); }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadStats(), loadMerges(1, '')]);
    } catch { setError('Failed to load merge history. Is the API running?'); }
    finally { setLoading(false); }
  }, [loadStats, loadMerges]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  useEffect(() => {
    loadMerges(page, debouncedSearch);
  }, [page, debouncedSearch, loadMerges]);

  const handleUndo = async (snapshotId: string) => {
    if (!confirm('Undo this merge? This will restore the original members.')) return;
    setActionLoading(snapshotId);
    try {
      await adminFetch(`/merge/${snapshotId}/undo`, { method: 'POST' });
      setMerges(prev => prev.map(m => m.snapshotId === snapshotId ? { ...m, status: 'UNDONE' } : m));
      setSelectedMerge(null);
      loadStats();
    } catch { setError('Failed to undo merge.'); }
    finally { setActionLoading(null); }
  };

  const openDetail = async (merge: MergeRecord) => {
    setDetailLoading(true);
    setSelectedMerge(merge);
    try {
      const full = await adminFetch<MergeRecord>(`/merge/history/${merge.id}`);
      setSelectedMerge(full);
    } catch { /* keep partial data */ }
    finally { setDetailLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Merge History</h1>
        <p className="text-muted-foreground">Review all merge operations and undo if needed.</p>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchAll} />}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard title="Total Merges" value={stats?.total ?? 0} description="All merge operations" />
            <StatCard title="Completed" value={stats?.completed ?? 0} description="Active merges" color="text-green-600" />
            <StatCard title="Undone" value={stats?.undone ?? 0} description="Reverted merges" color="text-gray-600" />
          </div>

          <div className="rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="flex flex-col gap-3 border-b border-border/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-semibold">All Merges</h3>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  placeholder="Search merges..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-muted-foreground">
                    <th className="px-6 py-3 font-medium">Snapshot ID</th>
                    <th className="px-6 py-3 font-medium">Source Member</th>
                    <th className="px-6 py-3 font-medium">Target Member</th>
                    <th className="px-6 py-3 font-medium">Strategy</th>
                    <th className="px-6 py-3 font-medium">Performed By</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {merges.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">No merge history found</td>
                    </tr>
                  ) : (
                    merges.map((m) => (
                      <tr key={m.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-3 font-mono text-xs text-muted-foreground">{m.snapshotId}</td>
                        <td className="px-6 py-3">
                          <p className="font-medium">{m.sourceMember.firstName} {m.sourceMember.lastName}</p>
                          <p className="text-xs text-muted-foreground">{m.sourceMember.familyName ?? '—'}</p>
                        </td>
                        <td className="px-6 py-3">
                          <p className="font-medium">{m.targetMember.firstName} {m.targetMember.lastName}</p>
                          <p className="text-xs text-muted-foreground">{m.targetMember.familyName ?? '—'}</p>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STRATEGY_COLORS[m.strategy] || 'bg-gray-100 text-gray-800'}`}>
                            {m.strategy}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">{m.performedBy}</td>
                        <td className="px-6 py-3 text-muted-foreground">
                          {new Date(m.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[m.status] || 'bg-gray-100 text-gray-800'}`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex gap-1">
                            <button
                              onClick={() => openDetail(m)}
                              className="rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                            >
                              View
                            </button>
                            {m.status === 'MERGED' && (
                              <button
                                onClick={() => handleUndo(m.snapshotId)}
                                disabled={actionLoading === m.snapshotId}
                                className="rounded bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive hover:text-white disabled:opacity-50"
                              >
                                {actionLoading === m.snapshotId ? '...' : 'Undo'}
                              </button>
                            )}
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

          {selectedMerge && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedMerge(null)}>
              <div className="max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-card p-6 shadow-xl border border-border/60" onClick={e => e.stopPropagation()}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold">Merge Detail</h2>
                    <p className="text-xs text-muted-foreground font-mono">{selectedMerge.snapshotId}</p>
                  </div>
                  <button onClick={() => setSelectedMerge(null)} className="rounded p-1 text-muted-foreground hover:text-foreground">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                {detailLoading ? (
                  <LoadingSpinner />
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-border/60 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold uppercase text-muted-foreground">Merge Info</h3>
                        <div className="flex gap-2">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STRATEGY_COLORS[selectedMerge.strategy] || ''}`}>
                            {selectedMerge.strategy}
                          </span>
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[selectedMerge.status] || ''}`}>
                            {selectedMerge.status}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <p><span className="text-muted-foreground">Performed By:</span> <span className="font-medium">{selectedMerge.performedBy}</span></p>
                        <p><span className="text-muted-foreground">Date:</span> <span className="font-medium">{new Date(selectedMerge.createdAt).toLocaleString()}</span></p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg border border-border/60 p-4">
                        <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Source Member (Merged Into Target)</h3>
                        <div className="space-y-2 text-sm">
                          <p><span className="text-muted-foreground">Name:</span> <span className="font-medium">{selectedMerge.sourceMember.firstName} {selectedMerge.sourceMember.lastName}</span></p>
                          <p><span className="text-muted-foreground">Family:</span> <span className="font-medium">{selectedMerge.sourceMember.familyName ?? '—'}</span></p>
                          <p><span className="text-muted-foreground">Birth:</span> <span className="font-medium">{selectedMerge.sourceMember.birthDate ?? '—'}</span></p>
                          <p><span className="text-muted-foreground">Death:</span> <span className="font-medium">{selectedMerge.sourceMember.deathDate ?? '—'}</span></p>
                          <p><span className="text-muted-foreground">Gender:</span> <span className="font-medium">{selectedMerge.sourceMember.gender ?? '—'}</span></p>
                          <p><span className="text-muted-foreground">Email:</span> <span className="font-medium">{selectedMerge.sourceMember.email ?? '—'}</span></p>
                        </div>
                      </div>
                      <div className="rounded-lg border border-border/60 p-4">
                        <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Target Member (Survived)</h3>
                        <div className="space-y-2 text-sm">
                          <p><span className="text-muted-foreground">Name:</span> <span className="font-medium">{selectedMerge.targetMember.firstName} {selectedMerge.targetMember.lastName}</span></p>
                          <p><span className="text-muted-foreground">Family:</span> <span className="font-medium">{selectedMerge.targetMember.familyName ?? '—'}</span></p>
                          <p><span className="text-muted-foreground">Birth:</span> <span className="font-medium">{selectedMerge.targetMember.birthDate ?? '—'}</span></p>
                          <p><span className="text-muted-foreground">Death:</span> <span className="font-medium">{selectedMerge.targetMember.deathDate ?? '—'}</span></p>
                          <p><span className="text-muted-foreground">Gender:</span> <span className="font-medium">{selectedMerge.targetMember.gender ?? '—'}</span></p>
                          <p><span className="text-muted-foreground">Email:</span> <span className="font-medium">{selectedMerge.targetMember.email ?? '—'}</span></p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border/60 p-4">
                      <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">Field Diff</h3>
                      <div className="text-sm space-y-1">
                        {(['firstName', 'lastName', 'birthDate', 'deathDate', 'gender', 'email', 'phone'] as const).map((field) => {
                          const srcVal = selectedMerge.sourceMember[field] ?? '';
                          const tgtVal = selectedMerge.targetMember[field] ?? '';
                          if (srcVal === tgtVal) return null;
                          return (
                            <div key={field} className="flex gap-4">
                              <span className="w-24 text-muted-foreground capitalize">{field}:</span>
                              <span className="text-red-600 line-through">{srcVal || '—'}</span>
                              <span className="text-green-600">{tgtVal || '—'}</span>
                            </div>
                          );
                        })}
                        {(['firstName', 'lastName', 'birthDate', 'deathDate', 'gender', 'email', 'phone'] as const).every(
                          (f) => (selectedMerge.sourceMember[f] ?? '') === (selectedMerge.targetMember[f] ?? '')
                        ) && <p className="text-muted-foreground">No differences found in core fields.</p>}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-6 pt-4 border-t">
                  {selectedMerge.status === 'MERGED' && (
                    <button
                      onClick={() => handleUndo(selectedMerge.snapshotId)}
                      disabled={actionLoading === selectedMerge.snapshotId}
                      className="rounded bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive hover:text-white disabled:opacity-50"
                    >
                      Undo Merge
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
