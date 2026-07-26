'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

function getBanner(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const h1 = Math.abs(hash) % 360;
  const h2 = (h1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${h1}, 50%, 40%), hsl(${h2}, 55%, 55%))`;
}

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
      Verified
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-slate-400 dark:text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}

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

const TABS = ['Overview', 'Clans', 'Admins', 'Requests', 'Timeline', 'History'] as const;
type Tab = typeof TABS[number];

export default function CommunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params.slug as string;

  const [community, setCommunity] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [clanSearch, setClanSearch] = useState('');
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [adminSearchEmail, setAdminSearchEmail] = useState('');
  const [adminSearchResults, setAdminSearchResults] = useState<any[]>([]);
  const [adminSearching, setAdminSearching] = useState(false);
  const [addingAdminId, setAddingAdminId] = useState<string | null>(null);
  const [removingAdminId, setRemovingAdminId] = useState<string | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [requestStats, setRequestStats] = useState<any>(null);
  const [requestTab, setRequestTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.communities.get(slug);
        setCommunity(data);
        const s = await api.communities.getStats(slug).catch(() => null);
        setStats(s);
      } catch {
        router.push('/dashboard/communities');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, router]);

  useEffect(() => {
    if (activeTab === 'Timeline' && community) {
      setLoadingTab(true);
      const clanIds = (community.clans || []).map((c: any) => c.id || c.slug);
      if (clanIds.length > 0) {
        Promise.allSettled(clanIds.map((cid: string) => api.clans.get(cid)))
          .then((results) => {
            const allFamilies = results
              .filter((r) => r.status === 'fulfilled')
              .flatMap((r: any) => r.value?.families || []);
            const familyIds = allFamilies.map((f: any) => f.id || f.familyId);
            if (familyIds.length > 0) {
              return Promise.allSettled(familyIds.slice(0, 10).map((fid: string) => api.timeline.byFamily(fid, { limit: 10 })));
            }
            return [];
          })
          .then((results) => {
            if (Array.isArray(results)) {
              const events = results
                .filter((r) => r.status === 'fulfilled')
                .flatMap((r: any) => r.value?.events || []);
              events.sort((a: any, b: any) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
              setTimelineEvents(events.slice(0, 50));
            }
          })
          .finally(() => setLoadingTab(false));
      } else {
        setTimelineEvents([]);
        setLoadingTab(false);
      }
    }
  }, [activeTab, community]);

  useEffect(() => {
    if (activeTab === 'History' && community) {
      setLoadingTab(true);
      api.communities.getStats(slug)
        .then((data) => {
          setHistory(data?.history || []);
        })
        .catch(() => setHistory([]))
        .finally(() => setLoadingTab(false));
    }
  }, [activeTab, community, slug]);

  useEffect(() => {
    if (activeTab === 'Admins' && community) {
      setLoadingTab(true);
      api.communities.getAdmins(community.id || slug)
        .then((data) => setAdmins(Array.isArray(data) ? data : data?.admins || []))
        .catch(() => setAdmins([]))
        .finally(() => setLoadingTab(false));
    }
  }, [activeTab, community, slug]);

  useEffect(() => {
    if (activeTab === 'Requests' && community) {
      setLoadingTab(true);
      const cid = community.id || slug;
      Promise.allSettled([
        api.communities.getRequests(cid),
        api.communities.getRequestStats(cid),
      ]).then(([reqResult, statsResult]) => {
        if (reqResult.status === 'fulfilled') {
          const data = reqResult.value;
          setRequests(Array.isArray(data) ? data : data?.requests || []);
        }
        if (statsResult.status === 'fulfilled') setRequestStats(statsResult.value);
      }).catch(() => {
        setRequests([]);
      }).finally(() => setLoadingTab(false));
    }
  }, [activeTab, community, slug]);

  const filteredClans = useMemo(() => {
    if (!community?.clans) return [];
    if (!clanSearch.trim()) return community.clans;
    const q = clanSearch.toLowerCase();
    return community.clans.filter((c: any) => (c.name || '').toLowerCase().includes(q));
  }, [community?.clans, clanSearch]);

  const filteredRequests = useMemo(() => {
    if (requestTab === 'all') return requests;
    return requests.filter((r: any) => r.status?.toLowerCase() === requestTab);
  }, [requests, requestTab]);

  const handleSearchAdminUser = async () => {
    if (!adminSearchEmail.trim()) { setAdminSearchResults([]); return; }
    setAdminSearching(true);
    try {
      const data = await api.search.global(adminSearchEmail.trim(), { limit: 10, type: 'user' });
      setAdminSearchResults(data?.users || []);
    } catch { setAdminSearchResults([]); } finally { setAdminSearching(false); }
  };

  const handleAddAdmin = async (userId: string) => {
    setAddingAdminId(userId);
    try {
      await api.communities.addAdmin(community.id || slug, { userId });
      const data = await api.communities.getAdmins(community.id || slug);
      setAdmins(Array.isArray(data) ? data : data?.admins || []);
      setShowAddAdmin(false);
      setAdminSearchEmail('');
      setAdminSearchResults([]);
    } catch { /* empty */ } finally { setAddingAdminId(null); }
  };

  const handleRemoveAdmin = async (adminId: string) => {
    if (!confirm('Remove this admin?')) return;
    setRemovingAdminId(adminId);
    try {
      await api.communities.removeAdmin(community.id || slug, adminId);
      const data = await api.communities.getAdmins(community.id || slug);
      setAdmins(Array.isArray(data) ? data : data?.admins || []);
    } catch { /* empty */ } finally { setRemovingAdminId(null); }
  };

  const handleApproveRequest = async (requestId: string) => {
    setProcessingRequestId(requestId);
    try {
      await api.communities.approveRequest(community.id || slug, requestId);
      const [reqResult, statsResult] = await Promise.allSettled([
        api.communities.getRequests(community.id || slug),
        api.communities.getRequestStats(community.id || slug),
      ]);
      if (reqResult.status === 'fulfilled') {
        const data = reqResult.value;
        setRequests(Array.isArray(data) ? data : data?.requests || []);
      }
      if (statsResult.status === 'fulfilled') setRequestStats(statsResult.value);
    } catch { /* empty */ } finally { setProcessingRequestId(null); }
  };

  const handleRejectRequest = async (requestId: string) => {
    setProcessingRequestId(requestId);
    try {
      await api.communities.rejectRequest(community.id || slug, requestId);
      const [reqResult, statsResult] = await Promise.allSettled([
        api.communities.getRequests(community.id || slug),
        api.communities.getRequestStats(community.id || slug),
      ]);
      if (reqResult.status === 'fulfilled') {
        const data = reqResult.value;
        setRequests(Array.isArray(data) ? data : data?.requests || []);
      }
      if (statsResult.status === 'fulfilled') setRequestStats(statsResult.value);
    } catch { /* empty */ } finally { setProcessingRequestId(null); }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!community) return null;

  const initials = (community.name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const isOwner = community.ownerId === user?.id || community.createdBy === user?.id;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative h-48 w-full" style={{ background: getBanner(community.name) }}>
          {community.bannerUrl && <img src={community.bannerUrl} alt="" className="h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
        <div className="relative px-6 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            <div className="h-24 w-24 shrink-0 rounded-full border-4 border-white bg-gradient-to-br from-indigo-600 to-purple-800 flex items-center justify-center text-3xl font-bold text-white shadow-lg dark:border-slate-900 overflow-hidden">
              {community.logoUrl ? <img src={community.logoUrl} alt="" className="h-full w-full rounded-full object-cover" /> : initials}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{community.name}</h1>
                {community.isVerified && <VerifiedBadge />}
              </div>
              {community.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{community.description}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              {isOwner && (
                <Link href={`/dashboard/communities/${slug}/edit`} className="rounded-lg border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/20">
                  Edit
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 px-6 py-4 sm:grid-cols-4 dark:border-slate-800">
          {[
            { label: 'Clans', value: community._count?.clans ?? community.clans?.length ?? 0 },
            { label: 'Families', value: community._count?.families ?? stats?.totalFamilies ?? 0 },
            { label: 'Members', value: community._count?.members ?? stats?.totalMembers ?? 0 },
            { label: 'Countries', value: community.stats?.countries ?? stats?.countries ?? 'â€”' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-lg font-bold text-slate-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <div className="space-y-6">
          {(community.description || community.origin || community.region || community.country || community.website || community.motto || community.symbol) && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">About</h3>
              {community.description && (
                <p className="mb-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{community.description}</p>
              )}
              <div className="space-y-0">
                <InfoRow label="Origin" value={community.origin} />
                <InfoRow label="Region" value={community.region} />
                <InfoRow label="Country" value={community.country} />
                <InfoRow label="Website" value={community.website} />
                <InfoRow label="Motto" value={community.motto} />
                <InfoRow label="Symbol" value={community.symbol} />
                <InfoRow label="Founded Date" value={community.foundedDate ? new Date(community.foundedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null} />
                <InfoRow label="Population" value={community.population ? String(community.population) : null} />
                <InfoRow label="Contact" value={community.contact} />
              </div>
              {community.languages && community.languages.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Languages</p>
                  <div className="flex flex-wrap gap-1.5">
                    {community.languages.map((lang: string, i: number) => (
                      <span key={i} className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{lang}</span>
                    ))}
                  </div>
                </div>
              )}
              {community.countries && community.countries.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-2">Countries</p>
                  <div className="flex flex-wrap gap-1.5">
                    {community.countries.map((c: string, i: number) => (
                      <span key={i} className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{c}</span>
                    ))}
                  </div>
                </div>
              )}
              {community.seoMetadata && typeof community.seoMetadata === 'object' && (
                <div className="mt-4">
                  <InfoRow label="SEO Title" value={community.seoMetadata.title} />
                  <InfoRow label="SEO Description" value={community.seoMetadata.description} />
                </div>
              )}
            </div>
          )}

          {stats && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Statistics</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {Object.entries(stats).filter(([k]) => !['id', 'communityId', 'community', 'history'].includes(k)).map(([key, value]) => (
                  <div key={key} className="rounded-lg bg-slate-50 px-3 py-3 dark:bg-slate-800/50">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{typeof value === 'number' ? value : String(value ?? 'â€”')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {community.clans && community.clans.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Recent Clans</h3>
              <div className="space-y-2">
                {community.clans.slice(0, 5).map((c: any) => (
                  <Link key={c.id || c.slug} href={`/dashboard/clans/${c.slug || c.id}`} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                        {c.name?.charAt(0) || 'C'}
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{c.name}</span>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{c._count?.families ?? c.familyCount ?? 0} families</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Clans' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={clanSearch}
              onChange={(e) => setClanSearch(e.target.value)}
              placeholder="Search clans..."
              className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <span className="text-sm text-slate-400 dark:text-slate-500">{filteredClans.length} clans</span>
          </div>
          {filteredClans.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-400 dark:text-slate-500 italic">No clans in this community yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredClans.map((c: any) => (
                <Link key={c.id || c.slug} href={`/dashboard/clans/${c.slug || c.id}`} className="block rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                      {c.name?.charAt(0) || 'C'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">{c.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{c._count?.families ?? c.familyCount ?? 0} families &middot; {c._count?.members ?? c.memberCount ?? 0} members</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Admins' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">{admins.length} admin{admins.length !== 1 ? 's' : ''}</p>
            {isOwner && (
              <button onClick={() => setShowAddAdmin(true)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
                + Add Admin
              </button>
            )}
          </div>
          {loadingTab ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            </div>
          ) : admins.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-400 dark:text-slate-500 italic">No admins yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {admins.map((admin: any) => {
                const adminId = admin.userId || admin.id;
                const adminUser = admin.user || admin;
                const name = adminUser.firstName ? `${adminUser.firstName} ${adminUser.lastName || ''}` : adminUser.name || adminUser.email;
                const isCurrentUserOwner = admin.role === 'OWNER';

                return (
                  <div key={adminId} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {adminUser.firstName?.charAt(0) || adminUser.name?.charAt(0) || 'A'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{name}</p>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            isCurrentUserOwner
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                          }`}>{admin.role || 'Admin'}</span>
                          {adminUser.email && <span className="text-[11px] text-slate-400 dark:text-slate-500">{adminUser.email}</span>}
                        </div>
                      </div>
                    </div>
                    {isOwner && !isCurrentUserOwner && (
                      <button
                        onClick={() => handleRemoveAdmin(adminId)}
                        disabled={removingAdminId === adminId}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50"
                      >
                        {removingAdminId === adminId ? 'Removing...' : 'Remove'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {showAddAdmin && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Add Admin</h3>
                  <button onClick={() => { setShowAddAdmin(false); setAdminSearchEmail(''); setAdminSearchResults([]); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={adminSearchEmail}
                    onChange={(e) => setAdminSearchEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchAdminUser()}
                    placeholder="Search by email..."
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <button onClick={handleSearchAdminUser} disabled={adminSearching} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                    {adminSearching ? '...' : 'Search'}
                  </button>
                </div>
                <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                  {adminSearchResults.map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-700">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{u.name || u.displayName}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{u.email}</p>
                      </div>
                      <button
                        onClick={() => handleAddAdmin(u.id)}
                        disabled={addingAdminId === u.id}
                        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {addingAdminId === u.id ? '...' : 'Add'}
                      </button>
                    </div>
                  ))}
                  {adminSearchEmail && !adminSearching && adminSearchResults.length === 0 && (
                    <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-4">No users found.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Requests' && (
        <div className="space-y-4">
          {requestStats && (
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
                <p className="text-2xl font-bold text-amber-600">{requestStats.pending ?? 0}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pending</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
                <p className="text-2xl font-bold text-emerald-600">{requestStats.approved ?? 0}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Approved</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{requestStats.total ?? 0}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total</p>
              </div>
            </div>
          )}

          <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
            {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRequestTab(tab)}
                className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors capitalize ${
                  requestTab === tab
                    ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {loadingTab ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-400 dark:text-slate-500 italic">No {requestTab} requests.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((req: any) => (
                <div key={req.id} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{req.familyName || req.family?.name || req.name || 'Unknown'}</p>
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
                    <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800 flex gap-2">
                      <button
                        onClick={() => handleApproveRequest(req.id)}
                        disabled={processingRequestId === req.id}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {processingRequestId === req.id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req.id)}
                        disabled={processingRequestId === req.id}
                        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50"
                      >
                        {processingRequestId === req.id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Link href={`/dashboard/communities/${slug}/requests`} className="rounded-lg border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/20">
              Manage Requests
            </Link>
          </div>
          {requestStats && (
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
                <p className="text-2xl font-bold text-amber-600">{requestStats.pending ?? 0}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Pending</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
                <p className="text-2xl font-bold text-emerald-600">{requestStats.approved ?? 0}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Approved</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{requestStats.total ?? 0}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total</p>
              </div>
            </div>
          )}
          <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
            {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setRequestTab(tab)}
                className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors capitalize ${
                  requestTab === tab
                    ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {loadingTab ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-400 dark:text-slate-500 italic">No {requestTab} requests.</p>
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
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveRequest(req.id)}
                          disabled={processingRequestId === req.id}
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {processingRequestId === req.id ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          disabled={processingRequestId === req.id}
                          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50"
                        >
                          {processingRequestId === req.id ? 'Processing...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Timeline' && (
        <div className="space-y-4">
          {loadingTab ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            </div>
          ) : timelineEvents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-400 dark:text-slate-500 italic">No timeline events yet.</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-[15px] top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="space-y-4">
                {timelineEvents.map((ev: any) => (
                  <div key={ev.id} className="flex gap-3 relative">
                    <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-indigo-100 text-indigo-600 shrink-0 z-10 dark:bg-indigo-900/30 dark:text-indigo-400">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div className="min-w-0 pt-1">
                      <p className="text-sm text-slate-700 dark:text-slate-300">{ev.title}{ev.entityName ? <span className="font-medium"> {ev.entityName}</span> : null}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{formatRelative(ev.date || ev.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'History' && (
        <div className="space-y-4">
          {loadingTab ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-400 dark:text-slate-500 italic">No history content yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item: any) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                  <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white capitalize">{item.section || 'General'}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                  {item.updatedAt && (
                    <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">Updated {formatRelative(item.updatedAt)}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
