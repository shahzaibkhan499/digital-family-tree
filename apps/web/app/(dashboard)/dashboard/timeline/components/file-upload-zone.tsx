'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, X, RefreshCw, Image as ImageIcon, Film, Music, FileText,
  File, AlertCircle, Check, Camera, Clipboard,
} from 'lucide-react';

export interface UploadResult {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  thumbnailUrl?: string;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  result?: UploadResult;
  error?: string;
  preview?: string;
}

interface FileUploadZoneProps {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  onUpload: (files: File[]) => Promise<UploadResult[]>;
  onUploadComplete?: (results: UploadResult[]) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  label?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
  if (mimeType.startsWith('video/')) return <Film className="h-4 w-4" />;
  if (mimeType.startsWith('audio/')) return <Music className="h-4 w-4" />;
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('word'))
    return <FileText className="h-4 w-4" />;
  return <File className="h-4 w-4" />;
}

function getFileIconColor(mimeType: string) {
  if (mimeType.startsWith('image/')) return 'bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20 dark:text-emerald-400';
  if (mimeType.startsWith('video/')) return 'bg-blue-50 text-blue-500 dark:bg-blue-900/20 dark:text-blue-400';
  if (mimeType.startsWith('audio/')) return 'bg-purple-50 text-purple-500 dark:bg-purple-900/20 dark:text-purple-400';
  return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
}

