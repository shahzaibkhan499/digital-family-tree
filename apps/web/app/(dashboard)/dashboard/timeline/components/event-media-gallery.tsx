'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image, Film, Music, Plus, X, ChevronLeft, ChevronRight, Download, Trash2, GripVertical } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface MediaItem {
  id: string;
  url: string;
  type: string;
  caption?: string;
  order?: number;
}

const TYPE_FILTERS = [
  { id: 'all', label: 'All', icon: null },
  { id: 'image', label: 'Images', icon: Image },
  { id: 'video', label: 'Videos', icon: Film },
  { id: 'audio', label: 'Audio', icon: Music },
];

function MediaSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="aspect-square animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700" />
      ))}
    </div>
  );
}

export default function EventMediaGallery({ eventId, isOwner }: { eventId: string; isOwner: boolean }) {
  const { user } = useAuth();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const [form, setForm] = useState({ url: '', type: 'image', caption: '' });

  const inputCls = "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500";
  const selectCls = "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

  const fetchMedia = useCallback(async () => {
    try {
      const res = await api.timeline.get(eventId);
      const items = res?.media || res?.mediaUrls || [];
      setMedia(Array.isArray(items) ? items.map((m: any, i: number) => ({
        id: m.id || `media-${i}`,
        url: m.url || '',
        type: m.type || 'image',
        caption: m.caption || '',
        order: i,
      })) : []);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const filtered = media.filter(m => activeFilter === 'all' || m.type === activeFilter);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft') setLightboxIndex(prev => prev !== null ? Math.max(0, prev - 1) : null);
      if (e.key === 'ArrowRight') setLightboxIndex(prev => prev !== null ? Math.min(filtered.length - 1, prev + 1) : null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, media, activeFilter]);

  const filtered = media.filter(m => activeFilter === 'all' || m.type === activeFilter);

  const handleAdd = async () => {
    if (!form.url.trim() || saving) return;
    setSaving(true);
    try {
      const newMedia = { url: form.url.trim(), type: form.type, caption: form.caption.trim() };
      await api.timeline.update(eventId, { media: [...media, newMedia] });
      setForm({ url: '', type: 'image', caption: '' });
      setShowForm(false);
      await fetchMedia();
    } catch {
      /* empty */
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (mediaId: string) => {
    try {
      const updated = media.filter(m => m.id !== mediaId);
      await api.timeline.update(eventId, { media: updated });
      setMedia(updated);
      setDeleteConfirm(null);
      if (lightboxIndex !== null) setLightboxIndex(null);
    } catch {
      /* empty */
    }
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setMedia(prev => {
      const items = [...prev];
      const [moved] = items.splice(dragIndex, 1);
      items.splice(index, 0, moved);
      return items.map((m, i) => ({ ...m, order: i }));
    });
    setDragIndex(index);
  };

  const handleDragEnd = async () => {
    setDragIndex(null);
    try {
      await api.timeline.update(eventId, { media: media.map((m, i) => ({ ...m, order: i })) });
    } catch {
      /* empty */
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'video': return <Film className="h-8 w-8 text-white drop-shadow-lg" />;
      case 'audio': return <Music className="h-8 w-8 text-white drop-shadow-lg" />;
      default: return null;
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Image className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Media</span>
          {media.length > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {media.length}
            </span>
          )}
        </div>
        {isOwner && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Media
          </button>
        )}
      </div>

      <div className="p-4">
        {/* Type filter tabs */}
        <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
          {TYPE_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeFilter === f.id
                  ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-white'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              {f.icon && <f.icon className="h-3.5 w-3.5" />}
              {f.label}
            </button>
          ))}
        </div>

        {/* Add form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Add Media</h4>
                  <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">URL <span className="text-rose-500">*</span></label>
                    <input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://example.com/photo.jpg" className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">Type</label>
                    <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={selectCls}>
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                      <option value="audio">Audio</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">Caption</label>
                    <input value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))} placeholder="Optional caption" className={inputCls} />
                  </div>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <button onClick={() => setShowForm(false)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400">Cancel</button>
                  <button
                    onClick={handleAdd}
                    disabled={!form.url.trim() || saving}
                    className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {saving ? 'Adding...' : 'Add'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Media grid */}
        {loading ? (
          <MediaSkeleton />
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center">
            <Image className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
              {activeFilter !== 'all'
                ? `No ${activeFilter}s found.`
                : 'No media yet. Add photos, videos, or audio to capture memories.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filtered.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  draggable={isOwner}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`group relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 ${
                    dragIndex === index ? 'opacity-50 ring-2 ring-emerald-500' : ''
                  }`}
                  onClick={() => {
                    const filteredIdx = filtered.findIndex(f => f.id === item.id);
                    if (filteredIdx >= 0) setLightboxIndex(filteredIdx);
                  }}
                >
                  {item.type === 'image' ? (
                    <img src={item.url} alt={item.caption || ''} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
                      {getMediaIcon(item.type)}
                    </div>
                  )}

                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/40">
                    {/* Drag handle */}
                    {isOwner && (
                      <div className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="h-4 w-4 text-white drop-shadow-lg" />
                      </div>
                    )}

                    {/* Delete button */}
                    {isOwner && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(item.id); }}
                        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Caption */}
                  {item.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2">
                      <p className="text-xs text-white truncate">{item.caption}</p>
                    </div>
                  )}

                  {/* Type badge */}
                  {item.type !== 'image' && (
                    <div className="absolute bottom-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50">
                      {item.type === 'video' ? <Film className="h-3 w-3 text-white" /> : <Music className="h-3 w-3 text-white" />}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Close button */}
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
              {lightboxIndex + 1} / {filtered.length}
            </div>

            {/* Prev button */}
            {lightboxIndex > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
                className="absolute left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}

            {/* Next button */}
            {lightboxIndex < filtered.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
                className="absolute right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}

            {/* Media content */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex max-h-[85vh] max-w-[85vw] flex-col items-center"
              onClick={e => e.stopPropagation()}
            >
              {filtered[lightboxIndex]?.type === 'image' ? (
                <img
                  src={filtered[lightboxIndex]?.url}
                  alt={filtered[lightboxIndex]?.caption || ''}
                  className="max-h-[80vh] max-w-full rounded-lg object-contain"
                />
              ) : filtered[lightboxIndex]?.type === 'video' ? (
                <video
                  src={filtered[lightboxIndex]?.url}
                  controls
                  className="max-h-[80vh] max-w-full rounded-lg"
                />
              ) : (
                <div className="flex h-48 w-80 items-center justify-center rounded-lg bg-slate-800">
                  <Music className="h-12 w-12 text-slate-400" />
                </div>
              )}

              {/* Caption & download */}
              <div className="mt-3 flex items-center gap-4">
                {filtered[lightboxIndex]?.caption && (
                  <p className="text-sm text-white/80">{filtered[lightboxIndex]?.caption}</p>
                )}
                <a
                  href={filtered[lightboxIndex]?.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-white/20 transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Delete media item?</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">This action cannot be undone.</p>
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setDeleteConfirm(null)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm)} className="rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-rose-700">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
