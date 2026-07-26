'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface Document {
  id: string;
  displayId: string;
  title: string;
  description: string | null;
  documentType: string;
  originalFileName: string | null;
  mimeType: string | null;
  extension: string | null;
  fileSize: number | null;
  pages: number | null;
  language: string | null;
  country: string | null;
  city: string | null;
  historicalDate: string | null;
  documentDate: string | null;
  visibility: string;
  verificationStatus: string;
  tags: string | null;
  keywords: string | null;
  source: string | null;
  ocrStatus: string;
  aiReadyFlag: boolean;
  isFavorite: boolean;
  currentVersion: number;
  storageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  folder: { id: string; name: string } | null;
}

interface VaultStats {
  totalDocuments: number;
  totalSizeMB: number;
  totalSizeBytes: number;
  favoriteCount: number;
  recentCount: number;
  typeBreakdown: { type: string; count: number }[];
  verificationBreakdown: { status: string; count: number }[];
}

interface Folder {
  id: string;
  displayId: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  createdAt: string;
  _count: { documents: number; children: number };
}

interface DocumentsResponse {
  documents: Document[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>{children}</div>;
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700 ${className}`} />;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) { size /= 1024; i++; }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getFileIcon(mimeType: string | null): string {
  if (!mimeType) return 'ðŸ“„';
  if (mimeType.startsWith('image/')) return 'ðŸ–¼ï¸';
  if (mimeType.includes('pdf')) return 'ðŸ“•';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'ðŸ“˜';
  if (mimeType.includes('text')) return 'ðŸ“';
  if (mimeType.startsWith('audio/')) return 'ðŸŽµ';
  if (mimeType.startsWith('video/')) return 'ðŸŽ¬';
  if (mimeType.includes('zip')) return 'ðŸ“¦';
  return 'ðŸ“„';
}

function getVisibilityColor(v: string): string {
  switch (v) {
    case 'PUBLIC': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'COMMUNITY': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'CLAN': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    case 'SUBCLAN': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
    case 'FAMILY': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    case 'ONLY_ME': return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
    default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
  }
}

function getVerificationColor(s: string): string {
  switch (s) {
    case 'VERIFIED': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'PENDING': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'REJECTED': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default: return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
  }
}

export default function DocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<VaultStats | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'documents' | 'folders' | 'shared' | 'deleted'>('documents');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '', description: '', documentType: 'OTHER', visibility: 'ONLY_ME',
    tags: '', keywords: '', source: '', language: '', country: '', city: '',
    historicalDate: '', documentDate: '', familyId: '', clanId: '', communityId: '',
  });
  const [sharedDocs, setSharedDocs] = useState<any[]>([]);
  const [deletedDocs, setDeletedDocs] = useState<Document[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDocuments = useCallback(async (pageNum: number, searchVal: string, replace: boolean) => {
    try {
      const params: Record<string, string> = { page: String(pageNum), limit: '20' };
      if (searchVal) params.search = searchVal;
      if (typeFilter) params.documentType = typeFilter;
      if (visibilityFilter) params.visibility = visibilityFilter;
      if (showFavoritesOnly) params.isFavorite = 'true';
      const res: DocumentsResponse = await api.documentVault.list(params);
      if (replace) {
        setDocuments(res.documents);
      } else {
        setDocuments(prev => [...prev, ...res.documents]);
      }
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch { /* empty */ } finally {
      setLoading(false);
    }
  }, [typeFilter, visibilityFilter, showFavoritesOnly]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setDocuments([]);
    setPage(1);
    fetchDocuments(1, '', true);
    api.documentVault.stats().then(s => setStats(s as VaultStats)).catch(() => {});
    api.documentVault.folders.list().then(f => setFolders(f as Folder[])).catch(() => {});
  }, [user, fetchDocuments]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  useEffect(() => {
    if (user && activeTab === 'documents') {
      setLoading(true);
      setDocuments([]);
      setPage(1);
      fetchDocuments(1, debouncedSearch, true);
    }
  }, [user, debouncedSearch, activeTab, fetchDocuments]);

  const loadMore = () => {
    if (page >= totalPages) return;
    const next = page + 1;
    setPage(next);
    fetchDocuments(next, debouncedSearch, false);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await api.documentVault.folders.create({ name: newFolderName, description: newFolderDesc });
      setShowCreateFolder(false);
      setNewFolderName('');
      setNewFolderDesc('');
      const f = await api.documentVault.folders.list();
      setFolders(f as Folder[]);
    } catch { /* empty */ }
  };

  const handleToggleFavorite = async (docId: string) => {
    try {
      await api.documentVault.favorite(docId);
      setDocuments(prev => prev.map(d => d.id === docId ? { ...d, isFavorite: !d.isFavorite } : d));
    } catch { /* empty */ }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Move this document to trash?')) return;
    try {
      await api.documentVault.remove(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      setTotal(prev => prev - 1);
    } catch { /* empty */ }
  };

  const handlePermanentDelete = async (docId: string) => {
    if (!confirm('Permanently delete this document? This cannot be undone.')) return;
    try {
      await api.documentVault.permanentDelete(docId);
      setDeletedDocs(prev => prev.filter(d => d.id !== docId));
    } catch { /* empty */ }
  };

  const handleRestore = async (docId: string) => {
    try {
      await api.documentVault.restore(docId);
      setDeletedDocs(prev => prev.filter(d => d.id !== docId));
    } catch { /* empty */ }
  };

  const loadTab = async (tab: string) => {
    setActiveTab(tab as any);
    if (tab === 'shared') {
      try {
        const res = await api.documentVault.sharedWithMe();
        setSharedDocs(res as any[]);
      } catch { setSharedDocs([]); }
    } else if (tab === 'deleted') {
      try {
        const res = await api.documentVault.deleted();
        setDeletedDocs(res as Document[]);
      } catch { setDeletedDocs([]); }
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Document Vault</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Your digital heritage archive</p>
        </div>
        <button onClick={() => setShowUploadModal(true)} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">
          + Upload Document
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total Documents</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalDocuments}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Storage Used</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalSizeMB} MB</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Favorites</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.favoriteCount}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">Recent (7d)</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.recentCount}</p>
          </Card>
        </div>
      )}

      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
        {[
          { key: 'documents', label: 'My Documents' },
          { key: 'folders', label: 'Folders' },
          { key: 'shared', label: 'Shared With Me' },
          { key: 'deleted', label: 'Trash' },
        ].map(tab => (
          <button key={tab.key} onClick={() => loadTab(tab.key)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}>{tab.label}</button>
        ))}
      </div>

      {activeTab === 'documents' && (
        <>
          <div className="flex flex-wrap gap-3">
            <input type="text" placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-[200px] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
              <option value="">All Types</option>
              <option value="PERSONAL">Personal</option>
              <option value="FAMILY">Family</option>
              <option value="CLAN">Clan</option>
              <option value="COMMUNITY">Community</option>
              <option value="HISTORICAL">Historical</option>
              <option value="GENEALOGY_RECORDS">Genealogy</option>
              <option value="CERTIFICATE">Certificate</option>
              <option value="PHOTOS">Photos</option>
              <option value="AUDIO">Audio</option>
              <option value="VIDEO">Video</option>
              <option value="LEGAL_DOCUMENTS">Legal</option>
              <option value="OTHER">Other</option>
            </select>
            <select value={visibilityFilter} onChange={e => setVisibilityFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
              <option value="">All Visibility</option>
              <option value="ONLY_ME">Only Me</option>
              <option value="FAMILY">Family</option>
              <option value="SUBCLAN">SubClan</option>
              <option value="CLAN">Clan</option>
              <option value="COMMUNITY">Community</option>
              <option value="PUBLIC">Public</option>
            </select>
            <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium border transition-colors ${
                showFavoritesOnly ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}>â˜… Favorites</button>
            <div className="flex rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
              <button onClick={() => setViewMode('grid')} className={`px-3 py-2.5 text-sm ${viewMode === 'grid' ? 'text-emerald-600' : 'text-slate-400'}`}>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              </button>
              <button onClick={() => setViewMode('list')} className={`px-3 py-2.5 text-sm ${viewMode === 'list' ? 'text-emerald-600' : 'text-slate-400'}`}>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>
          </div>

          <p className="text-sm text-slate-500 dark:text-slate-400">{total} document{total !== 1 ? 's' : ''}</p>

          {loading ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}>
              {[...Array(6)].map((_, i) => <Skeleton key={i} className={viewMode === 'grid' ? 'h-48' : 'h-16'} />)}
            </div>
          ) : documents.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-4xl mb-4">ðŸ“</div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">No documents yet</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Upload your first document to start building your digital heritage vault.</p>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {documents.map(doc => (
                <Card key={doc.id} className="group overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex h-32 items-center justify-center bg-slate-50 dark:bg-slate-800/50">
                    <span className="text-5xl">{getFileIcon(doc.mimeType)}</span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate flex-1">{doc.title}</h3>
                      <button onClick={() => handleToggleFavorite(doc.id)} className={`shrink-0 text-lg ${doc.isFavorite ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'}`}>
                        {doc.isFavorite ? 'â˜…' : 'â˜†'}
                      </button>
                    </div>
                    {doc.description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{doc.description}</p>}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getVisibilityColor(doc.visibility)}`}>{doc.visibility.replace('_', ' ')}</span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${getVerificationColor(doc.verificationStatus)}`}>{doc.verificationStatus}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
                      <span>{doc.originalFileName || doc.documentType}</span>
                      <span>{formatFileSize(doc.fileSize)} {doc.currentVersion > 1 ? `Â· v${doc.currentVersion}` : ''}</span>
                    </div>
                    {doc.folder && <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">ðŸ“ {doc.folder.name}</p>}
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => handleDelete(doc.id)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">Trash</button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map(doc => (
                <Card key={doc.id} className="flex items-center gap-4 p-4 hover:shadow-md transition-shadow">
                  <span className="text-2xl">{getFileIcon(doc.mimeType)}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">{doc.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{doc.originalFileName || doc.documentType} Â· {formatFileSize(doc.fileSize)}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getVisibilityColor(doc.visibility)}`}>{doc.visibility.replace('_', ' ')}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getVerificationColor(doc.verificationStatus)}`}>{doc.verificationStatus}</span>
                  <button onClick={() => handleToggleFavorite(doc.id)} className={`text-lg ${doc.isFavorite ? 'text-amber-500' : 'text-slate-300'}`}>{doc.isFavorite ? 'â˜…' : 'â˜†'}</button>
                  <button onClick={() => handleDelete(doc.id)} className="text-red-500 hover:text-red-700 text-sm">ðŸ—‘</button>
                </Card>
              ))}
            </div>
          )}

          {page < totalPages && (
            <div className="flex justify-center pt-4">
              <button onClick={loadMore} className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Load More
              </button>
            </div>
          )}
        </>
      )}

      {activeTab === 'folders' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowCreateFolder(true)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              + New Folder
            </button>
          </div>
          {showCreateFolder && (
            <Card className="p-4">
              <div className="flex gap-3">
                <input type="text" placeholder="Folder name" value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                <input type="text" placeholder="Description (optional)" value={newFolderDesc} onChange={e => setNewFolderDesc(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                <button onClick={handleCreateFolder} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">Create</button>
                <button onClick={() => setShowCreateFolder(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
              </div>
            </Card>
          )}
          {folders.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-4xl mb-4">ðŸ“‚</div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">No folders yet</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create folders to organize your documents.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {folders.map(folder => (
                <Card key={folder.id} className="p-5 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{folder.icon || 'ðŸ“'}</span>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{folder.name}</h3>
                      {folder.description && <p className="text-sm text-slate-500 dark:text-slate-400">{folder.description}</p>}
                    </div>
                  </div>
                  <div className="mt-3 flex gap-4 text-xs text-slate-400 dark:text-slate-500">
                    <span>{folder._count.documents} document{folder._count.documents !== 1 ? 's' : ''}</span>
                    <span>{folder._count.children} subfolder{folder._count.children !== 1 ? 's' : ''}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'shared' && (
        <div className="space-y-3">
          {sharedDocs.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-4xl mb-4">ðŸ”—</div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">No shared documents</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Documents shared with you will appear here.</p>
            </Card>
          ) : (
            sharedDocs.map((share: any) => (
              <Card key={share.id} className="flex items-center gap-4 p-4">
                <span className="text-2xl">{getFileIcon(share.document?.mimeType)}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate">{share.document?.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Shared by {share.sharedBy?.name} Â· {share.permission}</p>
                </div>
                <span className="text-sm text-slate-400">{formatDate(share.createdAt)}</span>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'deleted' && (
        <div className="space-y-3">
          {deletedDocs.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="text-4xl mb-4">ðŸ—‘ï¸</div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">Trash is empty</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Deleted documents will appear here for recovery.</p>
            </Card>
          ) : (
            deletedDocs.map(doc => (
              <Card key={doc.id} className="flex items-center gap-4 p-4">
                <span className="text-2xl opacity-50">{getFileIcon(doc.mimeType)}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate line-through opacity-60">{doc.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Deleted {formatDate(doc.deletedAt)}</p>
                </div>
                <button onClick={() => handleRestore(doc.id)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">Restore</button>
                <button onClick={() => handlePermanentDelete(doc.id)} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">Delete Forever</button>
              </Card>
            ))
          )}
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Upload Document</h2>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Title *</label>
                <input type="text" value={uploadForm.title} onChange={e => setUploadForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea value={uploadForm.description} onChange={e => setUploadForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Document Type</label>
                  <select value={uploadForm.documentType} onChange={e => setUploadForm(p => ({ ...p, documentType: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                    <option value="PERSONAL">Personal</option>
                    <option value="FAMILY">Family</option>
                    <option value="CLAN">Clan</option>
                    <option value="COMMUNITY">Community</option>
                    <option value="HISTORICAL">Historical</option>
                    <option value="GENEALOGY_RECORDS">Genealogy</option>
                    <option value="CERTIFICATE">Certificate</option>
                    <option value="BIRTH_CERTIFICATE">Birth Certificate</option>
                    <option value="DEATH_CERTIFICATE">Death Certificate</option>
                    <option value="MARRIAGE_CERTIFICATE">Marriage Certificate</option>
                    <option value="EDUCATION">Education</option>
                    <option value="EMPLOYMENT">Employment</option>
                    <option value="MILITARY">Military</option>
                    <option value="PROPERTY">Property</option>
                    <option value="RESEARCH_PAPERS">Research</option>
                    <option value="BOOKS">Books</option>
                    <option value="PHOTOS">Photos</option>
                    <option value="LETTERS">Letters</option>
                    <option value="AUDIO">Audio</option>
                    <option value="VIDEO">Video</option>
                    <option value="SCANNED_DOCUMENTS">Scanned</option>
                    <option value="OLD_MANUSCRIPTS">Manuscripts</option>
                    <option value="MAPS">Maps</option>
                    <option value="LEGAL_DOCUMENTS">Legal</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Visibility</label>
                  <select value={uploadForm.visibility} onChange={e => setUploadForm(p => ({ ...p, visibility: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                    <option value="ONLY_ME">Only Me</option>
                    <option value="FAMILY">Family</option>
                    <option value="SUBCLAN">SubClan</option>
                    <option value="CLAN">Clan</option>
                    <option value="COMMUNITY">Community</option>
                    <option value="PUBLIC">Public</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tags</label>
                  <input type="text" value={uploadForm.tags} onChange={e => setUploadForm(p => ({ ...p, tags: e.target.value }))} placeholder="comma-separated"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Keywords</label>
                  <input type="text" value={uploadForm.keywords} onChange={e => setUploadForm(p => ({ ...p, keywords: e.target.value }))} placeholder="comma-separated"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Language</label>
                  <input type="text" value={uploadForm.language} onChange={e => setUploadForm(p => ({ ...p, language: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Country</label>
                  <input type="text" value={uploadForm.country} onChange={e => setUploadForm(p => ({ ...p, country: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Source</label>
                  <input type="text" value={uploadForm.source} onChange={e => setUploadForm(p => ({ ...p, source: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Document Date</label>
                  <input type="date" value={uploadForm.documentDate} onChange={e => setUploadForm(p => ({ ...p, documentDate: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Historical Date</label>
                  <input type="date" value={uploadForm.historicalDate} onChange={e => setUploadForm(p => ({ ...p, historicalDate: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button onClick={() => setShowUploadModal(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">Cancel</button>
              <button onClick={async () => {
                if (!uploadForm.title.trim()) return;
                try {
                  await api.documentVault.create(uploadForm);
                  setShowUploadModal(false);
                  setUploadForm({ title: '', description: '', documentType: 'OTHER', visibility: 'ONLY_ME', tags: '', keywords: '', source: '', language: '', country: '', city: '', historicalDate: '', documentDate: '', familyId: '', clanId: '', communityId: '' });
                  setLoading(true);
                  fetchDocuments(1, '', true);
                  const s = await api.documentVault.stats();
                  setStats(s as VaultStats);
                } catch { /* empty */ }
              }} className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                Create Document
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
