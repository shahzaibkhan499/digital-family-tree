'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, X, Trash2, Download, BadgeCheck, Upload, Search,
  ChevronDown, Edit3, FolderOpen, AlertCircle,
} from 'lucide-react';
import { FileUploadZone, UploadResult } from './file-upload-zone';

export interface DocumentItem {
  id?: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  fileType: string;
  title?: string;
  description?: string;
  category?: string;
  thumbnailUrl?: string;
  verificationStatus?: string;
}

interface DocumentManagerProps {
  eventId?: string;
  documents: DocumentItem[];
  onChange: (documents: DocumentItem[]) => void;
  maxItems?: number;
}

const CATEGORIES = [
  'Certificates',
  'Government',
  'Historical',
  'Legal',
  'Medical',
  'Academic',
  'Financial',
  'Personal',
  'Other',
];

function formatSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function getDocIcon(fileType: string): string {
  if (fileType.includes('pdf')) return 'ðŸ“„';
  if (fileType.includes('word') || fileType.includes('document')) return 'ðŸ“';
  if (fileType.includes('sheet') || fileType.includes('excel')) return 'ðŸ“Š';
  if (fileType.includes('image')) return 'ðŸ–¼ï¸';
  if (fileType.includes('text')) return 'ðŸ“ƒ';
  return 'ðŸ“';
}

function getVerificationBadge(status?: string) {
  if (status === 'VERIFIED') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
        <BadgeCheck className="h-3 w-3" /> Verified
      </span>
    );
  }
  if (status === 'PENDING') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
        Pending
      </span>
    );
  }
  return null;
}

