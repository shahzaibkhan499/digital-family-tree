'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

const GALLERY_TYPES = ['Photo', 'Video', 'Document', 'Map', 'Historical Image'] as const;

const TYPE_ICONS: Record<string, string> = {
  Photo: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
  Video: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
  Document: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  Map: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7',
  'Historical Image': 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z',
};

const TYPE_COLORS: Record<string, string> = {
  Photo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Video: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  Document: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Map: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  'Historical Image': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

function formatDate(d: string | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function CommunityGalleryPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params.slug as string;

  const [community, setCommunity] = useState<any>(null);
  const [gallery, setGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [activeType, setActiveType] = useState<string>('All');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    type: 'Photo',
    title: '',
    description: '',
    url: '',
  });

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
    setLoadingGallery(true);
    const p = activeType !== 'All' ? { type: activeType } : undefined;
    api.communityGallery.listByCommunity(community.id, p)
      .then((data) => setGallery(Array.isArray(data) ? data : []))
      .catch(() => setGallery([]))
      .finally(() => setLoadingGallery(false));
  }, [community, activeType]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!community || !createForm.title.trim() || !createForm.url.trim()) return;
    setCreating(true);
    try {
      await api.communityGallery.create({
        communityId: community.id,
        type: createForm.type,
        title: createForm.title.trim(),
        description: createForm.description.trim() || undefined,
        url: createForm.url.trim(),
      });
      const data = await api.communityGallery.listByCommunity(community.id, activeType !== 'All' ? { type: activeType } : undefined);
      setGallery(Array.isArray(data) ? data : []);
      setShowCreate(false);
      setCreateForm({ type: 'Photo', title: '', description: '', url: '' });
    } catch { /* empty */ } finally { setCreating(false); }
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
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Community Gallery</h1>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {showCreate ? 'Cancel' : '+ Add Item'}
        </button>
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
                {GALLERY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
              <input
                type="text"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                placeholder="Item title"
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL</label>
            <input
              type="url"
              value={createForm.url}
              onChange={(e) => setCreateForm({ ...createForm, url: e.target.value })}
              placeholder="https://..."
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
            <textarea
              value={createForm.description}
              onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
              placeholder="Optional description"
              rows={3}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating || !createForm.title.trim() || !createForm.url.trim()}
              className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {creating ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      )}

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        {['All', ...GALLERY_TYPES].map((type) => (
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

      {loadingGallery ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        </div>
      ) : gallery.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <svg className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No gallery items yet.</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Add photos, videos, documents, and more.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.map((item: any) => (
            <div key={item.id} className="group rounded-xl border border-slate-200 bg-white overflow-hidden dark:border-slate-800 dark:bg-slate-900">
              {item.type === 'Photo' || item.type === 'Historical Image' ? (
                <div className="aspect-video w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img src={item.url} alt={item.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                </div>
              ) : (
                <div className="aspect-video w-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center">
                  <svg className="h-12 w-12 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={TYPE_ICONS[item.type] || TYPE_ICONS.Document} /></svg>
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${TYPE_COLORS[item.type] || 'bg-slate-100 text-slate-700'}`}>
                    {item.type}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{item.title}</h3>
                {item.description && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{item.description}</p>
                )}
                {item.createdAt && (
                  <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">{formatDate(item.createdAt)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
