'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

const EVENT_TYPE_CONFIG: Record<string, { color: string; icon: string; label: string }> = {
  BIRTH: { color: 'emerald', icon: 'ðŸ‘¶', label: 'Birth' },
  MARRIAGE: { color: 'rose', icon: 'ðŸ’’', label: 'Marriage' },
  DEATH: { color: 'slate', icon: 'ðŸ•Šï¸', label: 'Death' },
  GRADUATION: { color: 'blue', icon: 'ðŸŽ“', label: 'Graduation' },
  ANNIVERSARY: { color: 'rose', icon: 'ðŸ’', label: 'Anniversary' },
  EDUCATION: { color: 'blue', icon: 'ðŸ“š', label: 'Education' },
  CAREER: { color: 'purple', icon: 'ðŸ’¼', label: 'Career' },
  TRAVEL: { color: 'orange', icon: 'âœˆï¸', label: 'Travel' },
  FAMILY_REUNION: { color: 'emerald', icon: 'ðŸ‘¨â€ðŸ‘©â€ðŸ‘§â€ðŸ‘¦', label: 'Reunion' },
  CUSTOM_EVENT: { color: 'blue', icon: 'ðŸ“Œ', label: 'Event' },
  AWARD: { color: 'amber', icon: 'ðŸ†', label: 'Award' },
  MOVE: { color: 'purple', icon: 'ðŸ ', label: 'Relocation' },
  MILITARY_SERVICE: { color: 'green', icon: 'ðŸŽ–ï¸', label: 'Military' },
  IMMIGRATION: { color: 'cyan', icon: 'âœˆï¸', label: 'Immigration' },
  FAMILY_CREATED: { color: 'emerald', icon: 'ðŸ ', label: 'Family Created' },
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string; pulse?: boolean }> = {
  UPCOMING: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Upcoming' },
  TODAY: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', label: 'Today' },
  LIVE: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Live', pulse: true },
  COMPLETED: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', label: 'Completed' },
  CANCELLED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Cancelled' },
  POSTPONED: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Postponed' },
};

const colorClasses: Record<string, string> = {
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400',
  blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400',
  cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/20 dark:text-cyan-400',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
};

const BORDER_COLORS: Record<string, string> = {
  emerald: 'border-l-emerald-500',
  rose: 'border-l-rose-500',
  blue: 'border-l-blue-500',
  purple: 'border-l-purple-500',
  amber: 'border-l-amber-500',
  orange: 'border-l-orange-500',
  slate: 'border-l-slate-400',
  cyan: 'border-l-cyan-500',
  green: 'border-l-green-500',
};

function getEventConfig(eventType: string) {
  return EVENT_TYPE_CONFIG[eventType] || { color: 'slate', icon: 'ðŸ“Œ', label: eventType.replace(/_/g, ' ') };
}

function getEventStatus(dateStr: string | null, currentStatus?: string): string {
  if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED' || currentStatus === 'POSTPONED') return currentStatus;
  if (!dateStr) return 'UPCOMING';
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'COMPLETED';
  if (diffDays === 0) return 'TODAY';
  return 'UPCOMING';
}

function calcCountdown(dateStr: string | null): { label: string; urgent: boolean } {
  if (!dateStr) return { label: '', urgent: false };
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'Completed', urgent: false };
  if (diffDays === 0) return { label: 'Today!', urgent: true };
  if (diffDays === 1) return { label: 'Tomorrow', urgent: true };
  if (diffDays <= 7) return { label: `${diffDays} Days Left`, urgent: false };
  return { label: `${diffDays} Days`, urgent: false };
}

function formatDateShort(d: string | null | undefined): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTimelineDate(d: string | null | undefined): string {
  if (!d) return 'Unknown date';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const FILTER_PILLS = [
  { key: '', label: 'All Events' },
  ...Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => ({ key, label: `${cfg.icon} ${cfg.label}` })),
];

