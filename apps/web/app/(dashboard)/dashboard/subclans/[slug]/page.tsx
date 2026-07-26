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

const TABS = ['Overview', 'Sub-Clans', 'Families', 'Members', 'Timeline'] as const;
type Tab = typeof TABS[number];

export default function SubClanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params.slug as string;

  const [subclan, setSubclan] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [familySearch, setFamilySearch] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<any[]>([]);
  const [childSubclans, setChildSubclans] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.subclans.get(slug);
        setSubclan(data);
        const s = await api.subclans.getStats(slug).catch(() => null);
        setStats(s);
        if (data?.id) {
          api.subclans.getBreadcrumbs(data.id).then((b: any) => setBreadcrumbs(Array.isArray(b) ? b : b?.breadcrumbs || [])).catch(() => {});
          api.subclans.getTree(data.id).then((tree: any) => {
            const children = tree?.children || tree?.subclans || [];
            setChildSubclans(Array.isArray(children) ? children : []);
          }).catch(() => {});
        }
      } catch {
        router.push('/dashboard/clans');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, router]);

  useEffect(() => {
    if (activeTab === 'Timeline' && subclan) {
      setLoadingTab(true);
      const familyIds = (subclan.families || []).map((f: any) => f.id || f.familyId);
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
  }, [activeTab, subclan]);

  useEffect(() => {
    if (activeTab === 'Sub-Clans' && subclan) {
      setLoadingTab(true);
      const treeId = subclan.id || subclan.subclanId;
      if (treeId) {
        api.subclans.getTree(treeId)
          .then((data: any) => {
            const children = data?.children || data?.subclans || [];
            setChildSubclans(Array.isArray(children) ? children : []);
          })
          .catch(() => setChildSubclans([]))
          .finally(() => setLoadingTab(false));
      } else {
        setChildSubclans([]);
        setLoadingTab(false);
      }
    }
  }, [activeTab, subclan]);

  const filteredFamilies = useMemo(() => {
    if (!subclan?.families) return [];
    if (!familySearch.trim()) return subclan.families;
    const q = familySearch.toLowerCase();
    return subclan.families.filter((f: any) => (f.name || '').toLowerCase().includes(q));
  }, [subclan?.families, familySearch]);

  const filteredMembers = useMemo(() => {
    if (!subclan?.members) return [];
    if (!memberSearch.trim()) return subclan.members;
    const q = memberSearch.toLowerCase();
    return subclan.members.filter((m: any) => {
      const name = `${m.firstName || ''} ${m.lastName || ''}`.toLowerCase();
      return name.includes(q);
    });
  }, [subclan?.members, memberSearch]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!subclan) return null;

  const initials = (subclan.name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const isOwner = subclan.ownerId === user?.id || subclan.createdBy === user?.id;

  return (
    <div className="space-y-6">
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 overflow-x-auto">
          {breadcrumbs.map((crumb: any, i: number) => (
            <span key={crumb.id} className="flex items-center gap-1 shrink-0">
              {i > 0 && <span className="text-slate-300 dark:text-slate-600">/</span>}
              {crumb.type === 'clan' ? (
                <Link href={`/dashboard/clans/${crumb.slug || crumb.id}`} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  {crumb.name}
                </Link>
              ) : i === breadcrumbs.length - 1 ? (
                <span className="font-medium text-slate-900 dark:text-white">{crumb.name}</span>
              ) : (
                <Link href={`/dashboard/subclans/${crumb.slug || crumb.id}`} className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                  {crumb.name}
                </Link>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative h-48 w-full" style={{ background: getBanner(subclan.name) }}>
          {subclan.bannerUrl && <img src={subclan.bannerUrl} alt="" className="h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        </div>
        <div className="relative px-6 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            <div className="h-24 w-24 shrink-0 rounded-full border-4 border-white bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-3xl font-bold text-white shadow-lg dark:border-slate-900 overflow-hidden">
              {subclan.logoUrl ? <img src={subclan.logoUrl} alt="" className="h-full w-full rounded-full object-cover" /> : initials}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{subclan.name}</h1>
              </div>
              {subclan.parentClan && (
                <Link href={`/dashboard/clans/${subclan.parentClan.slug || subclan.parentClan.id}`} className="mt-1 inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                  {subclan.parentClan.name}
                </Link>
              )}
              {subclan.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{subclan.description}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              {user && subclan.status !== 'INACTIVE' && (
                <Link
                  href={`/dashboard/subclans/new?clanId=${subclan.parentClan?.id || subclan.clanId || ''}&parentSubClanId=${subclan.id || subclan.subclanId || ''}`}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                >
                  Create Sub-SubClan
                </Link>
              )}
              {isOwner && (
                <Link href={`/dashboard/subclans/${slug}/edit`} className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20">
                  Edit
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-slate-100 px-6 py-4 sm:grid-cols-3 dark:border-slate-800">
          {[
            { label: 'Families', value: subclan._count?.families ?? subclan.families?.length ?? 0 },
            { label: 'Members', value: subclan._count?.members ?? subclan.members?.length ?? 0 },
            { label: 'Events', value: stats?.totalEvents ?? 'â€”' },
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

      {activeTab === 'Sub-Clans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400 dark:text-slate-500">{childSubclans.length} sub-clans</span>
            {user && subclan.status !== 'INACTIVE' && (
              <Link
                href={`/dashboard/subclans/new?clanId=${subclan.parentClan?.id || subclan.clanId || ''}&parentSubClanId=${subclan.id || subclan.subclanId || ''}`}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                + New Sub-Clan
              </Link>
            )}
          </div>
          {loadingTab ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            </div>
          ) : childSubclans.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-400 dark:text-slate-500 italic">No sub-clans nested under this one yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {childSubclans.map((child: any) => {
                const childSlug = child.slug || child.id;
                const childInitials = (child.name || '?').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <Link key={child.id} href={`/dashboard/subclans/${childSlug}`} className="block rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {childInitials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{child.name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{child._count?.families ?? child.families?.length ?? 0} families &middot; {child._count?.members ?? child.members?.length ?? 0} members</p>
                      </div>
                    </div>
                    {child.description && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{child.description}</p>}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Overview' && (
        <div className="space-y-6">
          {(subclan.description || subclan.origin || subclan.region) && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">About</h3>
              {subclan.description && (
                <p className="mb-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{subclan.description}</p>
              )}
              <div className="space-y-0">
                <InfoRow label="Origin" value={subclan.origin} />
                <InfoRow label="Region" value={subclan.region} />
                <InfoRow label="Country" value={subclan.country} />
              </div>
            </div>
          )}

          {stats && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Statistics</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {Object.entries(stats).filter(([k]) => !['id', 'subclanId', 'subclan'].includes(k)).map(([key, value]) => (
                  <div key={key} className="rounded-lg bg-slate-50 px-3 py-3 dark:bg-slate-800/50">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{typeof value === 'number' ? value : String(value ?? 'â€”')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {childSubclans.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Sub-Clans</h3>
                <Link href="#" onClick={(e) => { e.preventDefault(); setActiveTab('Sub-Clans'); }} className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">View all</Link>
              </div>
              <div className="space-y-2">
                {childSubclans.slice(0, 5).map((child: any) => (
                  <Link key={child.id} href={`/dashboard/subclans/${child.slug || child.id}`} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {child.name?.charAt(0) || 'S'}
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{child.name}</span>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500">{child._count?.families ?? child.families?.length ?? 0} families</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {subclan.families && subclan.families.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Recent Families</h3>
              <div className="space-y-2">
                {subclan.families.slice(0, 5).map((f: any) => (
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
              <p className="text-sm text-slate-400 dark:text-slate-500 italic">No families in this subclan yet.</p>
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
    </div>
  );
}
