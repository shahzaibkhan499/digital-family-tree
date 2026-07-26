'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api-client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, X, AlertCircle, Users, Globe, Users2,
  FileText, Calendar, Clock, MapPin,
  CheckCircle, RefreshCw, ArrowDown,
  MessageCircle, Heart, Link2, Bookmark, MoreHorizontal,
  EyeOff, Image as ImageIcon,
} from 'lucide-react';
import {
  getEventConfig, formatDate, getEventStatus, EVENT_TYPE_CONFIG,
  calcCountdown, formatRelative, formatTime,
} from './components/constants';
import FilterPanel, { type AdvancedFilters } from './components/filter-panel';
import TimelineFilterChips from './components/timeline-filter-chips';
import TimelineQuickDetails from './components/timeline-quick-details';
import TimelineEmptyState from './components/timeline-empty-state';
import { TimelineFeedSkeleton } from './components/timeline-skeleton';
import EventCard from './components/event-card';

interface TimelineEventParticipant {
  id?: string;
  name?: string;
  avatar?: string;
  rsvpStatus?: string;
  member?: { name?: string; avatar?: string; firstName?: string; lastName?: string };
  memberId?: string;
}

interface TimelineEvent {
  id: string;
  title: string;
  eventType: string;
  date: string;
  time?: string;
  status?: string;
  visibility?: string;
  location?: string;
  description?: string;
  coverImage?: string;
  pinned?: boolean;
  featured?: boolean;
  verified?: boolean;
  subtitle?: string;
  story?: string;
  venue?: string;
  mapLink?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  organizer?: { name?: string; avatar?: string };
  organizerId?: string;
  userId?: string;
  family?: { name?: string; id?: string };
  familyId?: string;
  tags?: string[];
  keywords?: string[];
  language?: string;
  country?: string;
  media?: { url: string; type: string }[];
  mediaUrls?: { url: string; type: string }[];
  documents?: { name?: string; title?: string; url?: string }[];
  participants?: TimelineEventParticipant[];
  _count?: { comments?: number; reactions?: number; documents?: number; media?: number };
  createdAt?: string;
  updatedAt?: string;
  displayId?: string;
  userRsvpStatus?: string;
  info?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

type EventItem = TimelineEvent;

const PAGE_LIMIT = 20;

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.04 } },
};

function readSearchParams(sp: URLSearchParams): AdvancedFilters {
  return {
    search: sp.get('search') || '',
    category: sp.get('category') || '',
    eventType: sp.get('eventType') || '',
    visibility: sp.get('visibility') || '',
    familyId: sp.get('familyId') || '',
    dateFrom: sp.get('dateFrom') || '',
    dateTo: sp.get('dateTo') || '',
    datePreset: sp.get('datePreset') || '',
    status: sp.get('status') || '',
    verification: sp.get('verification') || '',
    documents: sp.get('documents') || '',
  };
}

function writeSearchParams(filters: AdvancedFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
  return params.toString();
}

function getTimePeriod(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart); todayEnd.setDate(todayEnd.getDate() + 1);
  const weekEnd = new Date(todayStart); weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  if (d >= todayStart && d < todayEnd) return 'Today';
  if (d >= todayStart && d < weekEnd) return 'This Week';
  if (d >= new Date(now.getFullYear(), now.getMonth(), 1) && d <= monthEnd) return 'This Month';
  if (d.getFullYear() === now.getFullYear()) return String(now.getFullYear());
  return 'Earlier';
}

const PERIOD_ORDER = ['Today', 'This Week', 'This Month'];

function groupEventsByTimePeriod(events: EventItem[]) {
  const groups: { label: string; year: number; events: EventItem[] }[] = [];
  const buckets = new Map<string, EventItem[]>();

  for (const event of events) {
    const period = getTimePeriod(event.date);
    if (!buckets.has(period)) buckets.set(period, []);
    buckets.get(period)!.push(event);
  }

  for (const label of PERIOD_ORDER) {
    const evts = buckets.get(label);
    if (evts && evts.length > 0) {
      groups.push({ label, year: new Date().getFullYear(), events: evts });
      buckets.delete(label);
    }
  }

  const yearBuckets = new Map<number, EventItem[]>();
  for (const [, evts] of buckets) {
    for (const ev of evts) {
      const y = new Date(ev.date).getFullYear();
      if (!yearBuckets.has(y)) yearBuckets.set(y, []);
      yearBuckets.get(y)!.push(ev);
    }
  }

  const sortedYears = Array.from(yearBuckets.keys()).sort((a, b) => b - a);
  for (const year of sortedYears) {
    groups.push({ label: String(year), year, events: yearBuckets.get(year)! });
  }

  return groups;
}

