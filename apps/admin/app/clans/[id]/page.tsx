'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/lib/admin-api';
import { api } from '@/lib/api-client';

interface ClanOwner {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface ClanCommunity {
  id: string;
  name: string;
  slug: string;
}

interface ClanAdmin {
  id: string;
  name: string;
  email: string;
}

interface JoinRequest {
  id: string;
  userId: string;
  userName: string;
  status: string;
  createdAt: string;
}

interface ClanSubClan {
  id: string;
  name: string;
  _count?: { families: number; members: number };
}

interface Clan {
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
  owner: ClanOwner | null;
  community: ClanCommunity | null;
  admins: ClanAdmin[];
  joinRequests: JoinRequest[];
  subClans: ClanSubClan[];
  _count: { families: number; members: number; subClans: number };
  createdAt: string;
  updatedAt: string;
}

interface GalleryItem {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  type?: string;
  createdAt: string;
}

interface DirectoryMember {
  id: string;
  userId: string;
  userName: string;
  role: string;
  joinedAt: string;
}

interface DirectoryStats {
  totalMembers: number;
  roles: Record<string, number>;
}

interface ClanEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  location?: string;
  type?: string;
  status: string;
}

interface EventStats {
  total: number;
  upcoming: number;
  past: number;
}

interface DocumentItem {
  id: string;
  title: string;
  description?: string;
  fileUrl?: string;
  type?: string;
  createdAt: string;
}

interface ClanLocation {
  id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  type?: string;
}

interface ReputationScore {
  trust: number;
  heritage: number;
  contribution: number;
  totalScore: number;
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  INACTIVE: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  SUSPENDED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  ARCHIVED: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
};

const STATUS_OPTIONS = ['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED', 'ARCHIVED'];

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  ADMIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  MODERATOR: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  MEMBER: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

