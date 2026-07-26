'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, MoreHorizontal, ChevronDown, ChevronUp,
  EyeOff, Globe, Users, FileText, Edit3,
  Trash2, Share2, Printer, X, Clock, UserPlus,
} from 'lucide-react';
import { getEventConfig, formatDate, formatTime } from './constants';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    eventType: string;
    date?: string;
    time?: string;
    location?: string;
    description?: string;
    aiSummary?: string;
    status?: string;
    visibility?: string;
    coverImage?: string;
    metadata?: Record<string, unknown>;
    info?: Record<string, unknown>;
    _count?: { comments?: number; reactions?: number; documents?: number; media?: number };
    media?: { url: string; type: string }[];
    documents?: { name?: string; title?: string }[];
    participants?: { name?: string; avatar?: string; member?: { name?: string; avatar?: string } }[];
    pinned?: boolean;
    verified?: boolean;
  };
  onSelect?: (event: EventCardProps['event']) => void;
  isSelected?: boolean;
  onExpand?: (eventId: string) => void;
  isExpanded?: boolean;
  expandedContent?: React.ReactNode;
  index?: number;
}

const VIS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ONLY_ME: EyeOff,
  FAMILY: Users,
  SUB_CLAN: Users,
  CLAN: Globe,
  COMMUNITY: Globe,
  PUBLIC: Globe,
};

const VIS_COLORS: Record<string, string> = {
  ONLY_ME: 'text-purple-500 dark:text-purple-400',
  FAMILY: 'text-blue-500 dark:text-blue-400',
  SUB_CLAN: 'text-cyan-500 dark:text-cyan-400',
  CLAN: 'text-emerald-500 dark:text-emerald-400',
  COMMUNITY: 'text-amber-500 dark:text-amber-400',
  PUBLIC: 'text-slate-500 dark:text-slate-400',
};

