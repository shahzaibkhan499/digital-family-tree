'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';

export default function KnowledgeBasePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '', articleType: 'WIKI', visibility: 'ONLY_ME', status: 'DRAFT', tags: '' });
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadEntries();
  }, [user]);

  async function loadEntries() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const data = await api.documentVault.knowledgeBase.list(params);
      setEntries(data);
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
      if (editingId) {
        await api.documentVault.knowledgeBase.update(editingId, form);
      } else {
        await api.documentVault.knowledgeBase.create(form);
      }
      setShowCreate(false);
      setEditingId(null);
      setForm({ title: '', content: '', articleType: 'WIKI', visibility: 'ONLY_ME', status: 'DRAFT', tags: '' });
      loadEntries();
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.error(e);
      }
    }
  }

  async function handleEdit(entry: any) {
    setForm({ title: entry.title, content: entry.content || '', articleType: entry.articleType, visibility: entry.visibility, status: entry.status, tags: entry.tags || '' });
    setEditingId(entry.id);
    setShowCreate(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this entry?')) return;
    try {
      await api.documentVault.knowledgeBase.remove(id);
      loadEntries();
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.error(e);
      }
    }
  }

  async function handleVote(id: string, helpful: boolean) {
    try {
      await api.documentVault.knowledgeBase.vote(id, helpful);
      loadEntries();
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.error(e);
      }
    }
  }

  if (authLoading || !user) return null;

  const typeLabels: Record<string, string> = {
    WIKI: 'Wiki', ARTICLE: 'Article', RESEARCH: 'Research', ORAL_HISTORY: 'Oral History', FAQ: 'FAQ', HISTORICAL_NOTE: 'Historical Note', REFERENCE: 'Reference', GUIDE: 'Guide',
  };

  const typeColors: Record<string, string> = {
    WIKI: 'bg-blue-100 text-blue-800', ARTICLE: 'bg-emerald-100 text-emerald-800', RESEARCH: 'bg-purple-100 text-purple-800', ORAL_HISTORY: 'bg-amber-100 text-amber-800', FAQ: 'bg-cyan-100 text-cyan-800', HISTORICAL_NOTE: 'bg-rose-100 text-rose-800', REFERENCE: 'bg-indigo-100 text-indigo-800', GUIDE: 'bg-teal-100 text-teal-800',
  };

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-800', PUBLISHED: 'bg-green-100 text-green-800', ARCHIVED: 'bg-orange-100 text-orange-800', REVIEW: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Knowledge Base</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Wiki articles, research notes, and family heritage documentation</p>
        </div>
        <button onClick={() => { setShowCreate(true); setEditingId(null); setForm({ title: '', content: '', articleType: 'WIKI', visibility: 'ONLY_ME', status: 'DRAFT', tags: '' }); }} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          New Article
        </button>
      </div>

      <div className="flex gap-3">
        <input placeholder="Search knowledge base..." value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadEntries()} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
        <button onClick={loadEntries} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">Search</button>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">{editingId ? 'Edit Article' : 'New Article'}</h2>
          <div className="space-y-4">
            <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <textarea placeholder="Content (Markdown supported)" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={8} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <select value={form.articleType} onChange={e => setForm({ ...form, articleType: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                <option value="WIKI">Wiki</option><option value="ARTICLE">Article</option><option value="RESEARCH">Research</option><option value="ORAL_HISTORY">Oral History</option><option value="FAQ">FAQ</option><option value="HISTORICAL_NOTE">Historical Note</option><option value="REFERENCE">Reference</option><option value="GUIDE">Guide</option>
              </select>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                <option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option><option value="REVIEW">Review</option><option value="ARCHIVED">Archived</option>
              </select>
              <select value={form.visibility} onChange={e => setForm({ ...form, visibility: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                <option value="ONLY_ME">Only Me</option><option value="FAMILY">Family</option><option value="CLAN">Clan</option><option value="COMMUNITY">Community</option><option value="PUBLIC">Public</option>
              </select>
              <input placeholder="Tags" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreate} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">{editingId ? 'Update' : 'Create'}</button>
              <button onClick={() => { setShowCreate(false); setEditingId(null); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
          <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">No articles yet</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Start documenting your heritage knowledge.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => (
            <div key={entry.id} className="rounded-xl border border-slate-200 bg-white p-5 hover:shadow-sm transition-shadow dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{entry.title}</h3>
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${typeColors[entry.articleType] || 'bg-slate-100 text-slate-800'}`}>{typeLabels[entry.articleType] || entry.articleType}</span>
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusColors[entry.status] || 'bg-slate-100 text-slate-800'}`}>{entry.status}</span>
                  </div>
                  {entry.content && <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{entry.content.substring(0, 200)}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(entry)} className="rounded p-1 text-slate-400 hover:text-emerald-500"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                  <button onClick={() => handleDelete(entry.id)} className="rounded p-1 text-slate-400 hover:text-red-500"><svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span>{entry.viewCount} views</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleVote(entry.id, true)} className="hover:text-green-600">{entry.helpfulCount} helpful</button>
                  <span>/</span>
                  <button onClick={() => handleVote(entry.id, false)} className="hover:text-red-600">{entry.notHelpfulCount} not helpful</button>
                </div>
                <span>Updated {new Date(entry.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
