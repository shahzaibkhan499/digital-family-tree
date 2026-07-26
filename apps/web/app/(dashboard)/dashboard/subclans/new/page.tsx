'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';

export default function NewSubClanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clans, setClans] = useState<any[]>([]);
  const [parentSubclans, setParentSubclans] = useState<any[]>([]);
  const [loadingSubclans, setLoadingSubclans] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    origin: '',
    region: '',
    country: '',
    founder: '',
    privacy: 'PUBLIC',
    clanId: '',
    parentSubClanId: '',
  });

  useEffect(() => {
    api.clans.list({ limit: 100 })
      .then((data: any) => setClans(data?.clans || data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!form.clanId) {
      setParentSubclans([]);
      setForm((f) => ({ ...f, parentSubClanId: '' }));
      return;
    }
    setLoadingSubclans(true);
    api.subclans.listByClanId(form.clanId)
      .then((data: any) => setParentSubclans(Array.isArray(data) ? data : data?.subclans || []))
      .catch(() => setParentSubclans([]))
      .finally(() => setLoadingSubclans(false));
  }, [form.clanId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload: any = {
        name: form.name,
        description: form.description,
        origin: form.origin,
        region: form.region,
        country: form.country,
        founder: form.founder,
        privacy: form.privacy,
      };
      if (form.parentSubClanId) {
        payload.parentSubClanId = form.parentSubClanId;
      }
      const subclan = await api.subclans.create(form.clanId, payload);
      router.push(`/dashboard/subclans/${subclan.slug || subclan.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create subclan');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/dashboard/subclans" className="text-sm text-emerald-600 hover:text-emerald-700">
          â† Back to subclans
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Create New Sub-Clan</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Create a sub-clan to organize families within a clan.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Parent Clan *</label>
          <select name="clanId" value={form.clanId} onChange={handleChange} required className={inputClass}>
            <option value="">Select a clan</option>
            {clans.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Parent Sub-Clan (optional)</label>
          <select
            name="parentSubClanId"
            value={form.parentSubClanId}
            onChange={handleChange}
            disabled={!form.clanId || loadingSubclans}
            className={inputClass + (!form.clanId ? ' opacity-50 cursor-not-allowed' : '')}
          >
            <option value="">
              {loadingSubclans ? 'Loading sub-clans...' : 'None â€” top-level sub-clan'}
            </option>
            {parentSubclans.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {form.clanId && !loadingSubclans && parentSubclans.length === 0 && (
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">No existing sub-clans in this clan.</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Sub-Clan Name *</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} required className={inputClass} placeholder="e.g. Malik Sub-Clan" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={3} className={inputClass} placeholder="What is this sub-clan about?" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Origin</label>
            <input type="text" name="origin" value={form.origin} onChange={handleChange} className={inputClass} placeholder="e.g. Punjab, India" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Region</label>
            <input type="text" name="region" value={form.region} onChange={handleChange} className={inputClass} placeholder="e.g. South Asia" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Country</label>
            <input type="text" name="country" value={form.country} onChange={handleChange} className={inputClass} placeholder="e.g. Pakistan" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Founder</label>
            <input type="text" name="founder" value={form.founder} onChange={handleChange} className={inputClass} placeholder="Founder name" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Privacy</label>
          <select name="privacy" value={form.privacy} onChange={handleChange} className={inputClass}>
            <option value="PUBLIC">Public â€” anyone can discover and join</option>
            <option value="PRIVATE">Private â€” invite only</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || !form.name.trim() || !form.clanId}
          className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Sub-Clan'}
        </button>
      </form>
    </div>
  );
}
