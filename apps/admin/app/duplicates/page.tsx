'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { adminFetch } from '@/lib/admin-api';

interface DuplicateStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  merged: number;
}

interface MemberProfile {
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

interface Duplicate {
  id: string;
  sourceMember: MemberProfile;
  targetMember: MemberProfile;
  confidenceScore: number;
  matchFactors: string[];
  status: string;
  createdAt: string;
}

interface DuplicatesResponse {
  duplicates: Duplicate[];
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
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  MERGED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

const STATUS_OPTIONS = ['PENDING', 'APPROVED', 'REJECTED'];
const SCORE_RANGES = [
  { label: 'All', min: undefined, max: undefined },
  { label: 'High (>80%)', min: 80, max: undefined },
  { label: 'Medium (60-80%)', min: 60, max: 80 },
  { label: 'Low (<60%)', min: undefined, max: 60 },
];

function getScoreColor(score: number): string {
  if (score > 80) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  if (score >= 60) return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
  return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
}

export default function DuplicatesPage() {
  const [stats, setStats] = useState<DuplicateStats | null>(null);
  const [duplicates, setDuplicates] = useState<Duplicate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [scoreRange, setScoreRange] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDuplicate, setSelectedDuplicate] = useState<Duplicate | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadDuplicates = useCallback(async (pageNum: number, searchVal: string, statFilter: string, scoreFilter: string) => {
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: '20' });
      if (searchVal) params.set('search', searchVal);
      if (statFilter) params.set('status', statFilter);
      const range = SCORE_RANGES.find(r => r.label === scoreFilter);
      if (range?.min !== undefined) params.set('minScore', String(range.min));
      if (range?.max !== undefined) params.set('maxScore', String(range.max));

