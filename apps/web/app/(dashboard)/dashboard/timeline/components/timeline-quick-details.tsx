'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X, MapPin, Calendar, Clock, FileText, Image, Users,
  ExternalLink, Pencil, Share2, Printer, CalendarDays,
} from 'lucide-react';
import { getEventConfig, formatDate, formatTime } from './constants';

interface TimelineQuickDetailsProps {
  event: any | null;
  onClose?: () => void;
}

export default function TimelineQuickDetails({ event, onClose }: TimelineQuickDetailsProps) {
  const config = event ? getEventConfig(event.eventType) : null;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/60 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/60">
      <AnimatePresence mode="wait">
        {!event ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center px-6 py-16 text-center"
          >
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
              <CalendarDays className="h-7 w-7 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Select an event to view details
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-start justify-between border-b border-slate-100 px-5 pt-5 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-xl shadow-sm ${config?.gradient ?? 'from-slate-400 to-slate-600'}`}>
                  {config?.icon ?? 'âœ¨'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {event.title}
                  </h3>
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                    {config?.label ?? 'Event'}
                  </p>
                </div>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="space-y-4 px-5 py-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>{event.date ? formatDate(event.date) : 'No date'}</span>
                </div>
                {event.time && (
                  <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>{formatTime(event.time)}</span>
                  </div>
                )}
                {event.location && (
                  <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>

              {event.description && (
                <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    {event.description}
                  </p>
                </div>
              )}

              {event.people && event.people.length > 0 && (
                <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div className="mb-2.5 flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      People
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {event.people.map((person: any, i: number) => (
                      <div
                        key={person.id ?? i}
                        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 dark:border-slate-700 dark:bg-slate-800"
                      >
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                          {(person.name ?? '?')[0]}
                        </div>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          {person.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {event.documents && event.documents.length > 0 && (
                <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div className="mb-2.5 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Documents
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {event.documents.map((doc: any, i: number) => (
                      <div
                        key={doc.id ?? i}
                        className="flex items-center gap-2.5 rounded-lg border border-slate-100 bg-white px-3 py-2 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:bg-slate-800"
                      >
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        <span className="flex-1 truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                          {doc.name ?? 'Untitled'}
                        </span>
                        <ExternalLink className="h-3 w-3 text-slate-300 dark:text-slate-600" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {event.media && event.media.length > 0 && (
                <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div className="mb-2.5 flex items-center gap-1.5">
                    <Image className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Media
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {event.media.slice(0, 4).map((m: any, i: number) => (
                      <div
                        key={m.id ?? i}
                        className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                      >
                        {m.url ? (
                          <img src={m.url} alt={m.name ?? ''} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Image className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 px-5 py-4 dark:border-slate-800">
              <div className="flex gap-2">
                <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-sm shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:shadow-md">
                  <ExternalLink className="h-3.5 w-3.5" />
                  View Full
                </button>
                <button className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800">
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800">
                  <Share2 className="h-3.5 w-3.5" />
                </button>
                <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800">
                  <Printer className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
