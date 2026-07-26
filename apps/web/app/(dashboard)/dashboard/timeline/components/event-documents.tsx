'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, File, Image, Film, Music, Plus, Pencil, Trash2, X, Check, Eye,
  Download, Upload, Grid, List, Search, Shield, ShieldCheck, Clock, AlertTriangle,
  ChevronDown, SlidersHorizontal, CheckSquare, Square, FileImage, FileVideo,
  FileAudio, FileSpreadsheet, Archive, BookOpen, Newspaper, Map, Mail, Stamp,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { formatRelative, formatDate, VISIBILITY_OPTIONS } from './constants';

interface Document {
  id: string;
  title: string;
  description?: string;
  fileName?: string;
  fileType?: string;
  fileUrl?: string;
  category?: string;
  verificationStatus?: string;
  ocrStatus?: string;
  privacy?: string;
  uploadedBy?: string;
  uploadedByName?: string;
  uploadedByAvatar?: string;
  fileSize?: number;
  thumbnailUrl?: string;
  issueDate?: string;
  expiryDate?: string;
  createdAt: string;
}

const DOCUMENT_CATEGORIES = [
  { id: 'all', label: 'All', icon: FileText },
  { id: 'image', label: 'Images', icon: FileImage, extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] },
  { id: 'video', label: 'Videos', icon: FileVideo, extensions: ['mp4', 'mov', 'avi', 'webm'] },
  { id: 'audio', label: 'Audio', icon: FileAudio, extensions: ['mp3', 'wav', 'm4a', 'ogg'] },
  { id: 'pdf', label: 'PDFs', icon: FileText, extensions: ['pdf'] },
  { id: 'document', label: 'Documents', icon: FileText, extensions: ['doc', 'docx', 'txt', 'rtf'] },
  { id: 'scanned', label: 'Scanned', icon: Stamp, extensions: [] },
  { id: 'certificate', label: 'Certificates', icon: Shield, extensions: [] },
  { id: 'government', label: 'Government', icon: ShieldCheck, extensions: [] },
  { id: 'historical', label: 'Historical', icon: Archive, extensions: [] },
  { id: 'map', label: 'Maps', icon: Map, extensions: [] },
  { id: 'letter', label: 'Letters', icon: Mail, extensions: [] },
  { id: 'newspaper', label: 'Newspapers', icon: Newspaper, extensions: [] },
];

const CATEGORY_COLORS: Record<string, string> = {
  image: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  video: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  audio: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  pdf: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  document: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  scanned: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  certificate: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  government: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  historical: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  map: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  letter: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  newspaper: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
};

const CATEGORY_ICON_COLORS: Record<string, string> = {
  image: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  video: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
  audio: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  pdf: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
  document: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
  scanned: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400',
  certificate: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
  government: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
  historical: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
  map: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
  letter: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
  newspaper: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
};

