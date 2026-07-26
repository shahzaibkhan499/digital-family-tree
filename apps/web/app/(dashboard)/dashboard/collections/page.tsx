'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';

export default function CollectionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', collectionType: 'MANUAL', visibility: 'ONLY_ME' });

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadCollections();
  }, [user]);

  async function loadCollections() {
    setLoading(true);
    try {
      const data = await api.documentVault.collections.list();
      setCollections(data);
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.error(e);
      }
    }
    setLoading(false);
  }

  async function handleCreate() {
    if (!form.name.trim()) return;
    try {
      await api.documentVault.collections.create(form);
      setShowCreate(false);
      setForm({ name: '', description: '', collectionType: 'MANUAL', visibility: 'ONLY_ME' });
      loadCollections();
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.error(e);
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this collection?')) return;
    try {
      await api.documentVault.collections.remove(id);
      loadCollections();
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.error(e);
      }
    }
  }

  if (authLoading || !user) return null;

  const typeIcons: Record<string, string> = {
    FAMILY: 'Family', CLAN: 'Clan', COMMUNITY: 'Community', HISTORICAL: 'Historical', LIBRARY: 'Library', MUSEUM: 'Museum', GENEALOGY: 'Genealogy', MANUAL: 'Manual', SMART: 'Smart',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Collections</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Organize documents into themed collections</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          New Collection
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Create Collection</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input placeholder="Collection name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <input placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <select value={form.collectionType} onChange={e => setForm({ ...form, collectionType: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
              <option value="MANUAL">Manual</option><option value="SMART">Smart</option><option value="FAMILY">Family</option><option value="CLAN">Clan</option><option value="COMMUNITY">Community</option><option value="HISTORICAL">Historical</option><option value="LIBRARY">Library</option><option value="MUSEUM">Museum</option><option value="GENEALOGY">Genealogy</option>
            </select>
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
      ) : collections.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">No collections</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Get started by creating a collection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {collections.map(c => (
            <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{c.name}</h3>
                    {c.isFeatured && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Featured</span>}
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{c.description || 'No description'}</p>
                </div>
                <button onClick={() => handleDelete(c.id)} className="rounded p-1 text-slate-400 hover:text-red-500"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
              </div>
              <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-800">{typeIcons[c.collectionType] || c.collectionType}</span>
                <span>{c.itemCount || 0} items</span>
                <span className="capitalize">{c.visibility?.toLowerCase()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
