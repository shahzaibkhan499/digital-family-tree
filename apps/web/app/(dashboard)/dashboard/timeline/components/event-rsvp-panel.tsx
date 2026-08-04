'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CheckCircle,
  HelpCircle,
  QrCode,
  Download,
  Printer,
  Search,
  Send,
  Mail,
  ChevronDown,
  X,
  MapPin,
  Camera,
  Smartphone,
  Hand,
  Eye,
  Plus,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { formatRelative } from './constants';

interface Participant {
  id: string;
  userId: string;
  name?: string;
  avatar?: string;
  email?: string;
  rsvpStatus: string;
  checkedIn?: boolean;
  checkedInAt?: string;
  attendanceMethod?: string;
  responseDate?: string;
  respondedAt?: string;
  user?: { id: string; name: string; email?: string; avatar?: string };
}

interface RsvpStats {
  total: number;
  accepted: number;
  maybe: number;
  declined: number;
  pending: number;
  checkedIn: number;
  attended: number;
  missed: number;
}

const RSVP_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> =
  {
    ACCEPTED: {
      label: 'Accepted',
      color: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-900/30',
      icon: CheckCircle,
    },
    MAYBE: {
      label: 'Maybe',
      color: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      icon: HelpCircle,
    },
    DECLINED: {
      label: 'Declined',
      color: 'text-rose-700 dark:text-rose-400',
      bg: 'bg-rose-100 dark:bg-rose-900/30',
      icon: UserX,
    },
    PENDING: {
      label: 'Pending',
      color: 'text-slate-600 dark:text-slate-400',
      bg: 'bg-slate-100 dark:bg-slate-800',
      icon: Clock,
    },
    CHECKED_IN: {
      label: 'Checked In',
      color: 'text-blue-700 dark:text-blue-400',
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      icon: MapPin,
    },
    ATTENDED: {
      label: 'Attended',
      color: 'text-purple-700 dark:text-purple-400',
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      icon: Eye,
    },
    MISSED: {
      label: 'Missed',
      color: 'text-slate-500 dark:text-slate-500',
      bg: 'bg-slate-100 dark:bg-slate-800',
      icon: X,
    },
  };

const ATTENDANCE_METHODS = [
  { id: 'MANUAL', label: 'Manual', icon: Hand },
  { id: 'QR_CODE', label: 'QR Code', icon: QrCode },
  { id: 'GPS', label: 'GPS', icon: MapPin },
  { id: 'PHOTO', label: 'Photo', icon: Camera },
];

function StatBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-medium text-slate-600 dark:text-slate-400">{label}</span>
        <span className="text-slate-500 dark:text-slate-500">{count}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function EventRsvpPanel({
  eventId,
  isOwner,
}: {
  eventId: string;
  isOwner: boolean;
}) {
  const { user } = useAuth();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [stats, setStats] = useState<RsvpStats>({
    total: 0,
    accepted: 0,
    maybe: 0,
    declined: 0,
    pending: 0,
    checkedIn: 0,
    attended: 0,
    missed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [checkInMode, setCheckInMode] = useState(false);
  const [attendanceMethod, setAttendanceMethod] = useState('MANUAL');
  const [showQr, setShowQr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);

  const fetchParticipants = useCallback(async () => {
    try {
      const res = await api.timeline.participants(eventId);
      const list = Array.isArray(res?.participants) ? res.participants : [];
      const mapped = list.map((p: Participant) => ({
        ...p,
        name: p.name || p.user?.name,
        email: p.email || p.user?.email,
        avatar: p.avatar || p.user?.avatar,
      }));
      setParticipants(mapped);
      if (res?.stats) {
        setStats({
          total: res.stats.total || list.length,
          accepted: res.stats.accepted || 0,
          maybe: res.stats.maybe || 0,
          declined: res.stats.declined || 0,
          pending: res.stats.pending || 0,
          checkedIn: res.stats.checkedIn || 0,
          attended: res.stats.attended || 0,
          missed: res.stats.missed || 0,
        });
      } else {
        const s: RsvpStats = {
          total: list.length,
          accepted: 0,
          maybe: 0,
          declined: 0,
          pending: 0,
          checkedIn: 0,
          attended: 0,
          missed: 0,
        };
        list.forEach((p: Participant) => {
          const st = (p.rsvpStatus || 'PENDING').toUpperCase();
          if (st in s && st !== 'TOTAL') (s as any)[st]++;
        });
        setStats(s);
      }
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const handleInvite = async () => {
    if (!inviteEmail.trim() || sending) return;
    setSending(true);
    try {
      await api.eventInvitations.create({ eventId, email: inviteEmail.trim() });
      setInviteEmail('');
      setShowInvite(false);
      await fetchParticipants();
    } catch {
      /* empty */
    } finally {
      setSending(false);
    }
  };

  const handleBulkInvite = async () => {
    if (!inviteEmail.trim() || sending) return;
    setSending(true);
    try {
      const emails = inviteEmail
        .split(/[,;\n]/)
        .map((e) => e.trim())
        .filter(Boolean);
      for (const email of emails) {
        await api.eventInvitations.create({ eventId, email });
      }
      setInviteEmail('');
      setShowInvite(false);
      await fetchParticipants();
    } catch {
      /* empty */
    } finally {
      setSending(false);
    }
  };

  const handleCheckInToggle = async (p: Participant) => {
    if (!p.userId || checkingInId) return;
    setCheckingInId(p.userId);
    try {
      if (p.checkedIn) {
        await api.timeline.checkOut(eventId, p.userId);
      } else {
        await api.timeline.checkIn(eventId, p.userId, attendanceMethod);
      }
      await fetchParticipants();
    } catch {
      /* empty */
    } finally {
      setCheckingInId(null);
    }
  };

  const exportCsv = () => {
    const header = 'Name,Email,RSVP Status,Checked In,Response Date\n';
    const rows = participants
      .map(
        (p) =>
          `"${p.name || ''}","${p.email || ''}","${p.rsvpStatus || 'PENDING'}","${p.checkedIn ? 'Yes' : 'No'}","${p.responseDate || p.respondedAt || ''}"`,
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `guest-list-${eventId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const sendReminders = async () => {
    const pending = participants.filter((p) => (p.rsvpStatus || '').toUpperCase() === 'PENDING');
    if (pending.length === 0) return;
    setSending(true);
    try {
      for (const p of pending) {
        await api.eventInvitations.create({
          eventId,
          email: p.email,
          message: 'Reminder: Please respond to the event invitation.',
        });
      }
    } catch {
      /* empty */
    } finally {
      setSending(false);
    }
  };

  const filteredParticipants = participants.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q);
  });

  const totalResponded = stats.accepted + stats.maybe + stats.declined;

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse flex items-center gap-3 rounded-lg bg-slate-100 p-3 dark:bg-slate-800"
            >
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-2 w-1/4 rounded bg-slate-100 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">RSVP</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {stats.total}
          </span>
        </div>
        {isOwner && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCheckInMode(!checkInMode)}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                checkInMode
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400'
              }`}
            >
              <QrCode className="h-3 w-3" /> Check-in
            </button>
            <button
              onClick={() => setShowInvite(!showInvite)}
              className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-3 w-3" /> Invite
            </button>
          </div>
        )}
      </div>

      <div className="p-4">
        {/* Stats bar */}
        <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
          <StatBar
            label="Accepted"
            count={stats.accepted}
            total={stats.total}
            color="bg-emerald-500"
          />
          <StatBar label="Maybe" count={stats.maybe} total={stats.total} color="bg-amber-500" />
          <StatBar
            label="Declined"
            count={stats.declined}
            total={stats.total}
            color="bg-rose-500"
          />
          <StatBar label="Pending" count={stats.pending} total={stats.total} color="bg-slate-400" />
          <StatBar
            label="Checked In"
            count={stats.checkedIn}
            total={stats.total}
            color="bg-blue-500"
          />
          <StatBar
            label="Attended"
            count={stats.attended}
            total={stats.total}
            color="bg-purple-500"
          />
        </div>

        {/* Check-in mode banner */}
        <AnimatePresence>
          {checkInMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/30 dark:bg-blue-900/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                    Check-in Mode Active
                  </span>
                  <button
                    onClick={() => setCheckInMode(false)}
                    className="text-blue-400 hover:text-blue-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 flex gap-2">
                  {ATTENDANCE_METHODS.map((m) => {
                    const MIcon = m.icon;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setAttendanceMethod(m.id)}
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                          attendanceMethod === m.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-blue-600 hover:bg-blue-100 dark:bg-slate-800 dark:text-blue-400'
                        }`}
                      >
                        <MIcon className="h-3 w-3" /> {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Owner actions */}
        {isOwner && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            <button
              onClick={exportCsv}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <Download className="h-3 w-3" /> Export CSV
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <Printer className="h-3 w-3" /> Print Sheet
            </button>
            <button
              onClick={sendReminders}
              disabled={sending}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              <Send className="h-3 w-3" /> Remind Pending
            </button>
          </div>
        )}

        {/* Invite form */}
        <AnimatePresence>
          {showInvite && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Send Invitations
                  </span>
                  <button
                    onClick={() => setShowInvite(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <textarea
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Enter emails separated by commas..."
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    onClick={handleInvite}
                    disabled={!inviteEmail.trim() || sending}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {sending ? 'Sending...' : 'Send Invite'}
                  </button>
                  <button
                    onClick={handleBulkInvite}
                    disabled={!inviteEmail.trim() || sending}
                    className="rounded-lg bg-purple-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                  >
                    Bulk Invite
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guests..."
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-700 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Participant list */}
        {filteredParticipants.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">No RSVPs yet.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredParticipants.map((p) => {
              const statusKey = (p.rsvpStatus || 'PENDING').toUpperCase();
              const stCfg = RSVP_STATUS_CONFIG[statusKey] || RSVP_STATUS_CONFIG.PENDING;
              const StIcon = stCfg.icon;
              return (
                <div
                  key={p.id}
                  onClick={() => checkInMode && handleCheckInToggle(p)}
                  className={`flex items-center gap-3 rounded-lg p-2.5 transition-colors ${
                    checkInMode
                      ? 'hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                    {p.avatar ? (
                      <img src={p.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        {(p.name || 'U')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                      {p.name || 'Unknown'}
                    </p>
                    {p.email && (
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                        {p.email}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {checkingInId === p.userId && (
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        ...
                      </span>
                    )}
                    {p.checkedIn && (
                      <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        In
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium ${stCfg.bg} ${stCfg.color}`}
                    >
                      <StIcon className="h-3 w-3" /> {stCfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {p.responseDate && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {formatRelative(p.responseDate)}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowQr(showQr === p.id ? null : p.id);
                      }}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                    >
                      <QrCode className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QR Code modal */}
      <AnimatePresence>
        {showQr && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowQr(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="w-full max-w-xs rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Check-in QR Code
                </h3>
                <div className="mt-4 flex justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`checkin:${eventId}:${showQr}`)}`}
                    alt="QR Code"
                    className="rounded-lg"
                  />
                </div>
                <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">
                  Scan to check in
                </p>
                <button
                  onClick={() => setShowQr(null)}
                  className="mt-4 rounded-lg bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
