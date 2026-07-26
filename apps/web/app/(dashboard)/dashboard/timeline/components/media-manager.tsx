'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid, List, Download, Trash2, Play, Pause, Volume2,
  Image as ImageIcon, Film, Music, FileText, Star,
  Check, X, ArrowUpDown, Filter, Upload, HardDrive,
} from 'lucide-react';
import { FileUploadZone, UploadResult } from './file-upload-zone';
import { api } from '@/lib/api-client';

export interface MediaItem {
  id?: string;
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  caption?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  thumbnailUrl?: string;
  isFeatured?: boolean;
  order?: number;
}

interface MediaManagerProps {
  eventId?: string;
  media: MediaItem[];
  onChange: (media: MediaItem[]) => void;
  maxItems?: number;
  maxStorageMB?: number;
}

function formatSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function detectMediaType(mimeType: string): MediaItem['type'] {
  if (mimeType.startsWith('video/')) return 'VIDEO';
  if (mimeType.startsWith('audio/')) return 'AUDIO';
  if (mimeType.startsWith('image/')) return 'IMAGE';
  return 'DOCUMENT';
}

function getTypeIcon(type: MediaItem['type']) {
  switch (type) {
    case 'VIDEO': return <Film className="h-5 w-5" />;
    case 'AUDIO': return <Music className="h-5 w-5" />;
    case 'DOCUMENT': return <FileText className="h-5 w-5" />;
    default: return <ImageIcon className="h-5 w-5" />;
  }
}

function getTypeBadgeClasses(type: MediaItem['type']) {
  switch (type) {
    case 'VIDEO': return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
    case 'AUDIO': return 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400';
    case 'DOCUMENT': return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400';
    default: return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400';
  }
}

type FilterTab = 'ALL' | 'IMAGE' | 'VIDEO' | 'AUDIO';
type SortOption = 'date' | 'name' | 'size' | 'type';

const FILTER_TABS: { key: FilterTab; label: string; icon: React.ReactNode }[] = [
  { key: 'ALL', label: 'All', icon: <Filter className="h-3.5 w-3.5" /> },
  { key: 'IMAGE', label: 'Images', icon: <ImageIcon className="h-3.5 w-3.5" /> },
  { key: 'VIDEO', label: 'Videos', icon: <Film className="h-3.5 w-3.5" /> },
  { key: 'AUDIO', label: 'Audio', icon: <Music className="h-3.5 w-3.5" /> },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'date', label: 'Date' },
  { value: 'name', label: 'Name' },
  { value: 'size', label: 'Size' },
  { value: 'type', label: 'Type' },
];

