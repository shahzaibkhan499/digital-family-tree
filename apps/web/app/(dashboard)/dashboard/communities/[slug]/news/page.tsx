'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

const NEWS_TYPES = ['Announcement', 'Update', 'Achievement', 'Heritage', 'General'] as const;

const TYPE_COLORS: Record<string, string> = {
  Announcement: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Update: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Achievement: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Heritage: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  General: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
};

const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  DRAFT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ARCHIVED: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
};

function formatDate(d: string | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function CommunityNewsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params.slug as string;

  const [community, setCommunity] = useState<any>(null);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNews, setLoadingNews] = useState(false);
  const [activeType, setActiveType] = useState<string>('All');
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    type: 'Announcement',
    title: '',
    content: '',
    status: 'PUBLISHED',
    featured: false,
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
    setLoadingNews(true);
    api.communityNews.listByCommunity(community.id, activeType !== 'All' ? { type: activeType } : undefined)
      .then((data) => setNews(Array.isArray(data) ? data : []))
      .catch(() => setNews([]))
      .finally(() => setLoadingNews(false));
  }, [community, activeType]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!community || !createForm.title.trim() || !createForm.content.trim()) return;
    setCreating(true);
    try {
      await api.communityNews.create({
        communityId: community.id,
        type: createForm.type,
        title: createForm.title.trim(),
        content: createForm.content.trim(),
        status: createForm.status,
        featured: createForm.featured,
      });
      const data = await api.communityNews.listByCommunity(community.id, activeType !== 'All' ? { type: activeType } : undefined);
      setNews(Array.isArray(data) ? data : []);
      setShowCreate(false);
      setCreateForm({ type: 'Announcement', title: '', content: '', status: 'PUBLISHED', featured: false });
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
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">News & Announcements</h1>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {showCreate ? 'Cancel' : '+ Create Post'}
        </button>
      </div>

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
                {NEWS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
              <select
                value={createForm.status}
                onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createForm.featured}
                  onChange={(e) => setCreateForm({ ...createForm, featured: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">Featured</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title</label>
            <input
              type="text"
              value={createForm.title}
              onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
              placeholder="News title"
              required
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Content</label>
            <textarea
              value={createForm.content}
              onChange={(e) => setCreateForm({ ...createForm, content: e.target.value })}
              placeholder="Write your news content..."
              required
              rows={6}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating || !createForm.title.trim() || !createForm.content.trim()}
              className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {creating ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </form>
      )}

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        {['All', ...NEWS_TYPES].map((type) => (
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

      {loadingNews ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        </div>
      ) : news.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <svg className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">No news posts yet.</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Share the first announcement with your community.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {news.map((item: any) => (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${TYPE_COLORS[item.type] || TYPE_COLORS.General}`}>
                      {item.type}
                    </span>
                    {item.status && (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_COLORS[item.status] || ''}`}>
                        {item.status}
                      </span>
                    )}
                    {item.featured && (
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-semibold text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Featured</span>
                    )}
                  </div>
                  {item.createdAt && (
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{formatDate(item.createdAt)}</p>
                  )}
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{item.content}</p>
              {item.author && (
                <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                    {item.author.firstName?.charAt(0) || item.author.name?.charAt(0) || 'A'}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{item.author.firstName ? `${item.author.firstName} ${item.author.lastName || ''}` : item.author.name || 'Anonymous'}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
