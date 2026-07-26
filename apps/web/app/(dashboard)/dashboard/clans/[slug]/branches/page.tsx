'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

const SUBCLAN_TYPES = ['Branch', 'Clan', 'Lineage', 'House', 'Family'] as const;

const TYPE_COLORS: Record<string, string> = {
  Branch: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  Clan: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Lineage: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  House: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Family: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

function formatDate(d: string | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

interface SubClanNodeProps {
  subclan: any;
  depth?: number;
}

function SubClanNode({ subclan, depth = 0 }: SubClanNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = subclan.children && subclan.children.length > 0;

  return (
    <div style={{ marginLeft: depth > 0 ? '1.5rem' : 0 }}>
      <div className={`relative rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ${depth > 0 ? 'mt-3' : ''}`}>
        {depth > 0 && (
          <div className="absolute -left-3 top-1/2 h-px w-3 bg-slate-300 dark:bg-slate-700" />
        )}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {hasChildren && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <svg className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{subclan.name}</h3>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${TYPE_COLORS[subclan.type] || TYPE_COLORS.Branch}`}>
                {subclan.type || 'Branch'}
              </span>
              {subclan.memberCount !== undefined && (
                <span className="text-[11px] text-slate-400 dark:text-slate-500">{subclan.memberCount} members</span>
              )}
            </div>
            {subclan.description && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{subclan.description}</p>
            )}
            {subclan.location && (
              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500 inline-flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {subclan.location}
              </p>
            )}
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">{formatDate(subclan.createdAt)}</span>
        </div>
      </div>
      {expanded && hasChildren && (
        <div className="relative ml-4 mt-1 border-l-2 border-slate-200 dark:border-slate-800 pl-3">
          {subclan.children.map((child: any) => (
            <SubClanNode key={child.id} subclan={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ClanBranchesPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params.slug as string;

  const [clan, setClan] = useState<any>(null);
  const [subclans, setSubclans] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    type: 'Branch',
    name: '',
    description: '',
    location: '',
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.clans.get(slug);
        setClan(data);
      } catch {
        router.push('/dashboard/clans');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, router]);

  useEffect(() => {
    if (!clan) return;
    setLoadingBranches(true);
    Promise.allSettled([
      api.subclans.listByClanId(clan.id),
      api.subclans.getStats(clan.id),
    ]).then(([subclansResult, statsResult]) => {
      if (subclansResult.status === 'fulfilled') {
        setSubclans(Array.isArray(subclansResult.value) ? subclansResult.value : []);
      }
      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value);
      }
    }).catch(() => setSubclans([])).finally(() => setLoadingBranches(false));
  }, [clan]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clan || !createForm.name.trim()) return;
    setCreating(true);
    try {
      await api.subclans.create(clan.id, {
        type: createForm.type,
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        location: createForm.location.trim() || undefined,
      });
      const data = await api.subclans.listByClanId(clan.id);
      setSubclans(Array.isArray(data) ? data : []);
      setShowCreate(false);
      setCreateForm({ type: 'Branch', name: '', description: '', location: '' });
    } catch { /* empty */ } finally { setCreating(false); }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!clan) return null;

  const totalBranches = stats?.total ?? subclans.length;
  const totalMembers = stats?.totalMembers ?? subclans.reduce((acc: number, s: any) => acc + (s.memberCount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/dashboard/clans/${slug}`} className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">&larr; {clan.name}</Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Clan Branches</h1>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {showCreate ? 'Cancel' : '+ Add Branch'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-2xl font-bold text-indigo-600">{totalBranches}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Branches</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-2xl font-bold text-emerald-600">{totalMembers}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Total Members</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-2xl font-bold text-amber-600">{stats?.rootCount ?? subclans.filter((s: any) => !s.parentId).length ?? 0}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Root Branches</p>
        </div>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
              <select
                value={createForm.type}
                onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {SUBCLAN_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
              <input
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Branch name"
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              placeholder="Describe this branch..."
              rows={3}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Location</label>
            <input
              type="text"
              value={createForm.location}
              onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
              placeholder="Optional location"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating || !createForm.name.trim()}
              className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Branch'}
            </button>
          </div>
        </form>
      )}

      {loadingBranches ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        </div>
      ) : subclans.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <svg className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No branches yet.</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Create subclans and branches to organize your clan structure.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {subclans.filter((s: any) => !s.parentId).map((subclan: any) => (
            <SubClanNode key={subclan.id} subclan={subclan} />
          ))}
        </div>
      )}
    </div>
  );
}
