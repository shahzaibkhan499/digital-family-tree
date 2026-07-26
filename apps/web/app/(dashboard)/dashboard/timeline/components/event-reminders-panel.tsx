'use client';

import { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, MessageSquare, Plus, Trash2, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api-client';

interface Reminder {
  id: string;
  date: string;
  channel: string;
  message: string;
  createdAt?: string;
}

interface EventRemindersPanelProps {
  eventId: string;
}

const CHANNEL_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  email: { icon: Mail, label: 'Email', color: 'text-blue-500' },
  push: { icon: Bell, label: 'Push', color: 'text-purple-500' },
  sms: { icon: MessageSquare, label: 'SMS', color: 'text-green-500' },
};

export default function EventRemindersPanel({ eventId }: EventRemindersPanelProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [channel, setChannel] = useState('email');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    api.timeline.reminders.list(eventId)
      .then(r => setReminders(r.reminders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId]);

  const handleCreate = async () => {
    if (!date || !time || !message.trim() || submitting) return;
    setSubmitting(true);
    try {
      const reminder = await api.timeline.reminders.create(eventId, {
        date: `${date}T${time}`,
        channel,
        message: message.trim(),
      });
      setReminders(prev => [...prev, reminder].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      setDate('');
      setTime('');
      setMessage('');
      setShowForm(false);
    } catch { /* empty */ } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await api.timeline.reminders.delete(eventId, id);
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch { /* empty */ } finally { setDeletingId(null); }
  };

  const now = Date.now();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Reminders</h4>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-3 w-3" />
          Add Reminder
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900/30 dark:bg-emerald-900/10 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Time</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Channel</label>
            <div className="flex gap-2">
              {Object.entries(CHANNEL_CONFIG).map(([key, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setChannel(key)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      channel === key
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Message</label>
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Reminder message..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={!date || !time || !message.trim() || submitting}
              className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Creating...' : 'Create Reminder'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
        </div>
      ) : reminders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white py-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <Bell className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="text-xs text-slate-500 dark:text-slate-400">No reminders set</p>
        </div>
      ) : (
        <div className="space-y-2">
          {reminders.map(r => {
            const isPast = new Date(r.date).getTime() < now;
            const chCfg = CHANNEL_CONFIG[r.channel] || CHANNEL_CONFIG.email;
            const ChIcon = chCfg.icon;
            return (
              <div
                key={r.id}
                className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                  isPast
                    ? 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 opacity-60'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 ${chCfg.color}`}>
                  <ChIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{r.message}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      <Clock className="h-3 w-3" />
                      {new Date(r.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </span>
                    {isPast ? (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <CheckCircle2 className="h-3 w-3" /> Past
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <AlertCircle className="h-3 w-3" /> Upcoming
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">via {chCfg.label}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(r.id)}
                  disabled={deletingId === r.id}
                  className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/10 dark:hover:text-red-400 transition-colors"
                >
                  {deletingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
