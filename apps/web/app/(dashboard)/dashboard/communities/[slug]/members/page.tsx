'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

const ROLE_FILTERS = ['All', 'LEADER', 'ELDER', 'MEMBER', 'NEWCOMER'] as const;

const ROLE_COLORS: Record<string, string> = {
  LEADER: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ELDER: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  MEMBER: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  NEWCOMER: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
      <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
      Verified
    </span>
  );
}

function formatRelative(d: string | null | undefined): string {
  if (!d) return '';
  const date = new Date(d);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffDay < 1) return 'Today';
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function CommunityMembersPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params.slug as string;

  const [community, setCommunity] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [activeRole, setActiveRole] = useState<string>('All');
  const [verifiedFilter, setVerifiedFilter] = useState<boolean | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [joining, setJoining] = useState(false);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.communities.get(slug);
        setCommunity(data);
      } catch {
        router.push('/dashboard/communities');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, router]);

  useEffect(() => {
    if (!community) return;
    setLoadingMembers(true);
    const cid = community.id;
    Promise.allSettled([
      api.communityDirectory.listByCommunity(cid, {
        role: activeRole !== 'All' ? activeRole : undefined,
        verified: verifiedFilter,
        search: searchQuery || undefined,
      }),
      api.communityDirectory.stats(cid),
    ]).then(([membersResult, statsResult]) => {
      if (membersResult.status === 'fulfilled') {
        setMembers(Array.isArray(membersResult.value) ? membersResult.value : []);
      }
      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value);
        setIsMember(statsResult.value?.isMember || false);
      }
    }).catch(() => {
      setMembers([]);
    }).finally(() => setLoadingMembers(false));
  }, [community, activeRole, verifiedFilter, searchQuery]);

  const handleJoin = async () => {
    if (!community) return;
    setJoining(true);
    try {
      await api.communityDirectory.join(community.id);
      setIsMember(true);
      const s = await api.communityDirectory.stats(community.id).catch(() => null);
      setStats(s);
      const data = await api.communityDirectory.listByCommunity(community.id, {
        role: activeRole !== 'All' ? activeRole : undefined,
        verified: verifiedFilter,
        search: searchQuery || undefined,
      });
      setMembers(Array.isArray(data) ? data : []);
    } catch { /* empty */ } finally { setJoining(false); }
  };

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
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/dashboard/communities/${slug}`} className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">&larr; {community.name}</Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Members Directory</h1>
        </div>
        {!isMember && (
          <button
            onClick={handleJoin}
            disabled={joining}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {joining ? 'Joining...' : 'Join Community'}
          </button>
        )}
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-2xl font-bold text-indigo-600">{stats.total ?? members.length ?? 0}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total Members</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-2xl font-bold text-emerald-600">{stats.verified ?? 0}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Verified</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-2xl font-bold text-amber-600">{stats.leaders ?? stats.LEADER ?? 0}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Leaders</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-2xl font-bold text-purple-600">{stats.elders ?? stats.ELDER ?? 0}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Elders</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search members..."
          className="w-full max-w-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVerifiedFilter(undefined)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${verifiedFilter === undefined ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'}`}
          >
            All
          </button>
          <button
            onClick={() => setVerifiedFilter(true)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${verifiedFilter === true ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'}`}
          >
            Verified
          </button>
          <button
            onClick={() => setVerifiedFilter(false)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${verifiedFilter === false ? 'bg-slate-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'}`}
          >
            Unverified
          </button>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        {ROLE_FILTERS.map((role) => (
          <button
            key={role}
            onClick={() => setActiveRole(role)}
            className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
              activeRole === role
                ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            {role === 'All' ? 'All Roles' : role.charAt(0) + role.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loadingMembers ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <svg className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No members found.</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Be the first to join this community.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((member: any) => {
            const name = member.user?.firstName ? `${member.user.firstName} ${member.user.lastName || ''}` : member.user?.name || member.name || 'Unknown';
            const role = member.role || 'MEMBER';
            return (
              <div key={member.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white">
                    {name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{name}</p>
                      {member.isVerified && <VerifiedBadge />}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${ROLE_COLORS[role] || ROLE_COLORS.MEMBER}`}>
                        {role}
                      </span>
                      {member.joinedAt && (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">Joined {formatRelative(member.joinedAt)}</span>
                      )}
                    </div>
                  </div>
                </div>
                {member.user?.email && (
                  <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">{member.user.email}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
