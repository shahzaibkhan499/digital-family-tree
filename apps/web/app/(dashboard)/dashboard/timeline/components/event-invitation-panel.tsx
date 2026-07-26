'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Users, UserPlus, Check, X as XIcon, Clock, HelpCircle, Mail, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface Invitation {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  status: string;
  message?: string;
  scope?: string;
  createdAt: string;
}

interface InvitationStats {
  total: number;
  accepted: number;
  declined: number;
  pending: number;
  maybe: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  ACCEPTED: { label: 'Accepted', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: Check },
  DECLINED: { label: 'Declined', color: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400', icon: XIcon },
  PENDING:  { label: 'Pending',  color: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',  icon: Clock },
  MAYBE:    { label: 'Maybe',    color: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', icon: HelpCircle },
};

const SCOPES = [
  { id: 'INDIVIDUAL', label: 'Individual' },
  { id: 'FAMILY', label: 'Family' },
  { id: 'MULTIPLE_FAMILIES', label: 'Multiple Families' },
  { id: 'SUB_CLAN', label: 'SubClan' },
  { id: 'CLAN', label: 'Clan' },
  { id: 'COMMUNITY', label: 'Community' },
];

export default function EventInvitationPanel({ eventId, isOwner }: { eventId: string; isOwner: boolean }) {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [stats, setStats] = useState<InvitationStats>({ total: 0, accepted: 0, declined: 0, pending: 0, maybe: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [myInvitation, setMyInvitation] = useState<Invitation | null>(null);

  const [form, setForm] = useState({
    scope: 'INDIVIDUAL',
    userIds: [] as string[],
    userEmails: [] as string[],
    message: '',
  });

  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [invRes, statsRes] = await Promise.all([
        api.eventInvitations.byEvent(eventId),
        api.eventInvitations.eventStats(eventId),
      ]);
      const invList = Array.isArray(invRes) ? invRes : Array.isArray(invRes?.invitations) ? invRes.invitations : [];
      setInvitations(invList);
      setStats({
        total: statsRes?.total || invList.length || 0,
        accepted: statsRes?.accepted || invList.filter((i: Invitation) => i.status === 'ACCEPTED').length || 0,
        declined: statsRes?.declined || invList.filter((i: Invitation) => i.status === 'DECLINED').length || 0,
        pending: statsRes?.pending || invList.filter((i: Invitation) => i.status === 'PENDING').length || 0,
        maybe: statsRes?.maybe || invList.filter((i: Invitation) => i.status === 'MAYBE').length || 0,
      });
      const mine = invList.find((i: Invitation) => i.userId === user?.id);
      setMyInvitation(mine || null);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [eventId, user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const searchUsers = async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await api.search.global(query, { limit: 5 });
      setSearchResults(res?.users || []);
    } catch {
      /* empty */
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (form.scope === 'INDIVIDUAL' && userSearch.trim()) {
        searchUsers(userSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [userSearch, form.scope]);

  const toggleUser = (userId: string) => {
    setForm(f => ({
      ...f,
      userIds: f.userIds.includes(userId)
        ? f.userIds.filter(id => id !== userId)
        : [...f.userIds, userId],
    }));
  };

  const handleSendInvitations = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await api.eventInvitations.create({
        eventId,
        scope: form.scope,
        userIds: form.userIds,
        message: form.message.trim() || undefined,
      });
      setForm({ scope: 'INDIVIDUAL', userIds: [], userEmails: [], message: '' });
      setShowForm(false);
      await fetchData();
    } catch {
      /* empty */
    } finally {
      setSaving(false);
    }
  };

  const handleRSVP = async (status: string) => {
    if (!myInvitation) return;
    try {
      await api.eventInvitations.respond(myInvitation.id, status);
      setMyInvitation(prev => prev ? { ...prev, status } : null);
      setInvitations(prev =>
        prev.map(i => i.id === myInvitation.id ? { ...i, status } : i)
      );
      setStats(prev => ({
        ...prev,
        [status.toLowerCase()]: (prev[status.toLowerCase() as keyof InvitationStats] || 0) + 1,
      }));
    } catch {
      /* empty */
    }
  };

  const inputCls = "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500";
  const selectCls = "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Invitations</span>
        </div>
        {isOwner && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Send Invitations
          </button>
        )}
      </div>

      <div className="p-4">
        {/* Stats bar */}
        <div className="grid grid-cols-5 gap-2 mb-4">
          {[
            { key: 'total', label: 'Total', color: 'text-slate-700 dark:text-slate-300' },
            { key: 'accepted', label: 'Accepted', color: 'text-emerald-600 dark:text-emerald-400' },
            { key: 'declined', label: 'Declined', color: 'text-rose-600 dark:text-rose-400' },
            { key: 'pending', label: 'Pending', color: 'text-amber-600 dark:text-amber-400' },
            { key: 'maybe', label: 'Maybe', color: 'text-purple-600 dark:text-purple-400' },
          ].map(s => (
            <div key={s.key} className="text-center rounded-lg bg-slate-50 py-2 dark:bg-slate-800/50">
              <p className={`text-lg font-bold ${s.color}`}>{loading ? 'â€”' : stats[s.key as keyof InvitationStats]}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* RSVP buttons for current user */}
        {myInvitation && !isOwner && myInvitation.status !== 'ACCEPTED' && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-800 dark:bg-emerald-900/10"
          >
            <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-300">You&apos;re invited! RSVP:</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleRSVP('ACCEPTED')}
                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
              >
                <Check className="h-3 w-3" /> Accept
              </button>
              <button
                onClick={() => handleRSVP('MAYBE')}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <HelpCircle className="h-3 w-3" /> Maybe
              </button>
              <button
                onClick={() => handleRSVP('DECLINED')}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <XIcon className="h-3 w-3" /> Decline
              </button>
            </div>
          </motion.div>
        )}

        {/* Send invitation form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Send Invitations</h4>
                  <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {/* Scope selector */}
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">Scope</label>
                    <select
                      value={form.scope}
                      onChange={e => setForm(f => ({ ...f, scope: e.target.value, userIds: [] }))}
                      className={selectCls}
                    >
                      {SCOPES.map(s => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* User multi-select (Individual scope) */}
                  {form.scope === 'INDIVIDUAL' && (
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">Search Users</label>
                      <input
                        value={userSearch}
                        onChange={e => setUserSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className={inputCls}
                      />
                      {searching && <p className="mt-1 text-[11px] text-slate-400">Searching...</p>}
                      {searchResults.length > 0 && (
                        <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                          {searchResults.map(u => (
                            <button
                              key={u.id}
                              onClick={() => toggleUser(u.id)}
                              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition-colors ${
                                form.userIds.includes(u.id)
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                                {u.avatar ? (
                                  <img src={u.avatar} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[9px] font-medium text-emerald-700 dark:text-emerald-400">
                                    {(u.name || 'U')[0].toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <span className="font-medium">{u.name}</span>
                              <span className="text-slate-400 dark:text-slate-500">{u.email}</span>
                              {form.userIds.includes(u.id) && <Check className="ml-auto h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
                            </button>
                          ))}
                        </div>
                      )}
                      {form.userIds.length > 0 && (
                        <p className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                          {form.userIds.length} user{form.userIds.length !== 1 ? 's' : ''} selected
                        </p>
                      )}
                    </div>
                  )}

                  {/* Custom message */}
                  <div>
                    <label className="mb-1 block text-[11px] font-medium text-slate-500 dark:text-slate-400">Message (optional)</label>
                    <textarea
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      rows={3}
                      placeholder="Add a personal message..."
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="mt-3 flex justify-end gap-2">
                  <button onClick={() => setShowForm(false)} className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400">Cancel</button>
                  <button
                    onClick={handleSendInvitations}
                    disabled={(form.scope === 'INDIVIDUAL' && form.userIds.length === 0) || saving}
                    className="flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {saving ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Invitations list */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-3 animate-pulse rounded-lg p-2">
                <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="h-2 w-16 rounded bg-slate-100 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        ) : invitations.length === 0 ? (
          <div className="py-6 text-center">
            <Users className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">No invitations sent yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {invitations.map(inv => {
                const statusConf = STATUS_CONFIG[inv.status] || STATUS_CONFIG.PENDING;
                const StatusIcon = statusConf.icon;
                return (
                  <motion.div
                    key={inv.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                      {inv.userAvatar ? (
                        <img src={inv.userAvatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          {(inv.userName || inv.userEmail || 'U')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                        {inv.userName || 'Unknown'}
                      </p>
                      {inv.userEmail && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{inv.userEmail}</p>
                      )}
                      {inv.message && (
                        <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-500 italic truncate">&ldquo;{inv.message}&rdquo;</p>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusConf.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusConf.label}
                    </span>
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