const PRIVACY_MAP: Record<string, { label: string; color: string }> = {
  ONLY_ME: { label: 'Only Me', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  FAMILY: { label: 'Family', color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
  SUB_CLAN: { label: 'SubClan', color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
  CLAN: { label: 'Clan', color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
  COMMUNITY: { label: 'Community', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
  PUBLIC: { label: 'Public', color: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
};

const VERIFICATION_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  VERIFIED: { label: 'Verified', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: ShieldCheck },
  PENDING: { label: 'Pending', color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
  REJECTED: { label: 'Rejected', color: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400', icon: AlertTriangle },
  UNVERIFIED: { label: 'Unverified', color: 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400', icon: Clock },
};

type SortKey = 'date' | 'name' | 'type';

function detectCategory(doc: Document): string {
  const ext = (doc.fileType || doc.fileName?.split('.').pop() || '').toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) return 'image';
  if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'm4a', 'ogg', 'flac'].includes(ext)) return 'audio';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) return 'document';
  return doc.category || 'document';
}

function getCategoryIcon(cat: string) {
  const found = DOCUMENT_CATEGORIES.find(c => c.id === cat);
  return found?.icon || File;
}

function formatFileSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function DocumentSkeleton({ view }: { view: 'grid' | 'list' }) {
  if (view === 'list') {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-slate-200 dark:bg-slate-700 shrink-0" />
            <div className="flex-1 space-y-2"><div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-700" /><div className="h-3 w-1/4 rounded bg-slate-100 dark:bg-slate-800" /></div>
            <div className="h-6 w-16 rounded-full bg-slate-100 dark:bg-slate-800" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="h-32 rounded-lg bg-slate-200 dark:bg-slate-700 mb-3" />
          <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-slate-700 mb-2" />
          <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
      ))}
    </div>
  );
}

export default function EventDocuments({ eventId, isOwner }: { eventId: string; isOwner: boolean }) {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState<SortKey>('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailDoc, setDetailDoc] = useState<Document | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '', description: '', fileName: '', fileType: 'certificate',
    fileUrl: '', category: 'document', privacy: 'FAMILY', issueDate: '', expiryDate: '',
  });

  const [editForm, setEditForm] = useState({
    title: '', description: '', verificationStatus: '', category: 'document', privacy: 'FAMILY',
  });

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await api.timeline.getDocuments(eventId);
      setDocuments(Array.isArray(res?.documents) ? res.documents : []);
    } catch { /* empty */ } finally { setLoading(false); }
  }, [eventId]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const resetForm = () => {
    setForm({ title: '', description: '', fileName: '', fileType: 'certificate', fileUrl: '', category: 'document', privacy: 'FAMILY', issueDate: '', expiryDate: '' });
    setShowForm(false);
    setUploadProgress(0);
  };

  const handleAdd = async () => {
    if (!form.title.trim() || saving) return;
    setSaving(true);
    setUploadProgress(30);
    try {
      setUploadProgress(60);
      await api.timeline.addDocument(eventId, {
        title: form.title.trim(), description: form.description.trim(),
        fileName: form.fileName.trim(), fileType: form.fileType, fileUrl: form.fileUrl.trim(),
        category: form.category, privacy: form.privacy,
        issueDate: form.issueDate || undefined, expiryDate: form.expiryDate || undefined,
      });
      setUploadProgress(100);
      resetForm();
      await fetchDocuments();
    } catch { /* empty */ } finally { setSaving(false); setUploadProgress(0); }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const ext = file.name.split('.').pop() || '';
      setForm(f => ({ ...f, fileName: file.name, title: f.title || file.name.replace(/\.[^.]+$/, ''), fileType: ext }));
      setShowForm(true);
    }
  };

  const startEdit = (doc: Document) => {
    setEditingId(doc.id);
    setEditForm({
      title: doc.title || '', description: doc.description || '',
      verificationStatus: doc.verificationStatus || 'UNVERIFIED',
      category: doc.category || detectCategory(doc), privacy: doc.privacy || 'FAMILY',
    });
  };

  const handleUpdate = async (docId: string) => {
    if (saving) return; setSaving(true);
    try {
      await api.timeline.updateDocument(docId, {
        title: editForm.title.trim(), description: editForm.description.trim(),
        verificationStatus: editForm.verificationStatus, category: editForm.category, privacy: editForm.privacy,
      });
      setEditingId(null); await fetchDocuments();
    } catch { /* empty */ } finally { setSaving(false); }
  };

  const handleDelete = async (docId: string) => {
    try {
      await api.timeline.removeDocument(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      setDeleteConfirm(null); setSelectedIds(prev => { const n = new Set(prev); n.delete(docId); return n; });
    } catch { /* empty */ }
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) { try { await api.timeline.removeDocument(id); } catch { /* empty */ } }
    setDocuments(prev => prev.filter(d => !selectedIds.has(d.id)));
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredDocs.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredDocs.map(d => d.id)));
  };

  const filteredDocs = documents
    .filter(d => {
      if (activeCategory !== 'all') {
        const cat = detectCategory(d);
        if (cat !== activeCategory) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (d.title?.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q) || d.fileName?.toLowerCase().includes(q));
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'type') return detectCategory(a).localeCompare(detectCategory(b));
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const inputCls = "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500";
  const selectCls = "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Documents</span>
          {documents.length > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">{documents.length}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300" title={viewMode === 'grid' ? 'List view' : 'Grid view'}>
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </button>
          {isOwner && (
            <button onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors">
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Search + Sort + Filters bar */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search documents..." className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-700 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
          </div>
          <div className="relative">
            <button onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              <SlidersHorizontal className="h-3 w-3" /> {sortBy === 'date' ? 'Date' : sortBy === 'name' ? 'Name' : 'Type'}
              <ChevronDown className="h-3 w-3" />
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-full z-20 mt-1 w-32 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {(['date', 'name', 'type'] as SortKey[]).map(s => (
                  <button key={s} onClick={() => { setSortBy(s); setShowSortMenu(false); }}
                    className={`flex w-full items-center px-3 py-1.5 text-xs ${sortBy === s ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
                    {s === 'date' ? 'Date' : s === 'name' ? 'Name' : 'Type'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category tabs */}
        <div className="mb-4 flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          {DOCUMENT_CATEGORIES.map(cat => {
            const CatIcon = cat.icon;
            const count = cat.id === 'all' ? documents.length : documents.filter(d => detectCategory(d) === cat.id).length;
            if (cat.id !== 'all' && count === 0) return null;
            return (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                }`}>
                <CatIcon className="h-3 w-3" /> {cat.label}
                <span className="ml-0.5 rounded-full bg-white/20 px-1 text-[10px]">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Bulk actions bar */}
        {selectedIds.size > 0 && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 dark:bg-emerald-900/20">
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{selectedIds.size} selected</span>
            <button onClick={handleBulkDelete}
              className="ml-auto flex items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-rose-700">
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </div>
        )}

        {/* Drop zone */}
        {isOwner && dragOver && (
          <div className="mb-4 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50 p-8 text-center dark:bg-emerald-900/10">
            <Upload className="mx-auto h-8 w-8 text-emerald-500" />
            <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">Drop file to upload</p>
          </div>
        )}

        {/* Drag wrapper */}
        <div onDragEnter={e => { e.preventDefault(); setDragOver(true); }}
          onDragOver={e => e.preventDefault()}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}>

          {/* Add form */}
          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Add New Document</h4>
                    <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="h-4 w-4" /></button>
                  </div>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  )}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">Title <span className="text-rose-500">*</span></label>
                      <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Document title" className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">File Name</label>
                      <input value={form.fileName} onChange={e => setForm(f => ({ ...f, fileName: e.target.value }))} placeholder="e.g. birth-certificate.pdf" className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">Category</label>
                      <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={selectCls}>
                        {DOCUMENT_CATEGORIES.filter(c => c.id !== 'all').map(c => (
                          <option key={c.id} value={c.id}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">File URL</label>
                      <input value={form.fileUrl} onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))} placeholder="https://..." className={inputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">Description</label>
                      <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Optional description" className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">Issue Date</label>
                      <input type="date" value={form.issueDate} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">Expiry Date</label>
                      <input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">Privacy</label>
                      <select value={form.privacy} onChange={e => setForm(f => ({ ...f, privacy: e.target.value }))} className={selectCls}>
                        {VISIBILITY_OPTIONS.map(v => (<option key={v.value} value={v.value}>{v.label}</option>))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button onClick={resetForm} className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400">Cancel</button>
                    <button onClick={handleAdd} disabled={!form.title.trim() || saving}
                      className="flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                      {saving ? 'Saving...' : 'Save Document'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Document list/grid */}
          {loading ? (
            <DocumentSkeleton view={viewMode} />
          ) : filteredDocs.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
              <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
                {documents.length === 0 ? 'No documents attached yet.' : 'No documents match your filters.'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence>
                {filteredDocs.map(doc => {
                  const cat = detectCategory(doc);
                  const CatIcon = getCategoryIcon(cat);
                  const isEditing = editingId === doc.id;
                  const privacyConf = PRIVACY_MAP[doc.privacy || 'FAMILY'];
                  const verConf = VERIFICATION_CONFIG[doc.verificationStatus || 'UNVERIFIED'];
                  const VerIcon = verConf?.icon || Clock;
                  const isImage = cat === 'image';
                  const isSelected = selectedIds.has(doc.id);

                  return (
                    <motion.div key={doc.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                      className={`relative rounded-xl border bg-white p-4 transition-shadow hover:shadow-md dark:bg-slate-900 ${
                        isSelected ? 'border-emerald-400 ring-1 ring-emerald-400 dark:border-emerald-500' : 'border-slate-200 dark:border-slate-800'
                      }`}>
                      {/* Select checkbox */}
                      {selectedIds.size > 0 && (
                        <button onClick={() => toggleSelect(doc.id)}
                          className="absolute right-2 top-2 z-10 rounded p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800">
                          {isSelected ? <CheckSquare className="h-4 w-4 text-emerald-600" /> : <Square className="h-4 w-4 text-slate-400" />}
                        </button>
                      )}

                      {isEditing ? (
                        <div className="space-y-2">
                          <input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} className={inputCls} />
                          <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={2} className={inputCls} />
                          <select value={editForm.verificationStatus} onChange={e => setEditForm(f => ({ ...f, verificationStatus: e.target.value }))} className={selectCls}>
                            <option value="UNVERIFIED">Unverified</option>
                            <option value="PENDING">Pending</option>
                            <option value="VERIFIED">Verified</option>
                            <option value="REJECTED">Rejected</option>
                          </select>
                          <select value={editForm.privacy} onChange={e => setEditForm(f => ({ ...f, privacy: e.target.value }))} className={selectCls}>
                            {VISIBILITY_OPTIONS.map(v => (<option key={v.value} value={v.value}>{v.label}</option>))}
                          </select>
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingId(null)} className="rounded-md px-2 py-1 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400">Cancel</button>
                            <button onClick={() => handleUpdate(doc.id)} disabled={saving} className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                              {saving ? 'Saving...' : 'Save'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Thumbnail */}
                          {isImage && (doc.thumbnailUrl || doc.fileUrl) && (
                            <div className="mb-3 h-32 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                              <img src={doc.thumbnailUrl || doc.fileUrl} alt={doc.title}
                                className="h-full w-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            </div>
                          )}

                          {/* Icon + Title */}
                          <div className="flex items-start gap-2.5">
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${CATEGORY_ICON_COLORS[cat] || 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                              <CatIcon className="h-4.5 w-4.5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{doc.title}</h4>
                              {doc.description && (
                                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{doc.description}</p>
                              )}
                            </div>
                          </div>

                          {/* Badges */}
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[cat] || 'bg-slate-100 text-slate-600'}`}>
                              {DOCUMENT_CATEGORIES.find(c => c.id === cat)?.label || cat}
                            </span>
                            <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${verConf?.color || ''}`}>
                              <VerIcon className="h-3 w-3" /> {verConf?.label || 'Unverified'}
                            </span>
                            {doc.ocrStatus && doc.ocrStatus !== 'NOT_APPLICABLE' && (
                              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                OCR: {doc.ocrStatus === 'PROCESSED' ? 'Processed' : 'Pending'}
                              </span>
                            )}
                            {privacyConf && (
                              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${privacyConf.color}`}>{privacyConf.label}</span>
                            )}
                          </div>

                          {/* Meta */}
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <div className="h-5 w-5 shrink-0 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                                {doc.uploadedByAvatar ? (
                                  <img src={doc.uploadedByAvatar} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[8px] font-medium text-emerald-700 dark:text-emerald-400">
                                    {(doc.uploadedByName || 'U')[0].toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">{doc.uploadedByName || 'Unknown'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                              {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
                              <span>{formatRelative(doc.createdAt)}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="mt-2.5 flex items-center gap-1 border-t border-slate-100 pt-2 dark:border-slate-800">
                            <button onClick={() => setDetailDoc(doc)}
                              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300">
                              <Eye className="h-3 w-3" /> View
                            </button>
                            {doc.fileUrl && (
                              <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300">
                                <Download className="h-3 w-3" /> Download
                              </a>
                            )}
                            {isOwner && (
                              <>
                                <button onClick={() => startEdit(doc)}
                                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300">
                                  <Pencil className="h-3 w-3" /> Edit
                                </button>
                                <button onClick={() => setDeleteConfirm(doc.id)}
                                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 dark:hover:text-rose-400">
                                  <Trash2 className="h-3 w-3" /> Delete
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            /* List view */
            <div className="space-y-2">
              {/* Select all in list */}
              {filteredDocs.length > 0 && (
                <button onClick={toggleSelectAll}
                  className="flex items-center gap-2 rounded-lg px-2 py-1 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  {selectedIds.size === filteredDocs.length
                    ? <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
                    : <Square className="h-3.5 w-3.5" />}
                  Select all
                </button>
              )}
              <AnimatePresence>
                {filteredDocs.map(doc => {
                  const cat = detectCategory(doc);
                  const CatIcon = getCategoryIcon(cat);
                  const isEditing = editingId === doc.id;
                  const privacyConf = PRIVACY_MAP[doc.privacy || 'FAMILY'];
                  const verConf = VERIFICATION_CONFIG[doc.verificationStatus || 'UNVERIFIED'];
                  const VerIcon = verConf?.icon || Clock;
                  const isSelected = selectedIds.has(doc.id);

                  return (
                    <motion.div key={doc.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className={`flex items-center gap-3 rounded-xl border p-3 transition-all hover:shadow-sm dark:bg-slate-900 ${
                        isSelected ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-slate-200 bg-white dark:border-slate-800'
                      }`}>
                      {selectedIds.size > 0 && (
                        <button onClick={() => toggleSelect(doc.id)} className="shrink-0">
                          {isSelected ? <CheckSquare className="h-4 w-4 text-emerald-600" /> : <Square className="h-4 w-4 text-slate-400" />}
                        </button>
                      )}
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${CATEGORY_ICON_COLORS[cat] || 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        <CatIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{doc.title}</h4>
                        <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                          <span>{formatRelative(doc.createdAt)}</span>
                          {doc.fileSize && <span>{formatFileSize(doc.fileSize)}</span>}
                          {doc.uploadedByName && <span>{doc.uploadedByName}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${verConf?.color || ''}`}>
                          {verConf?.label}
                        </span>
                        {privacyConf && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${privacyConf.color}`}>{privacyConf.label}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button onClick={() => setDetailDoc(doc)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"><Eye className="h-3.5 w-3.5" /></button>
                        {doc.fileUrl && (
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"><Download className="h-3.5 w-3.5" /></a>
                        )}
                        {isOwner && (
                          <>
                            <button onClick={() => startEdit(doc)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => setDeleteConfirm(doc.id)} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20"><Trash2 className="h-3.5 w-3.5" /></button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {detailDoc && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDetailDoc(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{detailDoc.title}</h3>
                <button onClick={() => setDetailDoc(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="h-5 w-5" /></button>
              </div>
              {detailDoc.description && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{detailDoc.description}</p>
              )}
              {detectCategory(detailDoc) === 'image' && (detailDoc.thumbnailUrl || detailDoc.fileUrl) && (
                <img src={detailDoc.thumbnailUrl || detailDoc.fileUrl} alt={detailDoc.title}
                  className="mt-4 w-full rounded-lg object-cover max-h-64" />
              )}
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-slate-400">Category:</span> <span className="ml-1 font-medium text-slate-700 dark:text-slate-300">{DOCUMENT_CATEGORIES.find(c => c.id === detectCategory(detailDoc))?.label}</span></div>
                <div><span className="text-slate-400">Status:</span> <span className="ml-1 font-medium text-slate-700 dark:text-slate-300">{VERIFICATION_CONFIG[detailDoc.verificationStatus || 'UNVERIFIED']?.label}</span></div>
                {detailDoc.fileSize && <div><span className="text-slate-400">Size:</span> <span className="ml-1 font-medium text-slate-700 dark:text-slate-300">{formatFileSize(detailDoc.fileSize)}</span></div>}
                <div><span className="text-slate-400">Added:</span> <span className="ml-1 font-medium text-slate-700 dark:text-slate-300">{formatDate(detailDoc.createdAt)}</span></div>
                <div><span className="text-slate-400">By:</span> <span className="ml-1 font-medium text-slate-700 dark:text-slate-300">{detailDoc.uploadedByName || 'Unknown'}</span></div>
                {detailDoc.issueDate && <div><span className="text-slate-400">Issued:</span> <span className="ml-1 font-medium text-slate-700 dark:text-slate-300">{formatDate(detailDoc.issueDate)}</span></div>}
                {detailDoc.expiryDate && <div><span className="text-slate-400">Expires:</span> <span className="ml-1 font-medium text-slate-700 dark:text-slate-300">{formatDate(detailDoc.expiryDate)}</span></div>}
              </div>
              <div className="mt-4 flex gap-2">
                {detailDoc.fileUrl && (
                  <a href={detailDoc.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700">
                    <Download className="h-3.5 w-3.5" /> Download
                  </a>
                )}
                <button onClick={() => setDetailDoc(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800">Close</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
              onClick={e => e.stopPropagation()}>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Delete Document?</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setDeleteConfirm(null)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-rose-700">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input for drag-and-drop area */}
      <input ref={fileInputRef} type="file" className="hidden" />
    </div>
  );
}
