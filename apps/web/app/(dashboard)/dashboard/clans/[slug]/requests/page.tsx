'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

function formatRelative(d: string | null | undefined): string {
  if (!d) return '';
  const date = new Date(d);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ClanRequestsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params.slug as string;

  const [clan, setClan] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [showResponseFor, setShowResponseFor] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const clanId = slug;
      const [clanData, listResult, statsResult] = await Promise.allSettled([
        api.clans.get(slug),
        api.clanRequests.list(clanId),
        api.clanRequests.stats(clanId),
      ]);
      if (clanData.status === 'fulfilled') setClan(clanData.value);
      else router.push('/dashboard/clans');
      if (listResult.status === 'fulfilled') {
        const data = listResult.value;
        setRequests(Array.isArray(data) ? data : data?.requests || []);
      }
      if (statsResult.status === 'fulfilled') setStats(statsResult.value);
    } catch {
      router.push('/dashboard/clans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [slug, router]);

  const handleAccept = async (id: string) => {
    setProcessingId(id);
    try {
      await api.clanRequests.accept(id, responseText || undefined);
      setResponseText('');
      setShowResponseFor(null);
      await loadData();
    } catch {
      /* empty */
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      await api.clanRequests.reject(id, responseText || undefined);
      setResponseText('');
      setShowResponseFor(null);
      await loadData();
    } catch {
      /* empty */
    } finally {
      setProcessingId(null);
    }
  };

  const isOwner = clan?.ownerId === user?.id || clan?.createdBy === user?.id;

  const filteredRequests = activeTab === 'all'
    ? requests
    : requests.filter((r: any) => r.status?.toLowerCase() === activeTab);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!clan) return null;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/dashboard/clans/${slug}`} className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
          â† Back to {clan.name}
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Join Requests</h1>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-2xl font-bold text-amber-600">{stats.pending ?? 0}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Pending</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-2xl font-bold text-emerald-600">{stats.approved ?? 0}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Approved</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total ?? 0}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Total</p>
          </div>
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors capitalize ${
              activeTab === tab
                ? 'border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {filteredRequests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-400 dark:text-slate-500 italic">No {activeTab} requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req: any) => (
            <div key={req.id} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{req.familyName || req.family?.name || 'Unknown Family'}</p>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      req.status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>{req.status}</span>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    Requested by {req.requesterName || req.user?.name || 'Unknown'} â€” {formatRelative(req.createdAt)}
                  </p>
                  {req.message && (
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 rounded-lg px-3 py-2 dark:bg-slate-800/50">
                      &ldquo;{req.message}&rdquo;
                    </p>
                  )}
                </div>
              </div>

              {isOwner && req.status === 'PENDING' && (
                <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                  {showResponseFor === req.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        placeholder="Optional response message..."
                        rows={2}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(req.id)}
                          disabled={processingId === req.id}
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {processingId === req.id ? 'Processing...' : 'Confirm Accept'}
                        </button>
                        <button
                          onClick={() => handleReject(req.id)}
                          disabled={processingId === req.id}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {processingId === req.id ? 'Processing...' : 'Confirm Reject'}
                        </button>
                        <button onClick={() => { setShowResponseFor(null); setResponseText(''); }} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowResponseFor(req.id); setResponseText(''); }}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => { setShowResponseFor(req.id); setResponseText(''); }}
                        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
