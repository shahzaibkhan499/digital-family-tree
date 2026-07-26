'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Plus, Pencil, Send, MessageCircle, UserCheck, Mail, FileText,
  Heart, Cake, Check, CheckCheck, X, Filter, Volume2, VolumeX,
  ChevronDown, Inbox, Settings, Clock,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { formatRelative } from './constants';

interface Notification {
  id: string;
  type: string;
  title: string;
  description?: string;
  eventId?: string;
  eventTitle?: string;
  isRead: boolean;
  createdAt: string;
  data?: Record<string, unknown>;
}

const NOTIFICATION_TYPES = [
  { id: 'event_created', label: 'Event Created', icon: Plus, color: 'text-emerald-500' },
  { id: 'event_updated', label: 'Event Updated', icon: Pencil, color: 'text-blue-500' },
  { id: 'event_published', label: 'Event Published', icon: Send, color: 'text-purple-500' },
  { id: 'comment_added', label: 'Comment Added', icon: MessageCircle, color: 'text-orange-500' },
  { id: 'rsvp_changed', label: 'RSVP Changed', icon: UserCheck, color: 'text-teal-500' },
  { id: 'invitation_sent', label: 'Invitation Sent', icon: Mail, color: 'text-pink-500' },
  { id: 'document_added', label: 'Document Added', icon: FileText, color: 'text-indigo-500' },
  { id: 'reminder', label: 'Reminder', icon: Bell, color: 'text-amber-500' },
  { id: 'anniversary', label: 'Anniversary', icon: Heart, color: 'text-rose-500' },
  { id: 'birthday', label: 'Birthday', icon: Cake, color: 'text-pink-400' },
];

function getNotificationTypeConfig(type: string) {
  return NOTIFICATION_TYPES.find(t => t.id === type) || { id: type, label: type, icon: Bell, color: 'text-slate-500' };
}

function NotificationSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EventNotificationCenter({ eventId }: { eventId: string }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [showFilter, setShowFilter] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.timeline.getActivity(eventId, 1, 50);
      const activities = Array.isArray(res?.activities) ? res.activities : [];
      const mapped: Notification[] = activities.map((a: any) => ({
        id: a.id,
        type: a.type || 'event_updated',
        title: a.description || a.title || 'Activity',
        description: a.details || a.message,
        eventId: a.eventId || eventId,
        eventTitle: a.eventTitle,
        isRead: a.read ?? false,
        createdAt: a.createdAt,
        data: a.data,
      }));
      setNotifications(mapped);
    } catch { /* empty */ } finally { setLoading(false); }
  }, [eventId]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  useEffect(() => {
    intervalRef.current = setInterval(fetchNotifications, 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchNotifications]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const filteredNotifications = notifications
    .filter(n => filterType === 'all' || n.type === filterType);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="h-4 w-4 text-slate-500" />
            {unreadCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Notifications</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowFilter(!showFilter)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300">
            <Filter className="h-4 w-4" />
          </button>
          <button onClick={() => setShowSettings(!showSettings)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300">
            <Settings className="h-4 w-4" />
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead}
              className="rounded-lg px-2 py-1 text-[11px] font-medium text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20">
              <CheckCheck className="mr-1 inline h-3 w-3" /> Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Settings panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <h4 className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Notification Preferences</h4>
                <div className="space-y-2">
                  <label className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {soundEnabled ? <Volume2 className="h-3.5 w-3.5 text-slate-500" /> : <VolumeX className="h-3.5 w-3.5 text-slate-400" />}
                      <span className="text-xs text-slate-600 dark:text-slate-400">Sound</span>
                    </div>
                    <button onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`relative h-5 w-9 rounded-full transition-colors ${soundEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </label>
                  <label className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-slate-500" />
                      <span className="text-xs text-slate-600 dark:text-slate-400">Email</span>
                    </div>
                    <button onClick={() => setEmailEnabled(!emailEnabled)}
                      className={`relative h-5 w-9 rounded-full transition-colors ${emailEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${emailEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </label>
                  <label className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-3.5 w-3.5 text-slate-500" />
                      <span className="text-xs text-slate-600 dark:text-slate-400">Push</span>
                    </div>
                    <button onClick={() => setPushEnabled(!pushEnabled)}
                      className={`relative h-5 w-9 rounded-full transition-colors ${pushEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${pushEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                  </label>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter dropdown */}
        <AnimatePresence>
          {showFilter && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden">
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => { setFilterType('all'); setShowFilter(false); }}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                    filterType === 'all' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                  }`}>All</button>
                {NOTIFICATION_TYPES.map(t => {
                  const hasType = notifications.some(n => n.type === t.id);
                  if (!hasType) return null;
                  return (
                    <button key={t.id} onClick={() => { setFilterType(t.id); setShowFilter(false); }}
                      className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                        filterType === t.id ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'
                      }`}>{t.label}</button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Notification list */}
        {loading ? (
          <NotificationSkeleton />
        ) : filteredNotifications.length === 0 ? (
          <div className="py-10 text-center">
            <Inbox className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
              {notifications.length === 0 ? 'No notifications yet.' : 'No notifications match this filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <AnimatePresence>
              {filteredNotifications.map(n => {
                const cfg = getNotificationTypeConfig(n.type);
                const NIcon = cfg.icon;
                return (
                  <motion.div key={n.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                    onClick={() => markAsRead(n.id)}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors ${
                      n.isRead
                        ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        : 'bg-emerald-50/50 hover:bg-emerald-50 dark:bg-emerald-900/10 dark:hover:bg-emerald-900/20'
                    }`}>
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      n.isRead ? 'bg-slate-100 dark:bg-slate-800' : 'bg-emerald-100 dark:bg-emerald-900/30'
                    }`}>
                      <NIcon className={`h-4 w-4 ${n.isRead ? 'text-slate-400 dark:text-slate-500' : cfg.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-xs font-medium ${n.isRead ? 'text-slate-600 dark:text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {n.title}
                        </p>
                        {!n.isRead && <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />}
                      </div>
                      {n.description && (
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-500 line-clamp-2">{n.description}</p>
                      )}
                      {n.eventTitle && (
                        <p className="mt-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">{n.eventTitle}</p>
                      )}
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
                        <Clock className="h-3 w-3" />
                        {formatRelative(n.createdAt)}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
