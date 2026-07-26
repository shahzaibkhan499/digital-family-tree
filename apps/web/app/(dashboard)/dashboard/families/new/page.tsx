'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';

export default function NewFamilyPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [clans, setClans] = useState<any[]>([]);
  const [clanSearch, setClanSearch] = useState('');
  const [selectedClan, setSelectedClan] = useState<any>(null);
  const [showClanList, setShowClanList] = useState(false);

  useEffect(() => {
    api.clans.list({ limit: 50 }).then((data) => {
      const list = Array.isArray(data) ? data : data?.clans || [];
      setClans(list);
    }).catch(() => {});
  }, []);

  const filteredClans = clans.filter((c) => {
    if (!clanSearch.trim()) return true;
    const q = clanSearch.toLowerCase();
    return (c.name || '').toLowerCase().includes(q) || (c.country || '').toLowerCase().includes(q);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const family = await api.families.create({
        name,
        description: description || undefined,
        ...(selectedClan ? { clanId: selectedClan.id || selectedClan.slug } : {}),
      });
      if (selectedClan && family.id) {
        await api.clans.join(selectedClan.id || selectedClan.slug, family.id).catch(() => {});
      }
      router.push(`/dashboard/families/${family.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create family');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link href="/dashboard/families" className="text-sm text-emerald-600 hover:text-emerald-700">
          â† Back to families
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Create New Family</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Start a new family tree to add members and build connections.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Family Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            placeholder="Smith Family"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            placeholder="Optional description of this family tree..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Join a Clan
          </label>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 mb-2">
            Optionally add this family to an existing clan.
          </p>
          {selectedClan ? (
            <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-800 dark:bg-emerald-900/10">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  {selectedClan.name?.charAt(0)}
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-white">{selectedClan.name}</span>
              </div>
              <button type="button" onClick={() => { setSelectedClan(null); setClanSearch(''); }} className="text-xs text-slate-400 hover:text-red-500">Remove</button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={clanSearch}
                onChange={(e) => { setClanSearch(e.target.value); setShowClanList(true); }}
                onFocus={() => setShowClanList(true)}
                placeholder="Search clans..."
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              {showClanList && (
                <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  {filteredClans.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500">No clans found</p>
                  ) : (
                    filteredClans.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setSelectedClan(c); setShowClanList(false); setClanSearch(''); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{c.name}</p>
                        {(c.country || c.region) && <p className="text-xs text-slate-400 dark:text-slate-500">{c.country || c.region}</p>}
                      </button>
                    ))
                  )}
                </div>
              )}
              <Link href="/dashboard/clans/new" className="mt-2 inline-block text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                Or Create New Clan â†’
              </Link>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Family'}
        </button>
      </form>
    </div>
  );
}
