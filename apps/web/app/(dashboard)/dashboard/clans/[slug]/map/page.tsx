'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

const LOCATION_TYPES = ['Origin', 'Migration', 'Current', 'Historical', 'Burial', 'Other'] as const;

const TYPE_COLORS: Record<string, string> = {
  Origin: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  Migration: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Current: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Historical: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Burial: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  Other: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
};

function formatDate(d: string | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ClanMapPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params.slug as string;

  const [clan, setClan] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [distribution, setDistribution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [activeType, setActiveType] = useState<string>('All');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    type: 'Current',
    country: '',
    city: '',
    latitude: '',
    longitude: '',
    population: '',
    year: '',
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
    setLoadingLocations(true);
    const cid = clan.id;
    Promise.allSettled([
      api.clanLocations.listByClan(cid, activeType !== 'All' ? { type: activeType } : undefined),
      api.clanLocations.distribution(cid),
    ]).then(([locResult, distResult]) => {
      if (locResult.status === 'fulfilled') {
        setLocations(Array.isArray(locResult.value) ? locResult.value : []);
      }
      if (distResult.status === 'fulfilled') {
        setDistribution(distResult.value);
      }
    }).catch(() => setLocations([])).finally(() => setLoadingLocations(false));
  }, [clan, activeType]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clan || !createForm.country.trim() || !createForm.city.trim()) return;
    setCreating(true);
    try {
      await api.clanLocations.create({
        clanId: clan.id,
        type: createForm.type,
        country: createForm.country.trim(),
        city: createForm.city.trim(),
        latitude: createForm.latitude ? parseFloat(createForm.latitude) : undefined,
        longitude: createForm.longitude ? parseFloat(createForm.longitude) : undefined,
        population: createForm.population ? parseInt(createForm.population, 10) : undefined,
        year: createForm.year ? parseInt(createForm.year, 10) : undefined,
      });
      const data = await api.clanLocations.listByClan(clan.id, activeType !== 'All' ? { type: activeType } : undefined);
      setLocations(Array.isArray(data) ? data : []);
      setShowCreate(false);
      setCreateForm({ type: 'Current', country: '', city: '', latitude: '', longitude: '', population: '', year: '' });
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

  const countryDistribution = distribution?.byCountry || distribution?.countries || {};
  const typeDistribution = distribution?.byType || distribution?.types || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/dashboard/clans/${slug}`} className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">&larr; {clan.name}</Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Clan Locations</h1>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {showCreate ? 'Cancel' : '+ Add Location'}
        </button>
      </div>

      {distribution && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Object.keys(typeDistribution).length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">By Type</h3>
              <div className="space-y-2">
                {Object.entries(typeDistribution).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${TYPE_COLORS[type as string] || TYPE_COLORS.Other}`}>
                        {type as string}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {Object.keys(countryDistribution).length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">By Country</h3>
              <div className="space-y-2">
                {Object.entries(countryDistribution).map(([country, count]) => (
                  <div key={country} className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{country}</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <form onSubmit={handleCreate} className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Type</label>
              <select
                value={createForm.type}
                onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {LOCATION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Country</label>
              <input
                type="text"
                value={createForm.country}
                onChange={(e) => setCreateForm({ ...createForm, country: e.target.value })}
                placeholder="Country"
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">City</label>
              <input
                type="text"
                value={createForm.city}
                onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                placeholder="City"
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                value={createForm.latitude}
                onChange={(e) => setCreateForm({ ...createForm, latitude: e.target.value })}
                placeholder="Optional"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                value={createForm.longitude}
                onChange={(e) => setCreateForm({ ...createForm, longitude: e.target.value })}
                placeholder="Optional"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Population</label>
              <input
                type="number"
                value={createForm.population}
                onChange={(e) => setCreateForm({ ...createForm, population: e.target.value })}
                placeholder="Optional"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Year</label>
              <input
                type="number"
                value={createForm.year}
                onChange={(e) => setCreateForm({ ...createForm, year: e.target.value })}
                placeholder="Optional"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating || !createForm.country.trim() || !createForm.city.trim()}
              className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {creating ? 'Adding...' : 'Add Location'}
            </button>
          </div>
        </form>
      )}

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        {['All', ...LOCATION_TYPES].map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors ${
              activeType === type
                ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {loadingLocations ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        </div>
      ) : locations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <svg className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No locations yet.</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Map the geographic distribution of your clan.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {locations.map((loc: any) => (
            <div key={loc.id} className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${TYPE_COLORS[loc.type] || TYPE_COLORS.Other}`}>
                      {loc.type}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {loc.country}
                    </span>
                    {loc.city && <span>{loc.city}</span>}
                    {loc.latitude && loc.longitude && (
                      <span className="text-slate-400 dark:text-slate-500">
                        {Number(loc.latitude).toFixed(4)}, {Number(loc.longitude).toFixed(4)}
                      </span>
                    )}
                    {loc.population && (
                      <span className="text-slate-400 dark:text-slate-500">Pop: {loc.population.toLocaleString()}</span>
                    )}
                    {loc.year && (
                      <span className="text-slate-400 dark:text-slate-500">Est. {loc.year}</span>
                    )}
                  </div>
                </div>
                {loc.createdAt && (
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">{formatDate(loc.createdAt)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
