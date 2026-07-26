'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image,
  Video,
  FileText,
  MessageSquare,
  Mic,
  Plus,
  Upload,
  Play,
  Music,
  Camera,
} from 'lucide-react';

export interface Memory {
  id: string;
  type: 'PHOTO' | 'VIDEO' | 'DOCUMENT' | 'STORY' | 'RECORDING';
  title: string;
  url?: string;
  thumbnailUrl?: string;
  createdAt: string;
  uploadedBy?: string;
}

interface TreeMemoriesProps {
  memberId: string;
  memories: Memory[];
  onAddMemory?: (type: Memory['type']) => void;
}

const MEMORY_TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  PHOTO: { icon: Image, label: 'Photo', color: '#3b82f6' },
  VIDEO: { icon: Video, label: 'Video', color: '#8b5cf6' },
  DOCUMENT: { icon: FileText, label: 'Document', color: '#f59e0b' },
  STORY: { icon: MessageSquare, label: 'Story', color: '#10b981' },
  RECORDING: { icon: Mic, label: 'Recording', color: '#ec4899' },
};

const MEMORY_TYPES: Memory['type'][] = ['PHOTO', 'VIDEO', 'DOCUMENT', 'STORY', 'RECORDING'];

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return d;
  }
}

function MemoryThumbnail({ memory }: { memory: Memory }) {
  const config = MEMORY_TYPE_CONFIG[memory.type] || MEMORY_TYPE_CONFIG.PHOTO;
  const IconComponent = config.icon;

  if (memory.thumbnailUrl || (memory.type === 'PHOTO' && memory.url)) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
        <img
          src={memory.thumbnailUrl || memory.url}
          alt={memory.title}
          className="h-full w-full object-cover"
        />
        {memory.type === 'VIDEO' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg">
              <Play className="h-5 w-5 text-slate-900 ml-0.5" />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (memory.type === 'DOCUMENT') {
    return (
      <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-900/20">
        <FileText className="h-8 w-8 text-amber-500" />
        <span className="text-center text-[10px] font-medium text-amber-700 dark:text-amber-400 leading-tight line-clamp-2">
          {memory.title}
        </span>
      </div>
    );
  }

  if (memory.type === 'STORY') {
    return (
      <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
        <MessageSquare className="h-8 w-8 text-emerald-500" />
        <span className="text-center text-[10px] font-medium text-emerald-700 dark:text-emerald-400 leading-tight line-clamp-3">
          {memory.title}
        </span>
      </div>
    );
  }

  if (memory.type === 'RECORDING') {
    return (
      <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg bg-pink-50 p-3 dark:bg-pink-900/20">
        <Music className="h-8 w-8 text-pink-500" />
        <span className="text-center text-[10px] font-medium text-pink-700 dark:text-pink-400 leading-tight line-clamp-2">
          {memory.title}
        </span>
      </div>
    );
  }

  return (
    <div className="flex aspect-square flex-col items-center justify-center gap-2 rounded-lg bg-slate-100 dark:bg-slate-800">
      <IconComponent className="h-8 w-8 text-slate-400" />
      <span className="text-center text-[10px] text-slate-400 truncate max-w-[80%]">{memory.title}</span>
    </div>
  );
}

export default function TreeMemories({ memberId: _memberId, memories, onAddMemory }: TreeMemoriesProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);

  const gridVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  };

  if (memories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
        >
          <Upload className="h-8 w-8 text-slate-400 dark:text-slate-500" />
        </motion.div>
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No memories yet</h4>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Upload photos, documents, or share stories</p>
        {onAddMemory && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAddMemory('PHOTO')}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            <Camera className="h-4 w-4" />
            Add first memory
          </motion.button>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Grid */}
      <motion.div
        variants={gridVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-2"
      >
        <AnimatePresence>
          {memories.map((memory) => (
            <motion.div
              key={memory.id}
              variants={itemVariants}
              layout
              className="group relative cursor-pointer"
            >
              <MemoryThumbnail memory={memory} />
              {/* Overlay on hover */}
              <div className="absolute inset-0 flex flex-col justify-end rounded-lg bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2">
                <p className="text-[11px] font-medium text-white truncate">{memory.title}</p>
                <p className="text-[9px] text-white/70">{formatDate(memory.createdAt)}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Add memory */}
      {onAddMemory && (
        <div className="relative mt-3" ref={dropdownRef}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Memory
          </motion.button>

          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
              >
                {MEMORY_TYPES.map((type) => {
                  const config = MEMORY_TYPE_CONFIG[type];
                  const IconComponent = config.icon;
                  return (
                    <button
                      key={type}
                      onClick={() => {
                        onAddMemory(type);
                        setDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <IconComponent size={14} style={{ color: config.color }} />
                      {config.label}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
