'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';

export default function AdminDocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [storage, setStorage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'storage' | 'verifications'>('all');
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [tab]);

  async function loadData() {
    setLoading(true);
    try {
      if (tab === 'all') {
        const data = await api.documentVault.list();
        setDocuments(data?.documents || data || []);
        const st = await api.documentVault.stats();
        setStats(st);
      } else if (tab === 'storage') {
        const st = await api.documentVault.storageAnalytics();
        setStorage(st);
      } else if (tab === 'verifications') {
        const data = await api.documentVault.list({ verificationStatus: 'PENDING' });
        setDocuments(data?.documents || data || []);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function handleVerify(docId: string, status: string) {
    try {
      await api.documentVault.verifications?.review(docId, { status, notes: `Admin ${status.toLowerCase()}` });
      loadData();
    } catch (e) { console.error(e); }
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Document Vault - Admin</h1>

      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
        {(['all', 'storage', 'verifications'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${tab === t ? 'bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}>
            {t === 'all' ? 'All Documents' : t === 'storage' ? 'Storage Analytics' : 'Verification Queue'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>
      ) : tab === 'storage' && storage ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Storage</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatSize(storage.totalSizeBytes)}</p>
              <p className="text-xs text-slate-400">{storage.totalDocuments} documents</p>
            </div>
          </div>
          {storage.typeBreakdown?.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">By Document Type</h3>
              <div className="space-y-2">
                {storage.typeBreakdown.map((t: any) => (
                  <div key={t.type} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{t.type}</span>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{t.count} docs</span>
                      <span>{formatSize(t.size)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {storage.mimeTypeBreakdown?.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h3 className="mb-3 font-semibold text-slate-900 dark:text-white">By MIME Type</h3>
              <div className="space-y-2">
                {storage.mimeTypeBreakdown.map((m: any) => (
                  <div key={m.mimeType} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                    <span className="text-sm text-slate-700 dark:text-slate-300">{m.mimeType || 'Unknown'}</span>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>{m.count} docs</span>
                      <span>{formatSize(m.size)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {stats && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs text-slate-500">Total</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.totalDocuments}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs text-slate-500">Favorites</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.favoriteCount}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs text-slate-500">Recent (7d)</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.recentCount}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs text-slate-500">Storage</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.totalSizeMB} MB</p>
              </div>
            </div>
          )}
          <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Document</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Visibility</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {documents.map((doc: any) => (
                    <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{doc.title}</p>
                          <p className="text-xs text-slate-500">{doc.displayId}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="rounded bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-800">{doc.documentType}</span></td>
                      <td className="px-4 py-3"><span className={`rounded px-2 py-0.5 text-xs font-medium ${doc.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-800' : doc.verificationStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-800'}`}>{doc.verificationStatus}</span></td>
                      <td className="px-4 py-3 text-xs text-slate-500">{doc.visibility}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{new Date(doc.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => setSelected(doc)} className="rounded px-2 py-1 text-xs text-emerald-600 hover:bg-emerald-50">View</button>
                          <button onClick={() => handleVerify(doc.id, 'VERIFIED')} className="rounded px-2 py-1 text-xs text-green-600 hover:bg-green-50">Approve</button>
                          <button onClick={() => handleVerify(doc.id, 'REJECTED')} className="rounded px-2 py-1 text-xs text-red-600 hover:bg-red-50">Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {documents.length === 0 && (
              <div className="p-12 text-center text-sm text-slate-500">No documents found</div>
            )}
          </div>
        </>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSelected(null)}>
          <div className="mx-4 max-w-2xl rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{selected.title}</h2>
              <button onClick={() => setSelected(null)} className="rounded p-1 text-slate-400 hover:text-slate-600"><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <p><span className="font-medium text-slate-700 dark:text-slate-300">Display ID:</span> {selected.displayId}</p>
              <p><span className="font-medium text-slate-700 dark:text-slate-300">Type:</span> {selected.documentType}</p>
              <p><span className="font-medium text-slate-700 dark:text-slate-300">Status:</span> {selected.verificationStatus}</p>
              <p><span className="font-medium text-slate-700 dark:text-slate-300">Visibility:</span> {selected.visibility}</p>
              <p><span className="font-medium text-slate-700 dark:text-slate-300">Size:</span> {selected.fileSize ? `${(selected.fileSize / 1024).toFixed(1)} KB` : 'Unknown'}</p>
              {selected.description && <p><span className="font-medium text-slate-700 dark:text-slate-300">Description:</span> {selected.description}</p>}
              {selected.tags && <p><span className="font-medium text-slate-700 dark:text-slate-300">Tags:</span> {selected.tags}</p>}
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => { handleVerify(selected.id, 'VERIFIED'); setSelected(null); }} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">Approve</button>
              <button onClick={() => { handleVerify(selected.id, 'REJECTED'); setSelected(null); }} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Reject</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