const EVENT_STATUS_COLORS: Record<string, string> = {
  UPCOMING: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  ONGOING: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  COMPLETED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

type Tab = 'overview' | 'gallery' | 'members' | 'events' | 'documents' | 'locations' | 'reputation';

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function TabButton({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count?: number }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs">{count}</span>
      )}
    </button>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-8 text-center shadow-sm">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function ScoreBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function ClanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [clan, setClan] = useState<Clan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  const [members, setMembers] = useState<DirectoryMember[]>([]);
  const [memberStats, setMemberStats] = useState<DirectoryStats | null>(null);
  const [membersLoading, setMembersLoading] = useState(false);

  const [events, setEvents] = useState<ClanEvent[]>([]);
  const [eventStats, setEventStats] = useState<EventStats | null>(null);
  const [eventsLoading, setEventsLoading] = useState(false);

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);

  const [locations, setLocations] = useState<ClanLocation[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);

  const [reputation, setReputation] = useState<ReputationScore | null>(null);
  const [repLoading, setRepLoading] = useState(false);

  const fetchClan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminFetch<Clan>(`/clans/${id}`);
      setClan(data);
    } catch {
      setError('Failed to load clan details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchClan(); }, [fetchClan]);

  useEffect(() => {
    if (!clan) return;
    const cid = clan.id;

    if (activeTab === 'gallery' && galleryItems.length === 0 && !galleryLoading) {
      setGalleryLoading(true);
      api.clanGallery.listByClan(cid).then((d: any) => setGalleryItems(d?.items ?? d ?? [])).catch(() => {}).finally(() => setGalleryLoading(false));
    }

    if (activeTab === 'members' && members.length === 0 && !membersLoading) {
      setMembersLoading(true);
      Promise.all([api.clanDirectory.list(cid), api.clanDirectory.stats(cid)])
        .then(([list, stats]: [any, any]) => {
          setMembers(list?.items ?? list ?? []);
          setMemberStats(stats);
        })
        .catch(() => {})
        .finally(() => setMembersLoading(false));
    }

    if (activeTab === 'events' && events.length === 0 && !eventsLoading) {
      setEventsLoading(true);
      Promise.all([
        adminFetch<any>(`/clan-events/clan/${cid}`),
        api.clanEvents.stats(cid),
      ])
        .then(([list, stats]: [any, any]) => {
          setEvents(list?.items ?? list ?? []);
          setEventStats(stats);
        })
        .catch(() => {})
        .finally(() => setEventsLoading(false));
    }

    if (activeTab === 'documents' && documents.length === 0 && !docsLoading) {
      setDocsLoading(true);
      api.clanDocuments.list(cid).then((d: any) => setDocuments(d?.items ?? d ?? [])).catch(() => {}).finally(() => setDocsLoading(false));
    }

    if (activeTab === 'locations' && locations.length === 0 && !locationsLoading) {
      setLocationsLoading(true);
      adminFetch<any>(`/clan-locations/clan/${cid}`).then((d: any) => setLocations(d?.items ?? d ?? [])).catch(() => {}).finally(() => setLocationsLoading(false));
    }

    if (activeTab === 'reputation' && !reputation && !repLoading) {
      setRepLoading(true);
      api.reputation.clan(cid).then((d: any) => setReputation(d)).catch(() => {}).finally(() => setRepLoading(false));
    }
  }, [activeTab, clan, galleryItems.length, members.length, events.length, documents.length, locations.length, reputation, galleryLoading, membersLoading, eventsLoading, docsLoading, locationsLoading, repLoading]);

  const handleToggleVerified = async () => {
    if (!clan) return;
    setActionLoading(true);
    try {
      await adminFetch(`/admin-api/clans/${clan.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ verified: !clan.verified }),
      });
      setClan((prev) => prev ? { ...prev, verified: !prev.verified } : null);
    } catch {
      setError('Failed to update verification.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!clan) return;
    setActionLoading(true);
    try {
      await adminFetch(`/admin-api/clans/${clan.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      setClan((prev) => prev ? { ...prev, status: newStatus } : null);
    } catch {
      setError('Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!clan) return;
    if (!confirm(`Permanently delete clan "${clan.name}"? This cannot be undone.`)) return;
    setActionLoading(true);
    try {
      await adminFetch(`/admin-api/clans/${clan.id}`, { method: 'DELETE' });
      router.push('/clans');
    } catch {
      setError('Failed to delete clan.');
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error && !clan) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.back()} className="text-sm text-muted-foreground hover:text-foreground">&larr; Back</button>
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={fetchClan} className="mt-2 text-sm font-medium text-primary hover:underline">Retry</button>
        </div>
      </div>
    );
  }

  if (!clan) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-muted-foreground hover:text-foreground">&larr;</button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{clan.name}</h1>
              {clan.verified && (
                <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">Verified</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground font-mono">/{clan.slug} &middot; {clan.displayId}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>
      )}

      {(clan.bannerUrl || clan.logoUrl) && (
        <div className="flex items-center gap-4">
          {clan.bannerUrl && <img src={clan.bannerUrl} alt="Banner" className="h-24 flex-1 rounded-lg object-cover" />}
          {clan.logoUrl && <img src={clan.logoUrl} alt="Logo" className="h-16 w-16 rounded-full object-cover" />}
        </div>
      )}

      <div className="overflow-x-auto border-b border-border/60">
        <nav className="-mb-px flex gap-1">
          <TabButton label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <TabButton label="Gallery" active={activeTab === 'gallery'} onClick={() => setActiveTab('gallery')} count={galleryItems.length || undefined} />
          <TabButton label="Members" active={activeTab === 'members'} onClick={() => setActiveTab('members')} count={memberStats?.totalMembers || members.length || undefined} />
          <TabButton label="Events" active={activeTab === 'events'} onClick={() => setActiveTab('events')} count={eventStats?.upcoming || undefined} />
          <TabButton label="Documents" active={activeTab === 'documents'} onClick={() => setActiveTab('documents')} count={documents.length || undefined} />
          <TabButton label="Locations" active={activeTab === 'locations'} onClick={() => setActiveTab('locations')} count={locations.length || undefined} />
          <TabButton label="Reputation" active={activeTab === 'reputation'} onClick={() => setActiveTab('reputation')} />
        </nav>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
              <p className="text-sm font-medium text-muted-foreground">Families</p>
              <p className="mt-2 text-3xl font-bold">{clan._count?.families ?? 0}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
              <p className="text-sm font-medium text-muted-foreground">Members</p>
              <p className="mt-2 text-3xl font-bold">{clan._count?.members ?? 0}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
              <p className="text-sm font-medium text-muted-foreground">SubClans</p>
              <p className="mt-2 text-3xl font-bold">{clan._count?.subClans ?? 0}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="mt-2">
                <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[clan.status] || ''}`}>{clan.status}</span>
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
              <p className="text-sm font-medium text-muted-foreground">Community</p>
              <p className="mt-2 text-lg font-bold">{clan.community?.name ?? '—'}</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Clan Information</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Owner</span><span className="font-medium">{clan.owner?.name ?? '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{clan.owner?.email ?? '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Country</span><span className="font-medium">{clan.country || '—'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Private</span><span className="font-medium">{clan.isPrivate ? 'Yes' : 'No'}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span className="font-medium">{new Date(clan.createdAt).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Updated</span><span className="font-medium">{new Date(clan.updatedAt).toLocaleString()}</span></div>
                {clan.description && (
                  <div className="border-t pt-3 mt-3">
                    <p className="text-muted-foreground mb-1">Description</p>
                    <p>{clan.description}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
              <h3 className="font-semibold mb-4">Admins</h3>
              {clan.admins && clan.admins.length > 0 ? (
                <div className="space-y-2">
                  {clan.admins.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm">
                      <span className="font-medium">{admin.name}</span>
                      <span className="text-muted-foreground text-xs">{admin.email}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No admins assigned</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
            <h3 className="font-semibold mb-4">Join Requests ({clan.joinRequests?.length ?? 0})</h3>
            {clan.joinRequests && clan.joinRequests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-left text-muted-foreground">
                      <th className="px-4 py-2 font-medium">User</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clan.joinRequests.map((req) => (
                      <tr key={req.id} className="border-b border-border/30 last:border-0">
                        <td className="px-4 py-2">{req.userName}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[req.status] || 'bg-gray-100 text-gray-800'}`}>{req.status}</span>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground">{new Date(req.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No pending requests</p>
            )}
          </div>

          {clan.subClans && clan.subClans.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
              <h3 className="font-semibold mb-4">SubClans ({clan.subClans.length})</h3>
              <div className="space-y-2">
                {clan.subClans.map((sc) => (
                  <div key={sc.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm">
                    <span className="font-medium">{sc.name}</span>
                    <span className="text-muted-foreground text-xs">{sc._count?.families ?? 0} families &middot; {sc._count?.members ?? 0} members</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
            <h3 className="font-semibold mb-4">Actions</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleToggleVerified}
                disabled={actionLoading}
                className={`rounded px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                  clan.verified
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                {clan.verified ? 'Remove Verification' : 'Verify Clan'}
              </button>
              <select
                value={clan.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={actionLoading}
                className="rounded border border-border/60 bg-background px-3 py-2 text-sm font-medium disabled:opacity-50"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                onClick={handleDelete}
                disabled={actionLoading}
                className="rounded bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-white disabled:opacity-50"
              >
                Delete Clan
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'gallery' && (
        <>
          <h3 className="font-semibold">Gallery ({galleryItems.length})</h3>
          {galleryLoading ? (
            <LoadingSpinner />
          ) : galleryItems.length === 0 ? (
            <EmptyState message="No gallery items found." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {galleryItems.map((item) => (
                <div key={item.id} className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
                  <img src={item.imageUrl} alt={item.title} className="h-40 w-full object-cover" />
                  <div className="p-3">
                    <p className="font-medium text-sm truncate">{item.title}</p>
                    {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      {item.type && <span className="rounded-full bg-muted px-2 py-0.5">{item.type}</span>}
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'members' && (
        <>
          <h3 className="font-semibold">Directory Members</h3>
          {memberStats && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold mt-1">{memberStats.totalMembers}</p>
              </div>
              {Object.entries(memberStats.roles).map(([role, count]) => (
                <div key={role} className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                  <p className="text-sm text-muted-foreground">{role}</p>
                  <p className="text-2xl font-bold mt-1">{count}</p>
                </div>
              ))}
            </div>
          )}
          {membersLoading ? (
            <LoadingSpinner />
          ) : members.length === 0 ? (
            <EmptyState message="No members found." />
          ) : (
            <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Role</th>
                    <th className="px-4 py-2 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-b border-border/30 last:border-0">
                      <td className="px-4 py-2 font-medium">{m.userName}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[m.role] || ''}`}>{m.role}</span>
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">{new Date(m.joinedAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === 'events' && (
        <>
          <h3 className="font-semibold">Events</h3>
          {eventStats && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold mt-1">{eventStats.total}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold mt-1">{eventStats.upcoming}</p>
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">Past</p>
                <p className="text-2xl font-bold mt-1">{eventStats.past}</p>
              </div>
            </div>
          )}
          {eventsLoading ? (
            <LoadingSpinner />
          ) : events.length === 0 ? (
            <EmptyState message="No events found." />
          ) : (
            <div className="space-y-3">
              {events.map((evt) => (
                <div key={evt.id} className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{evt.title}</p>
                      {evt.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{evt.description}</p>}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{new Date(evt.startDate).toLocaleString()}</span>
                        {evt.endDate && <span>&mdash; {new Date(evt.endDate).toLocaleString()}</span>}
                        {evt.location && <span>{evt.location}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {evt.type && <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{evt.type}</span>}
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${EVENT_STATUS_COLORS[evt.status] || ''}`}>{evt.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'documents' && (
        <>
          <h3 className="font-semibold">Documents ({documents.length})</h3>
          {docsLoading ? (
            <LoadingSpinner />
          ) : documents.length === 0 ? (
            <EmptyState message="No documents found." />
          ) : (
            <div className="rounded-xl border border-border/60 bg-card shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-left text-muted-foreground">
                    <th className="px-4 py-2 font-medium">Title</th>
                    <th className="px-4 py-2 font-medium">Type</th>
                    <th className="px-4 py-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-b border-border/30 last:border-0">
                      <td className="px-4 py-2">
                        {doc.fileUrl ? (
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">{doc.title}</a>
                        ) : (
                          <span className="font-medium">{doc.title}</span>
                        )}
                        {doc.description && <p className="text-xs text-muted-foreground mt-0.5">{doc.description}</p>}
                      </td>
                      <td className="px-4 py-2">{doc.type && <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{doc.type}</span>}</td>
                      <td className="px-4 py-2 text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === 'locations' && (
        <>
          <h3 className="font-semibold">Locations ({locations.length})</h3>
          {locationsLoading ? (
            <LoadingSpinner />
          ) : locations.length === 0 ? (
            <EmptyState message="No locations found." />
          ) : (
            <div className="space-y-3">
              {locations.map((loc) => (
                <div key={loc.id} className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{loc.name}</p>
                      {loc.address && <p className="text-sm text-muted-foreground mt-1">{loc.address}</p>}
                      {loc.latitude != null && loc.longitude != null && (
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                        </p>
                      )}
                    </div>
                    {loc.type && <span className="rounded-full bg-muted px-2 py-0.5 text-xs shrink-0">{loc.type}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'reputation' && (
        <>
          <h3 className="font-semibold">Reputation</h3>
          {repLoading ? (
            <LoadingSpinner />
          ) : !reputation ? (
            <EmptyState message="No reputation data available." />
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Scores</h4>
                  <span className="text-2xl font-bold text-primary">{reputation.totalScore}</span>
                </div>
                <ScoreBar label="Trust" value={reputation.trust} />
                <ScoreBar label="Heritage" value={reputation.heritage} />
                <ScoreBar label="Contribution" value={reputation.contribution} />
              </div>
              <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
                <h4 className="font-semibold mb-4">Breakdown</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Trust Score</span><span className="font-medium">{reputation.trust}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Heritage Score</span><span className="font-medium">{reputation.heritage}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Contribution Score</span><span className="font-medium">{reputation.contribution}</span></div>
                  <div className="border-t pt-3 flex justify-between"><span className="text-muted-foreground font-medium">Total Score</span><span className="font-bold text-lg">{reputation.totalScore}</span></div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