const VIS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ONLY_ME: EyeOff, FAMILY: Users, SUB_CLAN: Users2, CLAN: Globe, COMMUNITY: Globe, PUBLIC: Globe,
};

const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

const FeedCard = memo(function FeedCard({
  event,
  index,
  isSelected,
  onSelect,
}: {
  event: EventItem;
  index: number;
  isSelected: boolean;
  onSelect: (e: EventItem) => void;
}) {
  const config = getEventConfig(event.eventType);
  const eventStatus = getEventStatus(event.date, event.status || 'PUBLISHED');
  const VisIcon = VIS_ICONS[event.visibility || ''] || Globe;
  const participants = event.participants || [];
  const visibleParticipants = participants.slice(0, 3);
  const extraCount = Math.max(0, participants.length - 3);
  const docCount = event._count?.documents || event.documents?.length || 0;
  const photoCount = event._count?.media || event.media?.length || 0;
  const commentCount = event._count?.comments || 0;
  const reactionCount = event._count?.reactions || 0;

  const handleSelect = useCallback(() => onSelect(event), [event, onSelect]);

  return (
    <motion.article
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      role="article"
      aria-label={event.title}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelect(); } }}
      onClick={handleSelect}
      className={`group relative cursor-pointer overflow-hidden rounded-2xl border bg-white transition-all duration-200 dark:bg-slate-900 ${
        isSelected
          ? 'border-emerald-300 shadow-lg ring-1 ring-emerald-300/20 dark:border-emerald-700 dark:ring-emerald-700/20'
          : 'border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
      }`}
    >
      <div className="p-5">
        {/* Header: Avatar + Author + Time + Menu */}
        <div className="flex items-start gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg ring-2 ring-white dark:ring-slate-900 ${config.color}`}>
            {config.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {event.title}
              </h3>
              {event.verified && (
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500" />
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-current" style={{ color: 'inherit' }} />
                {config.label}
              </span>
              <span aria-hidden="true">Â·</span>
              <time>{formatRelative(event.date)}</time>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); }}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 opacity-0 transition-all hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            aria-label="More actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>

        {/* Cover image */}
        {event.coverImage && (
          <div className="mt-4 overflow-hidden rounded-xl">
            <img
              src={event.coverImage}
              alt={`${event.title} cover`}
              className="h-auto max-h-[200px] w-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Meta row: Type + Location + Date */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="text-sm">{config.icon}</span>
            {config.label}
          </span>
          {event.location && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {event.location}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            {formatDate(event.date)}
          </span>
          {event.time && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              {formatTime(event.time)}
            </span>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-3">
            {event.description}
          </p>
        )}

        {/* Participants row */}
        {participants.length > 0 && (
          <div className="mt-4 flex items-center gap-2">
            <div className="flex -space-x-2">
              {visibleParticipants.map((p, i: number) => {
                const avatarUrl = p.avatar || p.member?.avatar;
                const name = p.name || p.member?.name || '?';
                return (
                  <div
                    key={i}
                    className="relative h-7 w-7 overflow-hidden rounded-full border-2 border-white ring-1 ring-slate-100 dark:border-slate-900 dark:ring-slate-800"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-200 text-[9px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                        {name[0]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {extraCount > 0 && (
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                +{extraCount} more
              </span>
            )}
          </div>
        )}

        {/* Stats row: Docs + Photos + Visibility */}
        <div className="mt-4 flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
          {docCount > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              {docCount} {docCount === 1 ? 'Document' : 'Documents'}
            </span>
          )}
          {photoCount > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" />
              {photoCount} {photoCount === 1 ? 'Photo' : 'Photos'}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <VisIcon className="h-3.5 w-3.5" />
          </span>
          {eventStatus === 'today' && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
              Today
            </span>
          )}
          {eventStatus === 'upcoming' && (
            <span className="text-xs font-medium text-blue-500">
              {calcCountdown(event.date)}
            </span>
          )}
        </div>
      </div>

      {/* Action bar */}
      <div className="border-t border-slate-100 px-5 py-2.5 dark:border-slate-800">
        <div className="flex items-center gap-1">
          {commentCount > 0 && (
            <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800">
              <MessageCircle className="h-4 w-4" />
              {commentCount}
            </button>
          )}
          {reactionCount > 0 && (
            <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800">
              <Heart className="h-4 w-4" />
              {reactionCount}
            </button>
          )}
          <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800">
            <Link2 className="h-4 w-4" />
            Share
          </button>
          <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800">
            <Bookmark className="h-4 w-4" />
            Save
          </button>
        </div>
      </div>
    </motion.article>
  );
});

function TimePeriodSection({
  label,
  events,
  selectedIndex,
  onSelectEvent,
}: {
  label: string;
  events: EventItem[];
  selectedIndex: string | null;
  onSelectEvent: (e: EventItem) => void;
}) {
  return (
    <section aria-label={`${label} events`} className="mb-8 scroll-mt-28">
      <div className="sticky top-20 z-10 mb-4 -mx-4 flex items-center gap-3 bg-white/90 px-4 py-2 backdrop-blur-xl dark:bg-slate-900/90">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {label}
        </h2>
        <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {events.length}
        </span>
      </div>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-4"
      >
        {events.map((event, i) => (
          <FeedCard
            key={event.id || i}
            event={event}
            index={i}
            isSelected={selectedIndex === event.id}
            onSelect={onSelectEvent}
          />
        ))}
      </motion.div>
    </section>
  );
}

function YearDivider({ year }: { year: number }) {
  return (
    <div className="sticky top-20 z-10 -mx-4 bg-white/90 px-4 py-3 backdrop-blur-xl dark:bg-slate-900/90">
      <div className="relative flex items-center">
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        <span className="mx-4 rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-bold text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          {year}
        </span>
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}

interface TimelineStats {
  total?: number;
  participants?: number;
  totalDocuments?: number;
  countries?: number;
  [key: string]: unknown;
}

function StatsSidebar({ stats, loading }: { stats: TimelineStats | null; loading: boolean }) {
  if (loading && !stats) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-slate-200/60 bg-white/80 p-3.5 shadow-sm backdrop-blur-xl animate-pulse dark:border-slate-800/60 dark:bg-slate-900/80">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800" />
            <div className="space-y-1.5">
              <div className="h-4 w-12 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-2.5 w-16 rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const items = [
    { icon: <Calendar className="h-4 w-4" />, label: 'Total Events', value: stats?.total || 0, bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
    { icon: <Users className="h-4 w-4" />, label: 'Participants', value: stats?.participants || 0, bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
    { icon: <FileText className="h-4 w-4" />, label: 'Documents', value: stats?.totalDocuments || 0, bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400' },
    { icon: <Globe className="h-4 w-4" />, label: 'Countries', value: stats?.countries || 0, bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-600 dark:text-cyan-400' },
  ];

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 rounded-xl border border-slate-200/60 bg-white/80 p-3.5 shadow-sm backdrop-blur-xl transition-all hover:shadow-md dark:border-slate-800/60 dark:bg-slate-900/80"
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.bg} ${item.text}`}>
            {item.icon}
          </div>
          <div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{item.value}</p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{item.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function UpcomingList({ events }: { events: EventItem[] }) {
  const upcoming = useMemo(() => {
    const now = Date.now();
    return events
      .filter((e) => new Date(e.date).getTime() > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [events]);

  if (upcoming.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        Upcoming
      </h3>
      <div className="space-y-2">
        {upcoming.map((event, i) => {
          const config = getEventConfig(event.eventType);
          return (
            <Link
              key={event.id || i}
              href={`/dashboard/timeline/${event.id}`}
              className="flex items-center gap-3 rounded-xl border border-slate-200/60 bg-white/80 px-3 py-2.5 shadow-sm backdrop-blur-xl transition-all hover:shadow-md hover:border-slate-300 dark:border-slate-800/60 dark:bg-slate-900/80 dark:hover:border-slate-700"
            >
              <span className="text-base">{config.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-900 dark:text-white">{event.title}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">{calcCountdown(event.date)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/60 bg-white/80 py-20 shadow-sm backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/80"
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20">
        <AlertCircle className="h-7 w-7 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Something went wrong</h3>
      <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">We couldn't load your timeline events.</p>
      <button
        onClick={onRetry}
        className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:shadow-md"
      >
        <RefreshCw className="h-4 w-4" />
        Try Again
      </button>
    </motion.div>
  );
}

export default function TimelinePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState<TimelineStats | null>(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [filters, setFilters] = useState<AdvancedFilters>(() => readSearchParams(searchParams));

  const hasActiveFilters = useMemo(() => Object.values(filters).some(Boolean) || selectedTypes.length > 0, [filters, selectedTypes]);

  const updateUrl = useCallback((f: AdvancedFilters) => {
    const qs = writeSearchParams(f);
    router.replace(`/dashboard/timeline${qs ? '?' + qs : ''}`, { scroll: false });
  }, [router]);

  const handleFilterChange = useCallback((f: AdvancedFilters) => {
    setFilters(f);
    setPage(1);
    setEvents([]);
    updateUrl(f);
  }, [updateUrl]);

  const handleToggleType = useCallback((type: string) => {
    setSelectedTypes((prev) => {
      const next = prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type];
      setPage(1);
      setEvents([]);
      return next;
    });
  }, []);

  const handleClearTypes = useCallback(() => {
    setSelectedTypes([]);
    setPage(1);
    setEvents([]);
  }, []);

  const fetchEvents = useCallback(async (p: number, append = false) => {
    if (append) setLoadingMore(true);
    else setLoading(true);

    try {
      const params: Record<string, string | number> = { page: p, limit: PAGE_LIMIT };
      if (filters.search) params.search = filters.search;
      if (filters.eventType) params.eventType = filters.eventType;
      if (filters.visibility) params.visibility = filters.visibility;
      if (filters.familyId) params.familyId = filters.familyId;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.status) params.status = filters.status;
      if (selectedTypes.length === 1) params.eventType = selectedTypes[0];

      const res = await api.timeline.list(params);
      const evts = res?.events || [];

      setEvents((prev) => append ? [...prev, ...evts] : evts);
      setTotalPages(res?.totalPages || 1);
      setPage(p);
      setError(null);
    } catch {
      if (!append) setEvents([]);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, selectedTypes]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    api.timeline.stats().then((s) => setStats(s)).catch(() => {});
    fetchEvents(1);
  }, [user]);

  useEffect(() => {
    fetchEvents(1);
  }, [selectedTypes]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setFilters((prev) => ({ ...prev, search: searchQuery }));
      setPage(1);
      setEvents([]);
    },
    [searchQuery],
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setFilters((prev) => ({ ...prev, search: '' }));
    setPage(1);
    setEvents([]);
  }, []);

  const handleSelectEvent = useCallback((event: EventItem) => {
    setSelectedEvent((prev) => (prev?.id === event.id ? null : event));
  }, []);

  const handleRetry = useCallback(() => {
    setError(null);
    fetchEvents(1);
  }, [fetchEvents]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && !loadingMore && page < totalPages) {
          fetchEvents(page + 1, true);
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading, loadingMore, page, totalPages, fetchEvents]);

  const groupedEvents = useMemo(() => groupEventsByTimePeriod(events), [events]);

  const filteredEventCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const ev of events) {
      counts[ev.eventType] = (counts[ev.eventType] || 0) + 1;
    }
    return counts;
  }, [events]);

  const isLoading = loading && events.length === 0;

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-emerald-500 dark:border-slate-600 dark:border-t-emerald-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Skip link for accessibility */}
      <a
        href="#timeline-feed"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-emerald-600 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none"
      >
        Skip to timeline events
      </a>

      {/* â”€â”€â”€ Header â”€â”€â”€ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Timeline</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {stats?.total ? `${stats.total} events in your family history` : 'Your family history and events'}
            </p>
          </div>
          <Link
            href="/dashboard/timeline/new"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            New Event
          </Link>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="relative mt-6">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events, people, places..."
            className="w-full rounded-2xl border border-slate-200/60 bg-white/80 py-3 pl-11 pr-12 text-sm text-slate-900 placeholder-slate-400 shadow-sm backdrop-blur-xl transition-all focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-200/50 dark:border-slate-800/60 dark:bg-slate-900/80 dark:text-white dark:placeholder-slate-500 dark:focus:border-emerald-700 dark:focus:ring-emerald-800/30"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </form>

        {/* Filter chips */}
        <div className="mt-4">
          <TimelineFilterChips
            selectedTypes={selectedTypes}
            onToggleType={handleToggleType}
            onClearAll={handleClearTypes}
            eventCounts={filteredEventCounts}
          />
        </div>
      </motion.div>

      {/* â”€â”€â”€ 3-Column Layout â”€â”€â”€ */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[240px_1fr_320px]">

        {/* LEFT SIDEBAR â€” Stats + Upcoming */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-6">
            <div>
              <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Overview
              </h2>
              <StatsSidebar stats={stats} loading={loading} />
            </div>
            <UpcomingList events={events} />
          </div>
        </aside>

        {/* CENTER â€” Feed */}
        <main id="timeline-feed" role="feed" aria-label="Timeline events" aria-busy={isLoading || loadingMore}>
          {isLoading ? (
            <TimelineFeedSkeleton count={6} />
          ) : error && events.length === 0 ? (
            <ErrorState onRetry={handleRetry} />
          ) : events.length === 0 ? (
            <TimelineEmptyState onCreateEvent={() => router.push('/dashboard/timeline/new')} />
          ) : (
            <>
              {groupedEvents.map((group) => (
                <div key={group.label}>
                  {PERIOD_ORDER.includes(group.label) ? (
                    <TimePeriodSection
                      label={group.label}
                      events={group.events}
                      selectedIndex={selectedEvent?.id || null}
                      onSelectEvent={handleSelectEvent}
                    />
                  ) : (
                    <>
                      <YearDivider year={group.year} />
                      <TimePeriodSection
                        label={group.label}
                        events={group.events}
                        selectedIndex={selectedEvent?.id || null}
                        onSelectEvent={handleSelectEvent}
                      />
                    </>
                  )}
                </div>
              ))}

              {/* Sentinel for infinite scroll */}
              <div ref={sentinelRef} className="py-8">
                {loadingMore ? (
                  <TimelineFeedSkeleton count={3} />
                ) : page < totalPages ? (
                  <button
                    onClick={() => fetchEvents(page + 1, true)}
                    className="mx-auto flex items-center gap-2 rounded-xl border border-slate-200/60 bg-white/80 px-5 py-2.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-xl transition-all hover:shadow-md dark:border-slate-800/60 dark:bg-slate-900/80 dark:text-slate-400"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                    Load more events
                  </button>
                ) : events.length > 0 ? (
                  <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                    You've reached the end of your timeline
                  </p>
                ) : null}
              </div>
            </>
          )}
        </main>

        {/* RIGHT SIDEBAR â€” Quick Details */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <TimelineQuickDetails
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
            />
          </div>
        </aside>
      </div>

      {/* â”€â”€â”€ Mobile Bottom Sheet for Quick Details â”€â”€â”€ */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-x-0 bottom-0 z-50 lg:hidden"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="h-1 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
              </div>
              <TimelineQuickDetails
                event={selectedEvent}
                onClose={() => setSelectedEvent(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* â”€â”€â”€ Advanced Filter Slide-over â”€â”€â”€ */}
      <AnimatePresence>
        {showFilters && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={() => setShowFilters(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto border-l border-slate-200/60 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/95"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Advanced Filters</h2>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="p-5">
                <FilterPanel
                  filters={filters}
                  onChange={(f) => { handleFilterChange(f); setShowFilters(false); }}
                  onClose={() => setShowFilters(false)}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