function formatDateShort(d: string) {
  const date = new Date(d);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const isPast = diff < 0;
  const absDays = Math.floor(Math.abs(diff) / (1000 * 60 * 60 * 24));

  if (absDays === 0 && date.toDateString() === now.toDateString()) return 'Today';
  if (absDays === 1) return isPast ? 'Yesterday' : 'Tomorrow';
  if (absDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getAccentColor(colorClass: string): string {
  const map: Record<string, string> = {
    'bg-pink-50': 'border-l-pink-400',
    'bg-slate-100': 'border-l-slate-400',
    'bg-red-50': 'border-l-red-400',
    'bg-rose-50': 'border-l-rose-400',
    'bg-gray-100': 'border-l-gray-400',
    'bg-blue-50': 'border-l-blue-400',
    'bg-indigo-50': 'border-l-indigo-400',
    'bg-emerald-50': 'border-l-emerald-400',
    'bg-amber-50': 'border-l-amber-400',
    'bg-teal-50': 'border-l-teal-400',
    'bg-violet-50': 'border-l-violet-400',
    'bg-cyan-50': 'border-l-cyan-400',
    'bg-orange-50': 'border-l-orange-400',
    'bg-yellow-50': 'border-l-yellow-400',
    'bg-green-50': 'border-l-green-400',
    'bg-purple-50': 'border-l-purple-400',
    'bg-sky-50': 'border-l-sky-400',
    'bg-lime-50': 'border-l-lime-400',
    'bg-fuchsia-50': 'border-l-fuchsia-400',
    'bg-stone-50': 'border-l-stone-400',
  };
  for (const [k, v] of Object.entries(map)) {
    if (colorClass.startsWith(k)) return v;
  }
  return 'border-l-slate-400';
}

export default function EventCard({
  event,
  isSelected = false,
  onExpand,
  isExpanded = false,
  expandedContent,
  index = 0,
}: EventCardProps) {
  const config = getEventConfig(event.eventType);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const VisIcon = VIS_ICONS[event.visibility || ''] || Globe;
  const visColor = VIS_COLORS[event.visibility || ''] || 'text-slate-500';
  const accentBorder = getAccentColor(config.color);

  const participantList = event.participants || [];
  const visibleParticipants = participantList.slice(0, 3);
  const extraCount = participantList.length - 3;
  const docCount = event._count?.documents || event.documents?.length || 0;

  const hasExpandableContent =
    (event.description?.length || 0) > 120 ||
    participantList.length > 3 ||
    docCount > 0 ||
    !!expandedContent;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExpand = useCallback(() => {
    if (!hasExpandableContent) return;
    if (onExpand) onExpand(event.id);
  }, [event.id, hasExpandableContent, onExpand]);

  const handleMenuClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen((prev) => !prev);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index || 0) * 0.04, duration: 0.3, ease: 'easeOut' }}
    >
      <div
        onClick={handleExpand}
        className={`group relative cursor-pointer overflow-hidden rounded-xl border bg-white p-4 transition-all duration-200 dark:bg-slate-900 ${
          isSelected
            ? 'border-emerald-300 shadow-lg ring-1 ring-emerald-300/30 dark:border-emerald-700 dark:ring-emerald-700/30'
            : 'border-slate-100 hover:border-slate-200 hover:shadow-md dark:border-slate-800 dark:hover:border-slate-700'
        } ${accentBorder} border-l-[3px]`}
      >
        {/* Hover scale effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-transparent via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-hover:[background-image:linear-gradient(to_bottom,transparent_60%,rgba(0,0,0,0.01)_100%)] dark:group-hover:[background-image:linear-gradient(to_bottom,transparent_60%,rgba(255,255,255,0.01)_100%)]" />

        <div className="relative">
          {/* Main row: Avatar | Content | Date + Actions */}
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${config.color}`}
            >
              {config.icon}
            </div>

            {/* Center content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium leading-none ${config.color}`}
                >
                  {config.label}
                </span>
                <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {event.title}
                </h3>
              </div>

              {/* Description â€” only if exists */}
              {event.description && (
                <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                  {event.description}
                </p>
              )}

              {/* Second row: chips */}
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {/* People avatars */}
                {visibleParticipants.length > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="flex -space-x-1.5">
                      {visibleParticipants.map((p, i) => {
                        const avatarUrl = p.avatar || p.member?.avatar;
                        const name = p.name || p.member?.name || '?';
                        return (
                          <div
                            key={i}
                            className="relative h-5 w-5 overflow-hidden rounded-full border-2 border-white dark:border-slate-900"
                          >
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-slate-200 text-[7px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                                {name[0]}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {extraCount > 0 && (
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                        +{extraCount}
                      </span>
                    )}
                  </div>
                )}

                {/* Documents */}
                {docCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    <FileText className="h-3 w-3" />
                    {docCount}
                  </span>
                )}

                {/* Visibility */}
                {event.visibility && (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${visColor}`}>
                    <VisIcon className="h-3 w-3" />
                  </span>
                )}
              </div>
            </div>

            {/* Right side: Date + Menu */}
            <div className="flex shrink-0 items-center gap-1.5 self-start">
              {event.date && (
                <time className="whitespace-nowrap text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  {formatDateShort(event.date)}
                </time>
              )}

              {/* Expand indicator */}
              {hasExpandableContent && (
                <span className="text-slate-300 dark:text-slate-600">
                  {isExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </span>
              )}

              {/* Menu button */}
              <div ref={menuRef} className="relative">
                <button
                  onClick={handleMenuClick}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 opacity-0 transition-all duration-150 hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                  aria-label="More actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>

                {/* Dropdown menu */}
                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50">
                        <Edit3 className="h-3.5 w-3.5 text-slate-400" /> Edit
                      </button>
                      <button className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50">
                        <Share2 className="h-3.5 w-3.5 text-slate-400" /> Share
                      </button>
                      <button className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50">
                        <Printer className="h-3.5 w-3.5 text-slate-400" /> Print
                      </button>
                      <div className="my-1 border-t border-slate-100 dark:border-slate-700" />
                      <button className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20">
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Second info line: location & time inline */}
          {(event.location || event.time) && (
            <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500">
              {event.time && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(event.time)}
                </span>
              )}
              {event.location && (
                <span className="inline-flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate">{event.location}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Expanded content */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                {/* Full description */}
                {event.description && (
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {event.description}
                  </p>
                )}

                {/* Full participant list */}
                {participantList.length > 3 && (
                  <div className="mt-3 space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Participants
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {participantList.map((p, i) => {
                        const name = p.name || p.member?.name || 'Unknown';
                        return (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          >
                            <UserPlus className="h-3 w-3 text-slate-400" />
                            {name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Document list */}
                {docCount > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Documents
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {(event.documents || []).slice(0, 5).map((doc, i: number) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          <FileText className="h-3 w-3 text-slate-400" />
                          {doc.name || doc.title || `Document ${i + 1}`}
                        </span>
                      ))}
                      {(event.documents || []).length > 5 && (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          +{(event.documents || []).length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Expanded custom content */}
                {expandedContent && <div className="mt-3">{expandedContent}</div>}

                {/* Action buttons */}
                <div className="mt-4 flex items-center gap-2">
                  <button className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                    <Edit3 className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                    <Share2 className="h-3.5 w-3.5" /> Share
                  </button>
                  <button className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                    <Printer className="h-3.5 w-3.5" /> Print
                  </button>
                  <button className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-900/20">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