      const data = await adminFetch<DuplicatesResponse>(`/duplicates?${params.toString()}`);
      setDuplicates(data.duplicates || []);
      setTotalPages(data.totalPages || 1);
    } catch { setDuplicates([]); }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const data = await adminFetch<DuplicateStats>('/duplicates/stats');
      setStats(data);
    } catch { setStats(null); }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadStats(), loadDuplicates(1, '', '', '')]);
    } catch { setError('Failed to load duplicates. Is the API running?'); }
    finally { setLoading(false); }
  }, [loadStats, loadDuplicates]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  useEffect(() => {
    loadDuplicates(page, debouncedSearch, statusFilter, scoreRange);
  }, [page, debouncedSearch, statusFilter, scoreRange, loadDuplicates]);

  const handleDetect = async () => {
    setDetecting(true);
    try {
      await adminFetch('/duplicates/detect');
      await fetchAll();
    } catch { setError('Failed to run detection scan.'); }
    finally { setDetecting(false); }
  };

  const handleReview = async (id: string, action: string) => {
    setActionLoading(id);
    try {
      await adminFetch(`/duplicates/${id}/review`, { method: 'PATCH', body: JSON.stringify({ action }) });
      setDuplicates(prev => prev.map(d => d.id === id ? { ...d, status: action === 'approve' ? 'APPROVED' : 'REJECTED' } : d));
      setSelectedDuplicate(null);
      loadStats();
    } catch { setError('Failed to review duplicate.'); }
    finally { setActionLoading(null); }
  };

  const handleForceMerge = async (id: string) => {
    if (!confirm('Force merge this duplicate pair? This will merge source into target.')) return;
    setActionLoading(id);
    try {
      await adminFetch('/merge/execute', { method: 'POST', body: JSON.stringify({ duplicateId: id }) });
      setDuplicates(prev => prev.map(d => d.id === id ? { ...d, status: 'MERGED' } : d));
      setSelectedDuplicate(null);
      loadStats();
    } catch { setError('Failed to merge.'); }
    finally { setActionLoading(null); }
  };

  const openDetail = async (dup: Duplicate) => {
    setDetailLoading(true);
    setSelectedDuplicate(dup);
    try {
      const full = await adminFetch<Duplicate>(`/duplicates/${dup.id}`);
      setSelectedDuplicate(full);
    } catch { /* keep partial data */ }
    finally { setDetailLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Duplicate Detection</h1>
          <p className="text-muted-foreground">Identify and manage potential duplicate members across families.</p>
        </div>
        <button
          onClick={handleDetect}
          disabled={detecting}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {detecting ? 'Scanning...' : 'Run Detection Scan'}
        </button>
      </div>

      {error && <ErrorMessage message={error} onRetry={fetchAll} />}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard title="Total Duplicates" value={stats?.total ?? 0} description="All detected pairs" />
            <StatCard title="Pending Review" value={stats?.pending ?? 0} description="Awaiting action" color="text-amber-600" />
            <StatCard title="Approved" value={stats?.approved ?? 0} description="Confirmed duplicates" color="text-green-600" />
            <StatCard title="Rejected" value={stats?.rejected ?? 0} description="Dismissed pairs" color="text-red-600" />
            <StatCard title="Merged" value={stats?.merged ?? 0} description="Successfully merged" color="text-blue-600" />
          </div>

          <div className="rounded-xl border border-border/60 bg-card shadow-sm">
            <div className="flex flex-col gap-3 border-b border-border/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="font-semibold">All Duplicates</h3>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  placeholder="Search duplicates..."
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
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                  value={scoreRange}
                  onChange={(e) => { setScoreRange(e.target.value); setPage(1); }}
                  className="rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                >
                  {SCORE_RANGES.map((r) => <option key={r.label} value={r.label}>{r.label}</option>)}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-muted-foreground">
                    <th className="px-6 py-3 font-medium">Source Member</th>
                    <th className="px-6 py-3 font-medium">Target Member</th>
                    <th className="px-6 py-3 font-medium">Confidence</th>
                    <th className="px-6 py-3 font-medium">Match Factors</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {duplicates.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">No duplicates found</td>
                    </tr>
                  ) : (
                    duplicates.map((d) => (
                      <tr key={d.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-3">
                          <p className="font-medium">{d.sourceMember.firstName} {d.sourceMember.lastName}</p>
                          <p className="text-xs text-muted-foreground">{d.sourceMember.familyName ?? '—'}</p>
                        </td>
                        <td className="px-6 py-3">
                          <p className="font-medium">{d.targetMember.firstName} {d.targetMember.lastName}</p>
                          <p className="text-xs text-muted-foreground">{d.targetMember.familyName ?? '—'}</p>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getScoreColor(d.confidenceScore)}`}>
                            {d.confidenceScore.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex flex-wrap gap-1">
                            {d.matchFactors.map((f, i) => (
                              <span key={i} className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                {f}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[d.status] || 'bg-gray-100 text-gray-800'}`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">
                          {new Date(d.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex gap-1">
                            <button
                              onClick={() => openDetail(d)}
                              className="rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                            >
                              View
                            </button>
                            {d.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => handleForceMerge(d.id)}
                                  disabled={actionLoading === d.id}
                                  className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
                                >
                                  Merge
                                </button>
                                <button
                                  onClick={() => handleReview(d.id, 'reject')}
                                  disabled={actionLoading === d.id}
                                  className="rounded bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive transition-colors hover:bg-destructive hover:text-white disabled:opacity-50"
                                >
                                  Dismiss
                                </button>
                              </>
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

          {selectedDuplicate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedDuplicate(null)}>
              <div className="max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-card p-6 shadow-xl border border-border/60" onClick={e => e.stopPropagation()}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold">Duplicate Detail</h2>
                    <p className="text-xs text-muted-foreground font-mono">{selectedDuplicate.id}</p>
                  </div>
                  <button onClick={() => setSelectedDuplicate(null)} className="rounded p-1 text-muted-foreground hover:text-foreground">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                {detailLoading ? (
                  <LoadingSpinner />
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg border border-border/60 p-4">
                        <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Source Member</h3>
                        <div className="space-y-2 text-sm">
                          <p><span className="text-muted-foreground">Name:</span> <span className="font-medium">{selectedDuplicate.sourceMember.firstName} {selectedDuplicate.sourceMember.lastName}</span></p>
                          <p><span className="text-muted-foreground">Family:</span> <span className="font-medium">{selectedDuplicate.sourceMember.familyName ?? '—'}</span></p>
                          <p><span className="text-muted-foreground">Birth:</span> <span className="font-medium">{selectedDuplicate.sourceMember.birthDate ?? '—'}</span></p>
                          <p><span className="text-muted-foreground">Death:</span> <span className="font-medium">{selectedDuplicate.sourceMember.deathDate ?? '—'}</span></p>
                          <p><span className="text-muted-foreground">Gender:</span> <span className="font-medium">{selectedDuplicate.sourceMember.gender ?? '—'}</span></p>
                          <p><span className="text-muted-foreground">Email:</span> <span className="font-medium">{selectedDuplicate.sourceMember.email ?? '—'}</span></p>
                        </div>
                      </div>
                      <div className="rounded-lg border border-border/60 p-4">
                        <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Target Member</h3>
                        <div className="space-y-2 text-sm">
                          <p><span className="text-muted-foreground">Name:</span> <span className="font-medium">{selectedDuplicate.targetMember.firstName} {selectedDuplicate.targetMember.lastName}</span></p>
                          <p><span className="text-muted-foreground">Family:</span> <span className="font-medium">{selectedDuplicate.targetMember.familyName ?? '—'}</span></p>
                          <p><span className="text-muted-foreground">Birth:</span> <span className="font-medium">{selectedDuplicate.targetMember.birthDate ?? '—'}</span></p>
                          <p><span className="text-muted-foreground">Death:</span> <span className="font-medium">{selectedDuplicate.targetMember.deathDate ?? '—'}</span></p>
                          <p><span className="text-muted-foreground">Gender:</span> <span className="font-medium">{selectedDuplicate.targetMember.gender ?? '—'}</span></p>
                          <p><span className="text-muted-foreground">Email:</span> <span className="font-medium">{selectedDuplicate.targetMember.email ?? '—'}</span></p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border/60 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold uppercase text-muted-foreground">Confidence Score</h3>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getScoreColor(selectedDuplicate.confidenceScore)}`}>
                          {selectedDuplicate.confidenceScore.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {selectedDuplicate.matchFactors.map((f, i) => (
                          <span key={i} className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-lg border border-border/60 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold uppercase text-muted-foreground">Status</h3>
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[selectedDuplicate.status] || ''}`}>
                          {selectedDuplicate.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Detected: {new Date(selectedDuplicate.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-6 pt-4 border-t">
                  {selectedDuplicate.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleReview(selectedDuplicate.id, 'approve')}
                        disabled={actionLoading === selectedDuplicate.id}
                        className="rounded bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleForceMerge(selectedDuplicate.id)}
                        disabled={actionLoading === selectedDuplicate.id}
                        className="rounded bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                      >
                        Force Merge
                      </button>
                      <button
                        onClick={() => handleReview(selectedDuplicate.id, 'reject')}
                        disabled={actionLoading === selectedDuplicate.id}
                        className="rounded bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive hover:text-white disabled:opacity-50"
                      >
                        Dismiss
                      </button>
                    </>
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