export function FileUploadZone({
  accept = '*/*',
  multiple = true,
  maxFiles = 20,
  maxSize = 25,
  onUpload,
  onUploadComplete,
  onError,
  disabled = false,
  label = 'Drop files here',
  description = 'Click to browse or drag and drop files',
  icon,
  className = '',
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const createPreview = useCallback((file: File): string | undefined => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return undefined;
  }, []);

  const validateFiles = useCallback((files: File[]): File[] => {
    const valid: File[] = [];
    for (const file of files) {
      if (file.size > maxSize * 1024 * 1024) {
        onError?.(`${file.name} exceeds ${maxSize}MB limit`);
        continue;
      }
      valid.push(file);
    }
    return valid;
  }, [maxSize, onError]);

  const processFiles = useCallback(async (files: File[]) => {
    if (disabled) return;
    const validFiles = validateFiles(files);
    if (validFiles.length === 0) return;

    const totalExisting = uploadingFiles.length;
    if (totalExisting + validFiles.length > maxFiles) {
      onError?.(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newUploadingFiles: UploadingFile[] = validFiles.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      file,
      progress: 0,
      status: 'uploading' as const,
      preview: createPreview(file),
    }));

    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

    try {
      const results = await onUpload(validFiles);
      setUploadingFiles((prev) =>
        prev.map((uf) => {
          const idx = validFiles.indexOf(uf.file);
          if (idx !== -1 && results[idx]) {
            return { ...uf, progress: 100, status: 'done', result: results[idx] };
          }
          return uf;
        })
      );
      onUploadComplete?.(results);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setUploadingFiles((prev) =>
        prev.map((uf) => {
          if (newUploadingFiles.some((n) => n.id === uf.id)) {
            return { ...uf, status: 'error', error: message };
          }
          return uf;
        })
      );
      onError?.(message);
    }
  }, [disabled, validateFiles, uploadingFiles.length, maxFiles, onUpload, onUploadComplete, onError, createPreview]);

  const retryUpload = useCallback(async (uploadId: string) => {
    const uf = uploadingFiles.find((u) => u.id === uploadId);
    if (!uf) return;

    setUploadingFiles((prev) =>
      prev.map((u) => (u.id === uploadId ? { ...u, status: 'uploading', error: undefined, progress: 0 } : u))
    );

    try {
      const results = await onUpload([uf.file]);
      setUploadingFiles((prev) =>
        prev.map((u) =>
          u.id === uploadId ? { ...u, progress: 100, status: 'done', result: results[0] } : u
        )
      );
      if (results[0]) onUploadComplete?.([results[0]]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setUploadingFiles((prev) =>
        prev.map((u) => (u.id === uploadId ? { ...u, status: 'error', error: message } : u))
      );
    }
  }, [uploadingFiles, onUpload, onUploadComplete]);

  const removeFile = useCallback((uploadId: string) => {
    setUploadingFiles((prev) => {
      const uf = prev.find((u) => u.id === uploadId);
      if (uf?.preview) URL.revokeObjectURL(uf.preview);
      return prev.filter((u) => u.id !== uploadId);
    });
  }, []);

  useEffect(() => {
    return () => {
      uploadingFiles.forEach((uf) => {
        if (uf.preview) URL.revokeObjectURL(uf.preview);
      });
    };
  }, [uploadingFiles]);

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
    if (files.length > 0) processFiles(files);
  }, [processFiles]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const files: File[] = [];
    items.forEach((item) => {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    });
    if (files.length > 0) processFiles(files);
  }, [processFiles]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) processFiles(files);
    if (inputRef.current) inputRef.current.value = '';
  }, [processFiles]);

  const doneFiles = uploadingFiles.filter((f) => f.status === 'done' && f.result);

  return (
    <div
      className={className}
      onPaste={handlePaste}
      tabIndex={0}
      role="button"
      aria-label="File upload area"
    >
      <motion.div
        animate={isDragging ? { scale: 1.02, borderColor: '#10b981' } : { scale: 1, borderColor: '' }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`relative rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer
          ${isDragging
            ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10'
            : 'border-slate-200 bg-white/80 backdrop-blur-xl hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/80 dark:hover:border-slate-600'
          }
          ${disabled ? 'pointer-events-none opacity-50' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-3">
          {icon || (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500 dark:bg-emerald-900/20 dark:text-emerald-400">
              <Upload className="h-6 w-6" />
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{description}</p>
            {maxSize && (
              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-600">Max {maxSize}MB per file</p>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1"><Camera className="h-3 w-3" /> Camera</span>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <span className="flex items-center gap-1"><Clipboard className="h-3 w-3" /> Paste</span>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {uploadingFiles.map((uf) => (
          <motion.div
            key={uf.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 overflow-hidden"
          >
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white/80 backdrop-blur-sm px-3 py-2 dark:border-slate-700 dark:bg-slate-900/80">
              {uf.preview ? (
                <img src={uf.preview} alt="" className="h-9 w-9 rounded-md object-cover" />
              ) : (
                <div className={`flex h-9 w-9 items-center justify-center rounded-md ${getFileIconColor(uf.file.type)}`}>
                  {getFileIcon(uf.file.type)}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-300">{uf.file.name}</p>
                <p className="text-[11px] text-slate-400">{formatFileSize(uf.file.size)}</p>
                {uf.status === 'uploading' && (
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <motion.div
                      className="h-full rounded-full bg-emerald-500"
                      initial={{ width: '0%' }}
                      animate={{ width: `${uf.progress}%` }}
                    />
                  </div>
                )}
                {uf.status === 'error' && (
                  <p className="mt-1 text-[11px] text-rose-500">{uf.error}</p>
                )}
              </div>

              <div className="flex items-center gap-1">
                {uf.status === 'done' && (
                  <Check className="h-4 w-4 text-emerald-500" />
                )}
                {uf.status === 'error' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); retryUpload(uf.id); }}
                    className="rounded p-1 text-slate-400 hover:text-emerald-500 transition-colors"
                    title="Retry"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(uf.id); }}
                  className="rounded p-1 text-slate-400 hover:text-rose-500 transition-colors"
                  title="Remove"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {doneFiles.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {doneFiles.map((uf) => (
            <div
              key={uf.id}
              className="group relative flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 dark:border-emerald-800 dark:bg-emerald-900/20"
            >
              {uf.result?.thumbnailUrl ? (
                <img src={uf.result.thumbnailUrl} alt="" className="h-6 w-6 rounded object-cover" />
              ) : (
                <div className={`flex h-6 w-6 items-center justify-center rounded ${getFileIconColor(uf.file.type)}`}>
                  {getFileIcon(uf.file.type)}
                </div>
              )}
              <span className="max-w-[120px] truncate text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                {uf.result?.fileName || uf.file.name}
              </span>
              <button
                onClick={() => removeFile(uf.id)}
                className="ml-1 rounded-full p-0.5 text-emerald-400 opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-all"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {uploadingFiles.length === 0 && !disabled && (
        <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
          <AlertCircle className="h-3 w-3" />
          <span>Ctrl+V to paste images from clipboard</span>
        </div>
      )}
    </div>
  );
}