export function DocumentManager({ eventId, documents, onChange, maxItems = 50 }: DocumentManagerProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<{ index: number; field: 'title' | 'description' } | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<number | null>(null);

  const totalSize = documents.reduce((sum, d) => sum + (d.fileSize || 0), 0);

  const filteredDocs = documents.filter((d) => {
    if (categoryFilter && d.category !== categoryFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (d.title || '').toLowerCase().includes(q) ||
        d.fileName.toLowerCase().includes(q) ||
        (d.description || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleUpload = useCallback(async (files: File[]): Promise<UploadResult[]> => {
    const results: UploadResult[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('auth_token');
      const endpoint = eventId
        ? `/api/nest/timeline/${eventId}/documents/upload`
        : '/api/nest/upload';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
      const data = await res.json();
      results.push({
        url: data.url || data.fileUrl,
        fileName: data.fileName || file.name,
        fileSize: data.fileSize || file.size,
        mimeType: data.mimeType || file.type,
        thumbnailUrl: data.thumbnailUrl,
      });
    }
    return results;
  }, [eventId]);

  const handleUploadComplete = useCallback((results: UploadResult[]) => {
    const newItems: DocumentItem[] = results.map((r) => ({
      fileUrl: r.url,
      fileName: r.fileName,
      fileSize: r.fileSize,
      fileType: r.mimeType,
      title: r.fileName.replace(/\.[^/.]+$/, ''),
      category: 'Other',
    }));
    onChange([...documents, ...newItems]);
  }, [documents, onChange]);

  const updateDoc = (index: number, patch: Partial<DocumentItem>) => {
    const actualIndex = documents.indexOf(filteredDocs[index]);
    if (actualIndex === -1) return;
    const updated = documents.map((d, i) => (i === actualIndex ? { ...d, ...patch } : d));
    onChange(updated);
  };

  const removeDoc = (index: number) => {
    const actualIndex = documents.indexOf(filteredDocs[index]);
    if (actualIndex === -1) return;
    onChange(documents.filter((_, i) => i !== actualIndex));
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-slate-400" />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {documents.length}/{maxItems} documents Â· {formatSize(totalSize)}
          </span>
        </div>
      </div>

      {documents.length < maxItems && (
        <FileUploadZone
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.odt,.ods,.jpg,.jpeg,.png"
          multiple
          maxFiles={maxItems - documents.length}
          maxSize={25}
          onUpload={handleUpload}
          onUploadComplete={handleUploadComplete}
          label="Upload documents"
          description="PDFs, Word docs, spreadsheets, images, and more"
          icon={<Upload className="h-6 w-6" />}
        />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm text-slate-700 placeholder-slate-400 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowCategoryDropdown(showCategoryDropdown === -1 ? null : -1)}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition-colors hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:border-slate-600"
          >
            {categoryFilter || 'All Categories'}
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          {showCategoryDropdown === -1 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 top-full z-10 mt-1 w-48 rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
            >
              <button
                onClick={() => { setCategoryFilter(''); setShowCategoryDropdown(null); }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                All Categories
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => { setCategoryFilter(cat); setShowCategoryDropdown(null); }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {cat}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {filteredDocs.map((doc, index) => (
            <motion.div
              key={doc.id || index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="group rounded-xl border border-slate-200 bg-white/80 backdrop-blur-xl p-4 shadow-sm hover:shadow-md transition-all dark:border-slate-700 dark:bg-slate-900/80"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg dark:bg-slate-800">
                  {getDocIcon(doc.fileType)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {editingField?.index === index && editingField.field === 'title' ? (
                      <input
                        autoFocus
                        defaultValue={doc.title || doc.fileName}
                        onBlur={(e) => updateDoc(index, { title: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') updateDoc(index, { title: (e.target as HTMLInputElement).value });
                          if (e.key === 'Escape') setEditingField(null);
                        }}
                        className="flex-1 rounded-md border border-emerald-300 bg-white px-2 py-0.5 text-sm font-medium text-slate-700 dark:border-emerald-700 dark:bg-slate-800 dark:text-white outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => setEditingField({ index, field: 'title' })}
                        className="flex-1 truncate text-left text-sm font-medium text-slate-700 hover:text-emerald-600 dark:text-slate-300 dark:hover:text-emerald-400 transition-colors"
                      >
                        {doc.title || doc.fileName}
                      </button>
                    )}
                    {getVerificationBadge(doc.verificationStatus)}
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                    <span>{doc.fileName}</span>
                    {doc.fileSize && (
                      <>
                        <span className="text-slate-300 dark:text-slate-600">Â·</span>
                        <span>{formatSize(doc.fileSize)}</span>
                      </>
                    )}
                    {doc.category && (
                      <>
                        <span className="text-slate-300 dark:text-slate-600">Â·</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">{doc.category}</span>
                      </>
                    )}
                  </div>

                  {editingField?.index === index && editingField.field === 'description' ? (
                    <input
                      autoFocus
                      defaultValue={doc.description || ''}
                      onBlur={(e) => updateDoc(index, { description: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') updateDoc(index, { description: (e.target as HTMLInputElement).value });
                        if (e.key === 'Escape') setEditingField(null);
                      }}
                      className="mt-2 w-full rounded-md border border-emerald-300 bg-white px-2 py-0.5 text-xs text-slate-600 dark:border-emerald-700 dark:bg-slate-800 dark:text-slate-300 outline-none"
                      placeholder="Add description..."
                    />
                  ) : (
                    doc.description && (
                      <button
                        onClick={() => setEditingField({ index, field: 'description' })}
                        className="mt-2 block w-full text-left text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      >
                        {doc.description}
                      </button>
                    )
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <div className="relative">
                    <select
                      value={doc.category || 'Other'}
                      onChange={(e) => updateDoc(index, { category: e.target.value })}
                      className="appearance-none rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600 transition-colors focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-500 dark:hover:bg-emerald-900/20 transition-colors"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  )}

                  <button
                    onClick={() => setEditingField(editingField?.index === index && editingField.field === 'description' ? null : { index, field: 'description' })}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-500 dark:hover:bg-blue-900/20 transition-colors"
                    title="Edit description"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => setDeleteConfirm(index)}
                    className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-900/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredDocs.length === 0 && documents.length > 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-8 dark:border-slate-700">
          <Search className="mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No documents match your filters</p>
        </div>
      )}

      {documents.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-8 dark:border-slate-700">
          <FileText className="mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500 dark:text-slate-400">No documents yet</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Upload documents using the zone above</p>
        </div>
      )}

      <AnimatePresence>
        {deleteConfirm !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-xl border border-slate-200 bg-white/90 backdrop-blur-xl p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900/90"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Delete document?</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                This action cannot be undone.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteConfirm !== null && removeDoc(deleteConfirm)}
                  className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
