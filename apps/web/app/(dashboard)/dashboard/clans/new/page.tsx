'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export default function NewClanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    description: '',
    history: '',
    origin: '',
    region: '',
    country: '',
    website: '',
    founder: '',
    privacy: 'PUBLIC',
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [logoData, setLogoData] = useState<string | null>(null);
  const [bannerData, setBannerData] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoPreview(URL.createObjectURL(file));
    setLogoData(await toBase64(file));
  };

  const handleBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerPreview(URL.createObjectURL(file));
    setBannerData(await toBase64(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload: any = { ...form };
      if (logoData) payload.logoUrl = logoData;
      if (bannerData) payload.bannerUrl = bannerData;
      const clan = await api.clans.create(payload);
      router.push(`/dashboard/clans/${clan.slug || clan.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create clan');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/dashboard/clans" className="text-sm text-emerald-600 hover:text-emerald-700">
          â† Back to clans
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">Create New Clan</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Create a clan to bring multiple families together under one community.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Clan Name *</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} required className={inputClass} placeholder="e.g. Khan Clan" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={3} className={inputClass} placeholder="What is this clan about?" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">History</label>
          <textarea name="history" value={form.history} onChange={handleChange} rows={3} className={inputClass} placeholder="Clan history and heritage..." />
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Website</label>
            <input type="url" name="website" value={form.website} onChange={handleChange} className={inputClass} placeholder="https://..." />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Founder</label>
            <input type="text" name="founder" value={form.founder} onChange={handleChange} className={inputClass} placeholder="Founder name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Privacy</label>
            <select name="privacy" value={form.privacy} onChange={handleChange} className={inputClass}>
              <option value="PUBLIC">Public â€” anyone can discover and join</option>
              <option value="PRIVATE">Private â€” invite only</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Logo</label>
            <div className="mt-1 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                )}
              </div>
              <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                Choose Logo
                <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Banner</label>
            <div className="mt-1 flex items-center gap-4">
              <div className="flex h-16 w-24 items-center justify-center overflow-hidden rounded-lg border-2 border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                {bannerPreview ? (
                  <img src={bannerPreview} alt="Banner" className="h-full w-full object-cover" />
                ) : (
                  <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                )}
              </div>
              <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                Choose Banner
                <input type="file" accept="image/*" onChange={handleBanner} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !form.name.trim()}
          className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Clan'}
        </button>
      </form>
    </div>
  );
}
