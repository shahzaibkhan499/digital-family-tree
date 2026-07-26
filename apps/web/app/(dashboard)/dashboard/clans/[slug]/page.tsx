'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

function getClanBanner(name: string) {
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

const TABS = ['Overview', 'SubClans', 'Families', 'Members', 'Timeline', 'Memories', 'Dashboard', 'History', 'Requests', 'Admins'] as const;
type Tab = typeof TABS[number];

export default function ClanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params.slug as string;

  const [clan, setClan] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [familySearch, setFamilySearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [userFamilies, setUserFamilies] = useState<any[]>([]);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [memories, setMemories] = useState<any[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);
  const [subclans, setSubclans] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [clanHistory, setClanHistory] = useState<any[]>([]);
  const [clanRequests, setClanRequests] = useState<any[]>([]);
  const [requestStats, setRequestStats] = useState<any>(null);
  const [activeRequestTab, setActiveRequestTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [clanAdmins, setClanAdmins] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.clans.get(slug);
        setClan(data);
        const s = await api.clans.getStats(slug).catch(() => null);
        setStats(s);
      } catch {
        router.push('/dashboard/clans');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, router]);

  useEffect(() => {
    if (showJoinModal) {
      api.families.list().then((f) => setUserFamilies(Array.isArray(f) ? f : [])).catch(() => {});
    }
  }, [showJoinModal]);

  useEffect(() => {
    if (activeTab === 'Timeline' && clan) {
      setLoadingTab(true);
      const familyIds = (clan.families || []).map((f: any) => f.id || f.familyId);
      if (familyIds.length > 0) {
        Promise.allSettled(familyIds.map((fid: string) => api.timeline.byFamily(fid, { limit: 10 })))
          .then((results) => {
            const events = results
              .filter((r) => r.status === 'fulfilled')
              .flatMap((r: any) => r.value?.events || []);
            events.sort((a: any, b: any) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
            setTimelineEvents(events.slice(0, 50));
          })
          .finally(() => setLoadingTab(false));
      } else {
        setTimelineEvents([]);
        setLoadingTab(false);
      }
    }
  }, [activeTab, clan]);

  useEffect(() => {
    if (activeTab === 'Memories' && clan) {
      setLoadingTab(true);
      const familyIds = (clan.families || []).map((f: any) => f.id || f.familyId);
      if (familyIds.length > 0) {
        Promise.allSettled(familyIds.map((fid: string) => api.memories.byFamily(fid, { limit: 10 })))
          .then((results) => {
            const items = results
              .filter((r) => r.status === 'fulfilled')
              .flatMap((r: any) => r.value?.memories || []);
            items.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setMemories(items.slice(0, 50));
          })
          .finally(() => setLoadingTab(false));
      } else {
        setMemories([]);
        setLoadingTab(false);
      }
    }
  }, [activeTab, clan]);

  useEffect(() => {
    if (activeTab === 'SubClans' && clan) {
      setLoadingTab(true);
      api.subclans.listByClan(slug, { limit: 100 })
        .then((data) => {
          setSubclans(Array.isArray(data) ? data : data?.subclans || []);
        })
        .catch(() => setSubclans([]))
        .finally(() => setLoadingTab(false));
    }
  }, [activeTab, clan, slug]);

  useEffect(() => {
    if (activeTab === 'Dashboard' && clan) {
      setLoadingTab(true);
      api.clans.dashboard(slug)
        .then((data) => setDashboardData(data))
        .catch(() => setDashboardData(null))
        .finally(() => setLoadingTab(false));
    }
  }, [activeTab, clan, slug]);

  useEffect(() => {
    if (activeTab === 'History' && clan) {
      setLoadingTab(true);
      api.clanHistory.get(clan.id || clan.slug)
        .then((data) => setClanHistory(Array.isArray(data) ? data : data?.history || []))
        .catch(() => setClanHistory([]))
        .finally(() => setLoadingTab(false));
    }
  }, [activeTab, clan]);

  useEffect(() => {
    if (activeTab === 'Requests' && clan) {
      setLoadingTab(true);
      const clanId = clan.id || clan.slug;
      Promise.allSettled([
        api.clanRequests.list(clanId),
        api.clanRequests.stats(clanId),
      ]).then(([listResult, statsResult]) => {
        if (listResult.status === 'fulfilled') {
          const data = listResult.value;
          setClanRequests(Array.isArray(data) ? data : data?.requests || []);
        }
        if (statsResult.status === 'fulfilled') {
          setRequestStats(statsResult.value);
        }
      }).finally(() => setLoadingTab(false));
    }
  }, [activeTab, clan]);

  useEffect(() => {
    if (activeTab === 'Admins' && clan) {
      setLoadingTab(true);
      api.clans.get(slug)
        .then((data) => {
          setClanAdmins(data?.admins || data?.members?.filter((m: any) => m.role === 'ADMIN' || m.role === 'OWNER') || []);
        })
        .catch(() => setClanAdmins([]))
        .finally(() => setLoadingTab(false));
    }
  }, [activeTab, clan, slug]);

  const handleJoin = async (familyId: string) => {
    if (!clan) return;
    setJoining(true);
    try {
      await api.clans.join(clan.id || clan.slug, familyId);
      const updated = await api.clans.get(slug);
      setClan(updated);
      setShowJoinModal(false);
    } catch {
      /* empty */
    } finally {
      setJoining(false);
    }
  };

  const handleLeave = async (familyId: string) => {
    if (!clan) return;
    if (!confirm('Leave this clan? Your family will be removed.')) return;
    setLeaving(true);
    try {
      await api.clans.leave(clan.id || clan.slug, familyId);
      const updated = await api.clans.get(slug);
      setClan(updated);
    } catch {
      /* empty */
    } finally {
      setLeaving(false);
    }
  };

  const filteredFamilies = useMemo(() => {
    if (!clan?.families) return [];
    if (!familySearch.trim()) return clan.families;
    const q = familySearch.toLowerCase();
    return clan.families.filter((f: any) => (f.name || '').toLowerCase().includes(q));
  }, [clan?.families, familySearch]);

  const filteredMembers = useMemo(() => {
    if (!clan?.members) return [];
    if (!memberSearch.trim()) return clan.members;
    const q = memberSearch.toLowerCase();
    return clan.members.filter((m: any) => {
      const name = `${m.firstName || ''} ${m.lastName || ''}`.toLowerCase();
      return name.includes(q);
    });
  }, [clan?.members, memberSearch]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!clan) return null;

  const initials = (clan.name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const isMember = clan.families?.some((f: any) => f.ownerId === user?.id || f.userId === user?.id);
  const isOwner = clan.ownerId === user?.id || clan.createdBy === user?.id;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative h-48 w-full" style={{ background: getClanBanner(clan.name) }}>
          {clan.bannerUrl && <img src={clan.bannerUrl} alt="" className="h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
        <div className="relative px-6 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            <div className="h-24 w-24 shrink-0 rounded-full border-4 border-white bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center text-3xl font-bold text-white shadow-lg dark:border-slate-900 overflow-hidden">
              {clan.logoUrl ? <img src={clan.logoUrl} alt="" className="h-full w-full rounded-full object-cover" /> : initials}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{clan.name}</h1>
                {clan.isVerified && <VerifiedBadge />}
                {clan.privacy === 'PRIVATE' && (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Private</span>
                )}
              </div>
              {clan.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{clan.description}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              {!isMember ? (
                <button onClick={() => setShowJoinModal(true)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-all">
                  Join Clan
                </button>
              ) : (
                <button onClick={() => {
                  const myFamily = clan.families?.find((f: any) => f.ownerId === user?.id || f.userId === user?.id);
                  if (myFamily) handleLeave(myFamily.id || myFamily.familyId);
                }} disabled={leaving} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50">
                  {leaving ? 'Leaving...' : 'Leave Clan'}
                </button>
              )}
              {isOwner && (
                <Link href={`/dashboard/clans/${slug}/edit`} className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20">
                  Edit
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 px-6 py-4 sm:grid-cols-4 dark:border-slate-800">
          {[
            { label: 'Families', value: clan._count?.families ?? clan.families?.length ?? 0 },
            { label: 'Members', value: clan._count?.members ?? clan.members?.length ?? 0 },
            { label: 'Countries', value: clan.stats?.countries ?? stats?.countries ?? 'â€”' },
            { label: 'Cities', value: clan.stats?.cities ?? stats?.cities ?? 'â€”' },
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
                ? 'border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <div className="space-y-6">
          {clan.community && (
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <Link href={`/dashboard/communities/${clan.community.slug || clan.community.id}`} className="flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg px-3 py-2 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                  {clan.community.name?.charAt(0) || 'C'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{clan.community.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Parent Community</p>
                </div>
                <svg className="ml-auto h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          )}

          {(clan.description || clan.history || clan.origin || clan.region || clan.country || clan.founder || clan.website) && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">About</h3>
              {clan.description && (
                <p className="mb-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{clan.description}</p>
              )}
              <div className="space-y-0">
                <InfoRow label="Origin" value={clan.origin} />
                <InfoRow label="Region" value={clan.region} />
                <InfoRow label="Country" value={clan.country} />
                <InfoRow label="Founder" value={clan.founder} />
                <InfoRow label="Website" value={clan.website} />
                <InfoRow label="Privacy" value={clan.privacy} />
              </div>
              {clan.history && (
                <div className="mt-4">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">History</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{clan.history}</p>
                </div>
              )}
            </div>
          )}

          {stats && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Statistics</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {Object.entries(stats).filter(([k]) => !['id', 'clanId', 'clan'].includes(k)).map(([key, value]) => (
                  <div key={key} className="rounded-lg bg-slate-50 px-3 py-3 dark:bg-slate-800/50">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{typeof value === 'number' ? value : String(value ?? 'â€”')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {clan.families && clan.families.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Recent Families</h3>
              <div className="space-y-2">
                {clan.families.slice(0, 5).map((f: any) => (
                  <Link key={f.id || f.familyId} href={`/dashboard/families/${f.id || f.familyId}`} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {f.name?.charAt(0) || 'F'}
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{f.name}</span>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{f._count?.members ?? f.memberCount ?? 0} members</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {clan.members && clan.members.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Recent Members</h3>
              <div className="space-y-2">
                {clan.members.slice(0, 10).map((m: any) => (
                  <div key={m.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {m.firstName?.charAt(0)}{m.lastName?.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{m.firstName} {m.lastName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Families' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={familySearch}
              onChange={(e) => setFamilySearch(e.target.value)}
              placeholder="Search families..."
              className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <span className="text-sm text-slate-400 dark:text-slate-500">{filteredFamilies.length} families</span>
          </div>
          {filteredFamilies.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-400 dark:text-slate-500 italic">No families in this clan yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredFamilies.map((f: any) => (
                <Link key={f.id || f.familyId} href={`/dashboard/families/${f.id || f.familyId}`} className="block rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {f.name?.charAt(0) || 'F'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white truncate">{f.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{f._count?.members ?? f.memberCount ?? 0} members</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Members' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search members..."
              className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <span className="text-sm text-slate-400 dark:text-slate-500">{filteredMembers.length} members</span>
          </div>
          {filteredMembers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-400 dark:text-slate-500 italic">No members found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMembers.map((m: any) => (
                <div key={m.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {m.firstName?.charAt(0)}{m.lastName?.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{m.firstName} {m.lastName}</p>
                    {m.familyName && <p className="text-xs text-slate-400 dark:text-slate-500">{m.familyName}</p>}
                  </div>
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
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
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
                    <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shrink-0 z-10 dark:bg-emerald-900/30 dark:text-emerald-400">
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

      {activeTab === 'Memories' && (
        <div className="space-y-4">
          {loadingTab ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            </div>
          ) : memories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-400 dark:text-slate-500 italic">No memories yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {memories.map((mem: any) => (
                <div key={mem.id} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                  {mem.imageUrl && <img src={mem.imageUrl} alt="" className="mb-3 h-32 w-full rounded-lg object-cover" />}
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{mem.title || 'Memory'}</p>
                  {mem.content && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-3">{mem.content}</p>}
                  <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">{formatRelative(mem.createdAt)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'SubClans' && (
        <div className="space-y-4">
          {loadingTab ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            </div>
          ) : (
            <>
              {isOwner && (
                <div className="flex justify-end">
                  <Link href={`/dashboard/clans/${slug}/subclans/new`} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                    + Create SubClan
                  </Link>
                </div>
              )}
              {subclans.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-sm text-slate-400 dark:text-slate-500 italic">No subclans in this clan yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {subclans.map((sc: any) => (
                    <Link key={sc.id || sc.slug} href={`/dashboard/subclans/${sc.slug || sc.id}`} className="block rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                          {sc.name?.charAt(0) || 'S'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">{sc.name}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">{sc._count?.families ?? sc.familyCount ?? 0} families</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'Dashboard' && (
        <div className="space-y-6">
          {loadingTab ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            </div>
          ) : !dashboardData ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-400 dark:text-slate-500 italic">No dashboard data available.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  { label: 'Families', value: dashboardData.totalFamilies ?? 0 },
                  { label: 'Members', value: dashboardData.totalMembers ?? 0 },
                  { label: 'Events', value: dashboardData.totalEvents ?? 0 },
                  { label: 'Photos', value: dashboardData.totalPhotos ?? 0 },
                  { label: 'Documents', value: dashboardData.totalDocuments ?? 0 },
                  { label: 'Timeline', value: dashboardData.totalTimelineEvents ?? 0 },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{item.value}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
                  </div>
                ))}
              </div>

              {dashboardData.yearsActive != null && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">Years Active</h3>
                  <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">{dashboardData.yearsActive} years</p>
                </div>
              )}

              {dashboardData.mostActiveFamilies?.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Most Active Families</h3>
                  <div className="space-y-2">
                    {dashboardData.mostActiveFamilies.slice(0, 5).map((f: any, i: number) => (
                      <Link key={f.id || i} href={`/dashboard/families/${f.id || f.familyId}`} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{i + 1}</span>
                          <span className="text-sm font-medium text-slate-900 dark:text-white">{f.name}</span>
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{f.memberCount ?? f._count?.members ?? 0} members</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {dashboardData.newestFamilies?.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Newest Families</h3>
                  <div className="space-y-2">
                    {dashboardData.newestFamilies.slice(0, 5).map((f: any) => (
                      <Link key={f.id || f.familyId} href={`/dashboard/families/${f.id || f.familyId}`} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{f.name}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{formatRelative(f.createdAt)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {dashboardData.oldestFamilies?.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Oldest Families</h3>
                  <div className="space-y-2">
                    {dashboardData.oldestFamilies.slice(0, 5).map((f: any) => (
                      <Link key={f.id || f.familyId} href={`/dashboard/families/${f.id || f.familyId}`} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{f.name}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">{formatRelative(f.createdAt)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {dashboardData.pendingRequests != null && dashboardData.pendingRequests > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-900/10">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                    <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">{dashboardData.pendingRequests} pending join request(s)</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'History' && (
        <div className="space-y-4">
          {loadingTab ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            </div>
          ) : clanHistory.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-400 dark:text-slate-500 italic">No history content yet.</p>
              {isOwner && (
                <Link href={`/dashboard/clans/${slug}/history`} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                  Add History
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {clanHistory.map((item: any) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
                  <h4 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white capitalize">{item.section || 'General'}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                  {item.updatedAt && (
                    <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">Updated {formatRelative(item.updatedAt)}</p>
                  )}
                </div>
              ))}
              {isOwner && (
                <Link href={`/dashboard/clans/${slug}/history`} className="block rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center text-sm font-medium text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800">
                  View Full History
                </Link>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Requests' && (
        <div className="space-y-4">
          {loadingTab ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            </div>
          ) : (
            <>
              {requestStats && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-2xl font-bold text-amber-600">{requestStats.pending ?? 0}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Pending</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-2xl font-bold text-emerald-600">{requestStats.approved ?? 0}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Approved</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{requestStats.total ?? 0}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total</p>
                  </div>
                </div>
              )}

              <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
                {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveRequestTab(tab)}
                    className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors capitalize ${
                      activeRequestTab === tab
                        ? 'border-b-2 border-emerald-600 text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {(() => {
                const filtered = activeRequestTab === 'all'
                  ? clanRequests
                  : clanRequests.filter((r: any) => r.status?.toLowerCase() === activeRequestTab);
                if (filtered.length === 0) {
                  return (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
                      <p className="text-sm text-slate-400 dark:text-slate-500 italic">No {activeRequestTab} requests.</p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-3">
                    {filtered.map((req: any) => (
                      <div key={req.id} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{req.familyName || req.family?.name || 'Unknown Family'}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">Requested by {req.requesterName || req.user?.name || 'Unknown'}</p>
                          </div>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            req.status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              : req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>{req.status}</span>
                        </div>
                        {req.message && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{req.message}</p>}
                        <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">{formatRelative(req.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}

      {activeTab === 'Admins' && (
        <div className="space-y-4">
          {loadingTab ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            </div>
          ) : (
            <>
              {clanAdmins.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-sm text-slate-400 dark:text-slate-500 italic">No admins found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {clanAdmins.map((admin: any) => (
                    <div key={admin.id || admin.userId} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {admin.firstName?.charAt(0) || admin.name?.charAt(0) || 'A'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{admin.firstName ? `${admin.firstName} ${admin.lastName || ''}` : admin.name || admin.email}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">{admin.role || 'Admin'}</p>
                        </div>
                      </div>
                      {isOwner && admin.role !== 'OWNER' && (
                        <button className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20">
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Join Clan</h3>
              <button onClick={() => setShowJoinModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Select a family to join this clan with:</p>
            {userFamilies.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-slate-400 dark:text-slate-500">You don&apos;t have any families yet.</p>
                <Link href="/dashboard/families/new" onClick={() => setShowJoinModal(false)} className="mt-2 inline-block text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                  Create a Family
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {userFamilies.map((f: any) => (
                  <button
                    key={f.id}
                    onClick={() => handleJoin(f.id)}
                    disabled={joining}
                    className="w-full text-left rounded-lg border border-slate-200 px-4 py-3 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{f.name}</span>
                      <span className="text-xs text-slate-400">{f._count?.members ?? 0} members</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