export default function FamilyTimelinePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const familyId = params.id as string;
  const [family, setFamily] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    eventType: 'CUSTOM_EVENT',
    date: '',
    time: '',
    location: '',
    venue: '',
    coverImage: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [rsvpSubmitting, setRsvpSubmitting] = useState<string | null>(null);

  const loadEvents = useCallback(async (pageNum: number, replace: boolean) => {
    try {
      const res = await api.timeline.byFamily(familyId, {
        page: pageNum,
        limit: 50,
        eventType: eventTypeFilter || undefined,
      });
      if (replace) {
        setEvents(res.events);
      } else {
        setEvents(prev => [...prev, ...res.events]);
      }
      setTotalPages(res.totalPages);
      setTotal(res.total);
    } catch { /* empty */ } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [familyId, eventTypeFilter]);

  useEffect(() => {
    if (!user) return;
    api.families.get(familyId).then(setFamily).catch(() => router.push('/dashboard/families'));
  }, [familyId, user, router]);

  useEffect(() => {
    if (!user) return;
    setEvents([]);
    setPage(1);
    setLoading(true);
    loadEvents(1, true);
  }, [user, loadEvents]);

  useEffect(() => {
    if (page > 1) loadEvents(page, false);
  }, [page, loadEvents]);

  const loadMore = () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    setPage(prev => prev + 1);
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      const data: any = {
        familyId,
        eventType: form.eventType,
        title: form.title.trim(),
        isAuto: false,
      };
      if (form.description.trim()) data.description = form.description.trim();
      if (form.date) data.date = new Date(form.date + (form.time ? `T${form.time}` : 'T12:00:00')).toISOString();
      if (form.time) data.time = form.time;
      if (form.location.trim()) data.location = form.location.trim();
      if (form.venue.trim()) data.venue = form.venue.trim();
      if (form.coverImage.trim()) data.coverImage = form.coverImage.trim();

      const event = await api.timeline.create(data);
      setEvents(prev => [event, ...prev]);
      setTotal(prev => prev + 1);
      setShowAddEvent(false);
      setForm({ title: '', description: '', eventType: 'CUSTOM_EVENT', date: '', time: '', location: '', venue: '', coverImage: '' });
    } catch { /* empty */ } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Delete this timeline event?')) return;
    setDeleting(eventId);
    try {
      await api.timeline.delete(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setTotal(prev => prev - 1);
    } catch { /* empty */ } finally {
      setDeleting(null);
    }
  };

  const handleRsvp = async (eventId: string, status: string) => {
    setRsvpSubmitting(eventId);
    try {
      await api.timeline.rsvp(eventId, status);
      setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, userRsvpStatus: status } : ev));
    } catch { /* empty */ } finally {
      setRsvpSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!family) return null;

  const groupedEvents: Record<string, any[]> = {};
  events.forEach(event => {
    const year = event.date ? new Date(event.date).getFullYear().toString() : 'Unknown';
    if (!groupedEvents[year]) groupedEvents[year] = [];
    groupedEvents[year].push(event);
  });
  const sortedYears = Object.keys(groupedEvents).sort((a, b) => {
    if (a === 'Unknown') return 1;
    if (b === 'Unknown') return -1;
    return parseInt(b) - parseInt(a);
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link href={`/dashboard/families/${familyId}`} className="text-sm text-emerald-600 hover:text-emerald-700">â† Back to {family.name}</Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{family.name} Timeline</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">{total} events in this family&apos;s history</p>
        </div>
        <button onClick={() => setShowAddEvent(!showAddEvent)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors">
          {showAddEvent ? 'Cancel' : '+ Add Event'}
        </button>
      </div>

      {showAddEvent && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 dark:border-emerald-800 dark:bg-emerald-900/10">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Add Timeline Event</h3>
          <form onSubmit={handleAddEvent} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Event Type</label>
                <select value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                  {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.icon} {cfg.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Date</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Title *</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Event title..." className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Location</label>
                <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Where..." className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Cover Image URL</label>
                <input type="url" value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} placeholder="https://..." className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              </div>
            </div>
            <button type="submit" disabled={submitting || !form.title.trim()} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              {submitting ? 'Adding...' : 'Add Event'}
            </button>
          </form>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {FILTER_PILLS.map(pill => (
          <button key={pill.key} onClick={() => setEventTypeFilter(pill.key)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            eventTypeFilter === pill.key ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
          }`}>{pill.label}</button>
        ))}
      </div>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <svg className="h-8 w-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No timeline events yet</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Add your first family event or let them be created automatically.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedYears.map(year => (
            <div key={year}>
              <div className="sticky top-0 z-10 mb-4 flex items-center gap-3">
                <div className="rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-bold text-white shadow-sm">{year}</div>
                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="ml-4 space-y-3 border-l-2 border-slate-200 pl-6 dark:border-slate-700">
                {groupedEvents[year].map(event => {
                  const config = getEventConfig(event.eventType);
                  const status = getEventStatus(event.date, event.status);
                  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.UPCOMING;
                  const countdown = calcCountdown(event.date);
                  const borderClass = BORDER_COLORS[config.color] || 'border-l-slate-400';
                  return (
                    <div key={event.id} className="relative group">
                      <div className={`absolute -left-[31px] top-3 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${colorClasses[config.color]?.split(' ')[0] || 'bg-slate-300'}`} />
                      <button onClick={() => router.push(`/dashboard/timeline/${event.id}`)} className={`w-full text-left rounded-xl border border-slate-200/80 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900 border-l-4 ${borderClass} overflow-hidden`}>
                        {event.coverImage ? (
                          <div className="relative h-24 w-full">
                            <img src={event.coverImage} alt={event.title} className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                            <div className="absolute top-2 left-2">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                                {statusCfg.pulse && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />}
                                {statusCfg.label}
                              </span>
                            </div>
                            {!countdown.urgent && countdown.label && status !== 'COMPLETED' && (
                              <div className="absolute top-2 right-2">
                                <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white">{countdown.label}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 p-4">
                            <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-lg ${colorClasses[config.color] || 'bg-slate-100 text-slate-600'}`}>{config.icon}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{event.title}</h3>
                                {event.isAuto && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">auto</span>}
                                <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${statusCfg.bg} ${statusCfg.text}`}>{statusCfg.label}</span>
                              </div>
                              {event.description && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">{event.description}</p>}
                              <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500">
                                {event.date && <span>{formatTimelineDate(event.date)}</span>}
                                {event.time && <span>{event.time}</span>}
                                {event.venue && <span className="truncate">{event.venue}</span>}
                                {event.location && <span className="truncate">ðŸ“ {event.location}</span>}
                                {event.member && <span>ðŸ‘¤ {event.member.firstName} {event.member.lastName}</span>}
                                {event.participants && <span>{event.participants.length || 0} going</span>}
                              </div>
                            </div>
                            {countdown.label && !countdown.urgent && status !== 'COMPLETED' && (
                              <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">{countdown.label}</span>
                            )}
                            {countdown.urgent && (
                              <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 animate-pulse">{countdown.label}</span>
                            )}
                          </div>
                        )}
                        {event.coverImage && (
                          <div className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{config.icon}</span>
                              <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{event.title}</h3>
                              <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${statusCfg.bg} ${statusCfg.text}`}>{statusCfg.label}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500">
                              {event.date && <span>{formatTimelineDate(event.date)}</span>}
                              {event.location && <span className="truncate">ðŸ“ {event.location}</span>}
                            </div>
                          </div>
                        )}
                      </button>
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                        {status !== 'COMPLETED' && status !== 'CANCELLED' && (
                          <button onClick={(e) => { e.stopPropagation(); handleRsvp(event.id, 'ACCEPTED'); }} disabled={rsvpSubmitting === event.id} className="rounded bg-emerald-100 p-1 text-emerald-600 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400" title="RSVP">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" /></svg>
                          </button>
                        )}
                        {family.ownerId === user?.id && (
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }} disabled={deleting === event.id} className="rounded bg-red-100 p-1 text-red-500 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400" title="Delete">
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && events.length > 0 && page < totalPages && (
        <div className="text-center">
          <button onClick={loadMore} disabled={loadingMore} className="rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            {loadingMore ? 'Loading...' : 'Load more events'}
          </button>
        </div>
      )}
    </div>
  );
}
