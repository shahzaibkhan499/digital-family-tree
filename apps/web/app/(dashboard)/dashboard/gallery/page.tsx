'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';

export default function GalleryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [galleries, setGalleries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', galleryType: 'PHOTO', visibility: 'ONLY_ME', albumName: '', location: '', photographer: '', tags: '' });

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadGalleries();
  }, [user]);

  async function loadGalleries() {
    setLoading(true);
    try {
      const data = await api.documentVault.gallery.list();
      setGalleries(data);
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.error(e);
      }
    }
    setLoading(false);
  }

  async function handleCreate() {
    if (!form.title.trim()) return;
    try {
      await api.documentVault.gallery.create(form);
      setShowCreate(false);
      setForm({ title: '', description: '', galleryType: 'PHOTO', visibility: 'ONLY_ME', albumName: '', location: '', photographer: '', tags: '' });
      loadGalleries();
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.error(e);
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this gallery item?')) return;
    try {
      await api.documentVault.gallery.remove(id);
      loadGalleries();
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.error(e);
      }
    }
  }

  if (authLoading || !user) return null;

  const typeLabels: Record<string, string> = {
    PHOTO: 'Photo', ALBUM: 'Album', VIDEO: 'Video', HISTORICAL_IMAGE: 'Historical Image', MAP: 'Map', LETTER: 'Letter', BOOK: 'Book', DOCUMENT_SCAN: 'Document Scan', OTHER: 'Other',
  };

  const typeColors: Record<string, string> = {
    PHOTO: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    ALBUM: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    VIDEO: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    HISTORICAL_IMAGE: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    MAP: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    LETTER: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
    BOOK: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gallery</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage your photos, albums, and visual heritage</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          New Gallery Item
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Add Gallery Item</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <select value={form.galleryType} onChange={e => setForm({ ...form, galleryType: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
              <option value="PHOTO">Photo</option><option value="ALBUM">Album</option><option value="VIDEO">Video</option><option value="HISTORICAL_IMAGE">Historical Image</option><option value="MAP">Map</option><option value="LETTER">Letter</option><option value="BOOK">Book</option><option value="DOCUMENT_SCAN">Document Scan</option><option value="OTHER">Other</option>
            </select>
            <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <input placeholder="Album name" value={form.albumName} onChange={e => setForm({ ...form, albumName: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <input placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <input placeholder="Photographer" value={form.photographer} onChange={e => setForm({ ...form, photographer: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <input placeholder="Tags (comma separated)" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <select value={form.visibility} onChange={e => setForm({ ...form, visibility: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
              <option value="ONLY_ME">Only Me</option><option value="FAMILY">Family</option><option value="SUBCLAN">SubClan</option><option value="CLAN">Clan</option><option value="COMMUNITY">Community</option><option value="PUBLIC">Public</option>
            </select>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleCreate} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">Create</button>
            <button onClick={() => setShowCreate(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>
      ) : galleries.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">No gallery items</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Start building your visual heritage collection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {galleries.map(g => (
            <div key={g.id} className="group rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900">
              <div className="aspect-[4/3] bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 flex items-center justify-center">
                {g.coverImage ? <img src={g.coverImage} alt={g.title} className="h-full w-full object-cover" /> : <svg className="h-10 w-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate">{g.title}</h3>
                  <button onClick={() => handleDelete(g.id)} className="shrink-0 rounded p-1 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
                {g.description && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">{g.description}</p>}
                <div className="mt-2 flex items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${typeColors[g.galleryType] || 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'}`}>{typeLabels[g.galleryType] || g.galleryType}</span>
                  {g.location && <span className="text-xs text-slate-400 dark:text-slate-500">{g.location}</span>}
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                  <span>{g.totalViews} views</span>
                  <span>{g.itemCount} items</span>
                  {g.photographer && <span>by {g.photographer}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
