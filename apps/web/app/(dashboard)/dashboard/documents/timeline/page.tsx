'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';

export default function DocumentTimelinePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) loadTimeline();
  }, [user, filter]);

  async function loadTimeline() {
    setLoading(true);
    try {
      const data = await api.documentVault.list({ sortBy: 'historicalDate', sortOrder: 'desc', limit: '100' });
      setDocuments(data?.documents || []);
    } catch (e) {
      if (process.env.NODE_ENV === 'development') {
        console.error(e);
      }
    }
    setLoading(false);
  }

  if (authLoading || !user) return null;

  const typeColors: Record<string, string> = {
    PERSONAL: 'bg-blue-100 text-blue-800', FAMILY: 'bg-emerald-100 text-emerald-800', CLAN: 'bg-purple-100 text-purple-800',
    COMMUNITY: 'bg-indigo-100 text-indigo-800', HISTORICAL: 'bg-amber-100 text-amber-800', CERTIFICATE: 'bg-green-100 text-green-800',
    PHOTOS: 'bg-pink-100 text-pink-800', LETTERS: 'bg-rose-100 text-rose-800', BOOKS: 'bg-slate-100 text-slate-800',
    MAPS: 'bg-teal-100 text-teal-800', OLD_MANUSCRIPTS: 'bg-orange-100 text-orange-800',
  };

  const filtered = filter === 'all' ? documents : documents.filter(d => d.documentType === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Document Timeline</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Documents organized by historical date across your hierarchy</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {['all', 'PERSONAL', 'FAMILY', 'CLAN', 'COMMUNITY', 'HISTORICAL', 'CERTIFICATE', 'PHOTOS', 'OLD_MANUSCRIPTS'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${filter === f ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}>
            {f === 'all' ? 'All Types' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">No documents with dates</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add documents with historical or document dates to see them on the timeline.</p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700" />
          <div className="space-y-6">
            {filtered.map(doc => {
              const date = doc.historicalDate || doc.documentDate || doc.createdAt;
              return (
                <div key={doc.id} className="relative flex items-start gap-4 pl-16">
                  <div className="absolute left-6 top-4 h-4 w-4 rounded-full border-2 border-white bg-emerald-500 shadow dark:border-slate-900" />
                  <div className="flex-1 rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900 dark:text-white">{doc.title}</h3>
                          <span className={`rounded px-2 py-0.5 text-xs font-medium ${typeColors[doc.documentType] || 'bg-slate-100 text-slate-800'}`}>{doc.documentType?.replace('_', ' ')}</span>
                          {doc.verificationStatus === 'VERIFIED' && <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-800">Verified</span>}
                        </div>
                        {doc.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{doc.description}</p>}
                      </div>
                      <time className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
                        {date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'No date'}
                      </time>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
                      {doc.owner && <span>by {doc.owner.name}</span>}
                      {doc.mimeType && <span>{doc.mimeType.split('/')[1]?.toUpperCase()}</span>}
                      {doc.fileSize && <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>}
                      {doc.country && <span>{doc.country}</span>}
                      {doc.city && <span>{doc.city}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
