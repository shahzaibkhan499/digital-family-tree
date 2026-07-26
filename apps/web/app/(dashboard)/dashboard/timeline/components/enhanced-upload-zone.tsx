'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, X, RefreshCw, Image as ImageIcon, Film, FileText, File,
  AlertCircle, Check, Camera, Clipboard, Play, ArrowDownToLine,
  HardDrive, ShieldCheck, Zap,
} from 'lucide-react';

interface QueuedFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  preview?: string;
  error?: string;
  originalSize?: number;
  estimatedSize?: number;
}

interface EnhancedUploadZoneProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxFileSizeMB?: number;
  showPreview?: boolean;
  compact?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function getFileIcon(mimeType: string): React.ReactNode {
  if (mimeType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
  if (mimeType.startsWith('video/')) return <Film className="h-4 w-4" />;
  if (mimeType.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
  if (mimeType.includes('word') || mimeType.includes('document'))
    return <FileText className="h-4 w-4 text-blue-500" />;
  if (mimeType.includes('sheet') || mimeType.includes('excel'))
    return <FileText className="h-4 w-4 text-green-500" />;
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
    return <FileText className="h-4 w-4 text-orange-500" />;
  return <File className="h-4 w-4" />;
}

function getFileIconBg(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20 dark:text-emerald-400';
  if (mimeType.startsWith('video/')) return 'bg-blue-50 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400';
  if (mimeType.includes('pdf')) return 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400';
  if (mimeType.includes('word') || mimeType.includes('document'))
    return 'bg-blue-50 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400';
  if (mimeType.includes('sheet') || mimeType.includes('excel'))
    return 'bg-green-50 text-green-500 dark:bg-green-900/20 dark:text-green-400';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
    return 'bg-orange-50 text-orange-500 dark:bg-orange-900/20 dark:text-orange-400';
  return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
}

function getFileTypeBadge(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'IMG';
  if (mimeType.startsWith('video/')) return 'VID';
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'DOC';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'XLS';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'PPT';
  if (mimeType.startsWith('audio/')) return 'AUD';
  return 'FILE';
}

function getFileTypeBadgeColor(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  if (mimeType.startsWith('video/')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  if (mimeType.includes('pdf')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  if (mimeType.includes('word') || mimeType.includes('document'))
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
  return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
}

function estimateCompressedSize(size: number): number {
  return Math.round(size * 0.65);
}

export function EnhancedUploadZone({
  onFiles,
  accept = '*/*',
  multiple = true,
  maxFiles = 20,
  maxFileSizeMB = 25,
  showPreview = true,
  compact = false,
}: EnhancedUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const createPreview = useCallback((file: File): string | undefined => {
    if (file.type.startsWith('image/')) return URL.createObjectURL(file);
    return undefined;
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      return `${file.name} exceeds ${maxFileSizeMB}MB limit (${formatFileSize(file.size)})`;
    }
    return null;
  }, [maxFileSizeMB]);

  const addFiles = useCallback((files: File[]) => {
    setError(null);
    const validFiles: File[] = [];
    for (const file of files) {
      const err = validateFile(file);
      if (err) {
        setError(err);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setQueue((prev) => {
      const total = prev.length + validFiles.length;
      if (total > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed. You have ${prev.length} already queued.`);
        return prev;
      }
      return prev;
    });

    const newItems: QueuedFile[] = validFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      file,
      progress: 0,
      status: 'pending' as const,
      preview: createPreview(file),
      originalSize: file.size,
      estimatedSize: file.type.startsWith('image/') && file.size > 2 * 1024 * 1024
        ? estimateCompressedSize(file.size)
        : undefined,
    }));

    setQueue((prev) => [...prev, ...newItems]);
    onFiles(validFiles);

    newItems.forEach((item) => {
      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading' as const } : q))
      );
      simulateProgress(item.id);
    });
  }, [validateFile, maxFiles, onFiles, createPreview]);

  const simulateProgress = useCallback((fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 25 + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setQueue((prev) =>
          prev.map((q) => (q.id === fileId ? { ...q, progress: 100, status: 'done' as const } : q))
        );
      } else {
        setQueue((prev) =>
          prev.map((q) => (q.id === fileId ? { ...q, progress: Math.min(progress, 99) } : q))
        );
      }
    }, 400);
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setQueue((prev) => {
      const item = prev.find((q) => q.id === fileId);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((q) => q.id !== fileId);
    });
  }, []);

  const replaceFile = useCallback((fileId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) {
        const file = files[0];
        const err = validateFile(file);
        if (err) {
          setError(err);
          return;
        }
        setQueue((prev) => {
          const old = prev.find((q) => q.id === fileId);
          if (old?.preview) URL.revokeObjectURL(old.preview);
          return prev.map((q) =>
            q.id === fileId
              ? {
                  ...q,
                  file,
                  preview: createPreview(file),
                  status: 'uploading' as const,
                  progress: 0,
                  error: undefined,
                  originalSize: file.size,
                  estimatedSize: file.type.startsWith('image/') && file.size > 2 * 1024 * 1024
                    ? estimateCompressedSize(file.size)
                    : undefined,
                }
              : q
          );
        });
        onFiles([file]);
        simulateProgress(fileId);
      }
    };
    input.click();
  }, [accept, validateFile, onFiles, createPreview, simulateProgress]);

  const clearDone = useCallback(() => {
    setQueue((prev) => {
      prev.forEach((q) => {
        if (q.status === 'done' && q.preview) URL.revokeObjectURL(q.preview);
      });
      return prev.filter((q) => q.status !== 'done');
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items || []);
      const files: File[] = [];
      items.forEach((item) => {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      });
      if (files.length > 0) addFiles(files);
    };

    container.addEventListener('paste', handlePaste as any);
    return () => container.removeEventListener('paste', handlePaste as any);
  }, [addFiles]);

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.items || []);
      const files: File[] = [];
      items.forEach((item) => {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      });
      if (files.length > 0) addFiles(files);
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [addFiles]);

  useEffect(() => {
    return () => {
      queue.forEach((q) => {
        if (q.preview) URL.revokeObjectURL(q.preview);
      });
    };
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (dragCounterRef.current === 1) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) addFiles(files);
  }, [addFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) addFiles(files);
    if (inputRef.current) inputRef.current.value = '';
  }, [addFiles]);

  const openFilePicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const openCamera = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length > 0) addFiles(files);
    };
    input.click();
  }, [addFiles]);

  const doneCount = queue.filter((q) => q.status === 'done').length;
  const errorCount = queue.filter((q) => q.status === 'error').length;
  const totalSize = queue.reduce((acc, q) => acc + q.file.size, 0);

  return (
    <div ref={containerRef} className="space-y-3" tabIndex={0}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
      />

      <motion.div
        animate={isDragging ? { scale: 1.01 } : { scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 ${
          isDragging
            ? 'border-emerald-400 bg-emerald-50/80 shadow-lg shadow-emerald-100 dark:bg-emerald-900/10 dark:shadow-emerald-900/20'
            : 'border-slate-200 bg-white/60 hover:border-slate-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-slate-600'
        } ${compact ? 'p-4' : 'p-8'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFilePicker}
      >
        <div className={`flex ${compact ? 'flex-row items-center gap-3' : 'flex-col items-center gap-4'}`}>
          <motion.div
            animate={isDragging ? { y: -4, scale: 1.1 } : { y: 0, scale: 1 }}
            className={`flex items-center justify-center rounded-2xl ${
              compact ? 'h-10 w-10' : 'h-16 w-16'
            } ${
              isDragging
                ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-800/40 dark:text-emerald-400'
                : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
            }`}
          >
            {isDragging ? (
              <ArrowDownToLine className={compact ? 'h-5 w-5' : 'h-7 w-7'} />
            ) : (
              <Upload className={compact ? 'h-5 w-5' : 'h-7 w-7'} />
            )}
          </motion.div>
          <div className={compact ? 'flex-1' : 'text-center'}>
            <p className={`font-medium text-slate-700 dark:text-slate-200 ${compact ? 'text-sm' : 'text-base'}`}>
              {isDragging ? 'Drop files here' : 'Drag & drop files here'}
            </p>
            <p className={`text-slate-400 dark:text-slate-500 ${compact ? 'mt-0.5 text-xs' : 'mt-1 text-sm'}`}>
              or click to browse
            </p>
          </div>
          {!compact && (
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400 dark:text-slate-500">
              <button
                onClick={(e) => { e.stopPropagation(); openCamera(); }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 transition-colors hover:border-emerald-300 hover:text-emerald-600 dark:border-slate-700 dark:hover:border-emerald-600 dark:hover:text-emerald-400"
              >
                <Camera className="h-3.5 w-3.5" /> Camera
              </button>
              <span className="flex items-center gap-1.5 text-slate-300 dark:text-slate-600">
                <Clipboard className="h-3.5 w-3.5" /> Ctrl+V to paste
              </span>
              <span className="text-slate-300 dark:text-slate-600">
                Max {maxFileSizeMB}MB per file
              </span>
            </div>
          )}
          {compact && (
            <div className="flex shrink-0 items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
              <button
                onClick={(e) => { e.stopPropagation(); openCamera(); }}
                className="rounded-lg border border-slate-200 p-1.5 transition-colors hover:text-emerald-600 dark:border-slate-700 dark:hover:text-emerald-400"
                title="Take photo"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
              <span className="text-[11px]">{maxFileSizeMB}MB max</span>
            </div>
          )}
        </div>

        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pointer-events-none absolute inset-0 rounded-2xl border-2 border-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg">
                <Upload className="h-4 w-4" />
                Drop to upload
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="shrink-0 rounded p-0.5 hover:text-red-800 dark:hover:text-red-300">
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}

      {queue.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <HardDrive className="h-3 w-3" />
                {formatFileSize(totalSize)}
              </span>
              {doneCount > 0 && (
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3 w-3" />
                  {doneCount} done
                </span>
              )}
              {errorCount > 0 && (
                <span className="flex items-center gap-1 text-red-500">
                  <AlertCircle className="h-3 w-3" />
                  {errorCount} failed
                </span>
              )}
            </div>
            {doneCount > 0 && (
              <button
                onClick={clearDone}
                className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear completed
              </button>
            )}
          </div>

          <AnimatePresence mode="popLayout">
            {queue.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -8, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="overflow-hidden"
              >
                <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${
                  item.status === 'error'
                    ? 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10'
                    : item.status === 'done'
                      ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/10'
                      : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                }`}>
                  {showPreview && (
                    <div className="relative shrink-0">
                      {item.preview ? (
                        <div className="relative">
                          <img
                            src={item.preview}
                            alt=""
                            className="h-[80px] w-[80px] rounded-lg object-cover"
                          />
                          {item.file.type.startsWith('video/') && (
                            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
                              <Play className="h-6 w-6 text-white" fill="white" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={`flex h-[80px] w-[80px] items-center justify-center rounded-lg ${getFileIconBg(item.file.type)}`}>
                          <div className="flex flex-col items-center gap-1">
                            {getFileIcon(item.file.type)}
                            <span className="text-[10px] font-bold opacity-60">{getFileTypeBadge(item.file.type)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                        {item.file.name}
                      </p>
                      <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${getFileTypeBadgeColor(item.file.type)}`}>
                        {getFileTypeBadge(item.file.type)}
                      </span>
                    </div>

                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                      <span>{formatFileSize(item.file.size)}</span>
                      {item.estimatedSize && (
                        <span className="flex items-center gap-1 text-emerald-500 dark:text-emerald-400">
                          <Zap className="h-2.5 w-2.5" />
                          ~{formatFileSize(item.estimatedSize)} compressed
                        </span>
                      )}
                    </div>

                    {(item.status === 'uploading' || item.status === 'pending') && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                              initial={{ width: '0%' }}
                              animate={{ width: `${item.progress}%` }}
                              transition={{ duration: 0.3, ease: 'easeOut' }}
                            />
                          </div>
                          <span className="ml-2 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                            {Math.round(item.progress)}%
                          </span>
                        </div>
                      </div>
                    )}

                    {item.status === 'done' && (
                      <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <Check className="h-3 w-3" />
                        Uploaded successfully
                      </div>
                    )}

                    {item.status === 'error' && (
                      <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-red-500">
                        <AlertCircle className="h-3 w-3" />
                        {item.error || 'Upload failed'}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {item.status === 'error' && (
                      <button
                        onClick={() => {
                          setQueue((prev) =>
                            prev.map((q) =>
                              q.id === item.id
                                ? { ...q, status: 'uploading' as const, progress: 0, error: undefined }
                                : q
                            )
                          );
                          simulateProgress(item.id);
                        }}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400"
                        title="Retry"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {item.status === 'done' && (
                      <button
                        onClick={() => replaceFile(item.id)}
                        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                        title="Replace"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => removeFile(item.id)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                      title="Remove"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {queue.length === 0 && !compact && (
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> {maxFiles} files max</span>
          <span className="text-slate-200 dark:text-slate-700">|</span>
          <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" /> {maxFileSizeMB}MB per file</span>
          <span className="text-slate-200 dark:text-slate-700">|</span>
          <span className="flex items-center gap-1"><Clipboard className="h-3 w-3" /> Paste from clipboard</span>
        </div>
      )}
    </div>
  );
}
