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

export default function CommunityRequestsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params.slug as string;

  const [community, setCommunity] = useState<any>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [communityData, listResult, statsResult] = await Promise.allSettled([
        api.communities.get(slug),
        api.communities.getRequests(slug),
        api.communities.getRequestStats(slug),
      ]);
      if (communityData.status === 'fulfilled') setCommunity(communityData.value);
      else router.push('/dashboard/communities');
      if (listResult.status === 'fulfilled') {
        const data = listResult.value;
        setRequests(Array.isArray(data) ? data : data?.requests || []);
      }
      if (statsResult.status === 'fulfilled') setStats(statsResult.value);
    } catch {
      router.push('/dashboard/communities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [slug, router]);

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await api.communities.approveRequest(slug, requestId);
      await loadData();
    } catch {
      /* empty */
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await api.communities.rejectRequest(slug, requestId);
      await loadData();
    } catch {
      /* empty */
    } finally {
      setProcessingId(null);
    }
  };

  const handleCancel = async (requestId: string) => {
    setProcessingId(requestId);
    try {
      await api.communities.deleteRequest(slug, requestId);
      await loadData();
    } catch {
      /* empty */
    } finally {
      setProcessingId(null);
    }
  };

  const isOwner = community?.ownerId === user?.id || community?.createdBy === user?.id;

  const filteredRequests = activeTab === 'all'
    ? requests
    : requests.filter((r: any) => r.status?.toLowerCase() === activeTab);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!community) return null;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/dashboard/communities/${slug}`} className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
          â† Back to {community.name}
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
                ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
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
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Family</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Requester</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Date</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRequests.map((req: any) => (
                <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-5 py-3.5 text-sm font-medium text-slate-900 dark:text-white">
                    {req.familyName || req.family?.name || 'Unknown Family'}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400">
                    {req.requesterName || req.user?.name || 'Unknown'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      req.status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>{req.status}</span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-400 dark:text-slate-500">
                    {formatRelative(req.createdAt)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isOwner && req.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApprove(req.id)}
                            disabled={processingId === req.id}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {processingId === req.id ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            disabled={processingId === req.id}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50"
                          >
                            {processingId === req.id ? '...' : 'Reject'}
                          </button>
                        </>
                      )}
                      {!isOwner && req.status === 'PENDING' && req.userId === user?.id && (
                        <button
                          onClick={() => handleCancel(req.id)}
                          disabled={processingId === req.id}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 disabled:opacity-50"
                        >
                          {processingId === req.id ? '...' : 'Cancel'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