export function MediaManager({ eventId, media, onChange, maxItems = 50, maxStorageMB = 500 }: MediaManagerProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<FilterTab>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [playingId, setPlayingId] = useState<string | null>(null);

  const filteredMedia = useMemo(() => {
    let items = [...media];
    if (filterType !== 'ALL') items = items.filter((m) => m.type === filterType);
    items.sort((a, b) => {
      switch (sortBy) {
        case 'name': return (a.fileName || '').localeCompare(b.fileName || '');
        case 'size': return (b.fileSize || 0) - (a.fileSize || 0);
        case 'type': return a.type.localeCompare(b.type);
        default: return (a.order ?? 0) - (b.order ?? 0);
      }
    });
    return items;
  }, [media, filterType, sortBy]);

  const totalSize = useMemo(() => media.reduce((acc, m) => acc + (m.fileSize || 0), 0), [media]);
  const totalSizeMB = totalSize / (1024 * 1024);
  const storagePercent = Math.min((totalSizeMB / maxStorageMB) * 100, 100);

  const typeCounts = useMemo(() => ({
    ALL: media.length,
    IMAGE: media.filter((m) => m.type === 'IMAGE').length,
    VIDEO: media.filter((m) => m.type === 'VIDEO').length,
    AUDIO: media.filter((m) => m.type === 'AUDIO').length,
  }), [media]);

  const handleUpload = useCallback(async (files: File[]): Promise<UploadResult[]> => {
    if (!eventId) return [];
    const results: UploadResult[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('auth_token');
      const endpoint = `/api/nest/timeline/${eventId}/media/upload`;
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
    const newItems: MediaItem[] = results.map((r, i) => ({
      url: r.url,
      type: detectMediaType(r.mimeType),
      fileName: r.fileName,
      fileSize: r.fileSize,
      mimeType: r.mimeType,
      thumbnailUrl: r.thumbnailUrl,
      order: media.length + i,
    }));
    onChange([...media, ...newItems]);
  }, [media, onChange]);

  const handleDelete = (index: number) => {
    const item = filteredMedia[index];
    const realIndex = media.findIndex((m) => m.url === item.url);
    if (realIndex === -1) return;
    onChange(media.filter((_, i) => i !== realIndex));
  };

  const toggleSelect = (url: string) => {
    const next = new Set(selectedIds);
    if (next.has(url)) next.delete(url);
    else next.add(url);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredMedia.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMedia.map((m) => m.url)));
    }
  };

  const handleBulkDelete = () => {
    const updated = media.filter((m) => !selectedIds.has(m.url));
    onChange(updated);
    setSelectedIds(new Set());
  };

  const handleBulkDownload = () => {
    media
      .filter((m) => selectedIds.has(m.url))
      .forEach((m) => window.open(m.url, '_blank'));
  };

  const toggleFeatured = (url: string) => {
    const updated = media.map((m) =>
      m.url === url ? { ...m, isFeatured: !m.isFeatured } : m
    );
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Media ({media.length}/{maxItems})
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <HardDrive className="h-3.5 w-3.5" />
            <span>{totalSizeMB.toFixed(1)} MB / {maxStorageMB} MB</span>
          </div>
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className={`h-full rounded-full transition-all ${
                storagePercent > 90 ? 'bg-red-500' : storagePercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${storagePercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Type filter tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50/50 p-1 dark:border-slate-700 dark:bg-slate-800/50">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              filterType === tab.key
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
            }`}
          >
            {tab.icon}
            {tab.label}
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium dark:bg-slate-600">
              {typeCounts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Bulk actions bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 dark:border-emerald-800 dark:bg-emerald-900/20"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={selectAll}
                className="flex h-5 w-5 items-center justify-center rounded border border-emerald-500 bg-emerald-500 text-white"
              >
                <Check className="h-3 w-3" />
              </button>
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                {selectedIds.size} selected
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBulkDownload}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload zone */}
      {media.length < maxItems && (
        <FileUploadZone
          accept="image/*,video/*,audio/*"
          multiple
          maxFiles={maxItems - media.length}
          maxSize={50}
          onUpload={handleUpload}
          onUploadComplete={handleUploadComplete}
          label="Upload Media"
          description="Drag & drop files or click to browse"
        />
      )}

      {/* Empty state */}
      {filteredMedia.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 py-16 dark:border-slate-700">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <ImageIcon className="h-8 w-8 text-slate-400" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {filterType !== 'ALL' ? `No ${filterType.toLowerCase()} found` : 'No media yet'}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {filterType !== 'ALL'
              ? 'Try switching to a different filter or upload new files.'
              : 'Upload images, videos, or audio files to get started.'}
          </p>
          {media.length < maxItems && filterType === 'ALL' && (
            <button
              onClick={() => document.querySelector<HTMLInputElement>('[role="button"]')?.click()}
              className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              <Upload className="h-4 w-4" /> Upload Media
            </button>
          )}
        </div>
      )}

      {/* Grid view */}
      {filteredMedia.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {filteredMedia.map((item, idx) => (
            <div
              key={item.url + idx}
              className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
            >
              {/* Selection checkbox */}
              <button
                onClick={() => toggleSelect(item.url)}
                className={`absolute left-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded border transition-all ${
                  selectedIds.has(item.url)
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-white/60 bg-black/20 text-white opacity-0 group-hover:opacity-100'
                }`}
              >
                {selectedIds.has(item.url) && <Check className="h-3 w-3" />}
              </button>

              {/* Featured badge */}
              {item.isFeatured && (
                <div className="absolute right-2 top-2 z-10 rounded-full bg-amber-500 p-1">
                  <Star className="h-3 w-3 fill-white text-white" />
                </div>
              )}

              {/* Preview */}
              <div className="aspect-square bg-slate-100 dark:bg-slate-700">
                {item.type === 'IMAGE' ? (
                  <img
                    src={item.thumbnailUrl || item.url}
                    alt={item.caption || item.fileName || ''}
                    className="h-full w-full object-cover"
                  />
                ) : item.type === 'VIDEO' ? (
                  <div className="flex h-full w-full items-center justify-center bg-slate-900">
                    {playingId === item.url ? (
                      <video
                        src={item.url}
                        controls
                        autoPlay
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <button
                        onClick={() => setPlayingId(item.url)}
                        className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900"
                      >
                        <div className="rounded-full bg-white/90 p-3 shadow-lg transition-transform hover:scale-110">
                          <Play className="h-6 w-6 fill-slate-900 text-slate-900" />
                        </div>
                      </button>
                    )}
                  </div>
                ) : item.type === 'AUDIO' ? (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-purple-900/40 to-purple-800/20 p-3">
                    {playingId === item.url ? (
                      <audio src={item.url} controls autoPlay className="w-full" />
                    ) : (
                      <button
                        onClick={() => setPlayingId(item.url)}
                        className="flex flex-col items-center gap-2"
                      >
                        <div className="rounded-full bg-purple-500/20 p-3 transition-transform hover:scale-110">
                          <Play className="h-6 w-6 text-purple-500" />
                        </div>
                        <span className="text-[10px] text-purple-400">Click to play</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <FileText className="h-8 w-8 text-slate-400" />
                  </div>
                )}
              </div>

              {/* Info bar */}
              <div className="p-2">
                <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                  {item.fileName || item.type}
                </p>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${getTypeBadgeClasses(item.type)}`}>
                    {getTypeIcon(item.type)} {item.type}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {item.fileSize ? formatSize(item.fileSize) : ''}
                  </span>
                </div>
              </div>

              {/* Actions overlay */}
              <div className="absolute bottom-20 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => toggleFeatured(item.url)}
                  className={`rounded-lg p-1.5 backdrop-blur-sm transition-colors ${
                    item.isFeatured ? 'bg-amber-500 text-white' : 'bg-black/40 text-white hover:bg-amber-500'
                  }`}
                >
                  <Star className="h-3.5 w-3.5" fill={item.isFeatured ? 'currentColor' : 'none'} />
                </button>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-black/40 p-1.5 text-white backdrop-blur-sm hover:bg-emerald-500 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
                <button
                  onClick={() => handleDelete(idx)}
                  className="rounded-lg bg-black/40 p-1.5 text-white backdrop-blur-sm hover:bg-red-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {filteredMedia.length > 0 && viewMode === 'list' && (
        <div className="space-y-2">
          {/* List header */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
            <button
              onClick={selectAll}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-slate-300 dark:border-slate-600"
            >
              {selectedIds.size === filteredMedia.length && filteredMedia.length > 0 && (
                <Check className="h-3 w-3" />
              )}
            </button>
            <div className="w-10" />
            <div className="min-w-0 flex-1">Name</div>
            <div className="w-20 text-center">Type</div>
            <div className="w-20 text-right">Size</div>
            <div className="w-24 text-right">Actions</div>
          </div>

          {filteredMedia.map((item, idx) => (
            <div
              key={item.url + idx}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750"
            >
              <button
                onClick={() => toggleSelect(item.url)}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${
                  selectedIds.has(item.url)
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {selectedIds.has(item.url) && <Check className="h-3 w-3" />}
              </button>

              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-700">
                {item.type === 'IMAGE' ? (
                  <img src={item.thumbnailUrl || item.url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    {item.type === 'VIDEO' && <Film className="h-5 w-5 text-blue-400" />}
                    {item.type === 'AUDIO' && <Music className="h-5 w-5 text-purple-400" />}
                    {item.type === 'DOCUMENT' && <FileText className="h-5 w-5 text-slate-400" />}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">
                  {item.fileName || item.type}
                </p>
                {item.caption && (
                  <p className="truncate text-xs text-slate-400">{item.caption}</p>
                )}
              </div>

              <div className="w-20">
                <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${getTypeBadgeClasses(item.type)}`}>
                  {getTypeIcon(item.type)} {item.type}
                </span>
              </div>

              <div className="w-20 text-right text-xs text-slate-500">
                {item.fileSize ? formatSize(item.fileSize) : ''}
              </div>

              <div className="flex w-24 items-center justify-end gap-1">
                {item.type === 'VIDEO' || item.type === 'AUDIO' ? (
                  <button
                    onClick={() => setPlayingId(item.url)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-emerald-50 hover:text-emerald-500 dark:hover:bg-emerald-900/20 transition-colors"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                ) : null}
                <button
                  onClick={() => toggleFeatured(item.url)}
                  className={`rounded-lg p-1.5 transition-colors ${
                    item.isFeatured ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'
                  }`}
                >
                  <Star className={`h-4 w-4 ${item.isFeatured ? 'fill-current' : ''}`} />
                </button>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-1.5 text-slate-400 hover:text-emerald-500 transition-colors"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  onClick={() => handleDelete(idx)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video/Audio Player Modal */}
      <AnimatePresence>
        {playingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setPlayingId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setPlayingId(null)}
                className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              {media.find((m) => m.url === playingId)?.type === 'VIDEO' ? (
                <video src={playingId} controls autoPlay className="w-full" />
              ) : (
                <div className="flex flex-col items-center gap-4 p-8">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <Music className="h-10 w-10 text-purple-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {media.find((m) => m.url === playingId)?.fileName || 'Audio'}
                  </p>
                  <audio src={playingId} controls autoPlay className="w-full max-w-md" />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
