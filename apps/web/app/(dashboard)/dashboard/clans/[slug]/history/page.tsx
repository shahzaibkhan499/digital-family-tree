'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

const SECTIONS = ['Origin', 'Migration', 'Culture', 'Traditions', 'Language', 'Religion', 'Personalities', 'Wars', 'Achievements', 'Villages', 'Maps', 'General'] as const;

const MODERATION_STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  PENDING: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', label: 'Pending Review' },
  APPROVED: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Approved' },
  REJECTED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Rejected' },
  CHANGES_REQUESTED: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', label: 'Changes Requested' },
};

function formatRelative(d: string | null | undefined): string {
  if (!d) return '';
  const date = new Date(d);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ClanHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params.slug as string;

  const [clan, setClan] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [pendingEntries, setPendingEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [moderationNote, setModerationNote] = useState<Record<string, string>>({});
  const [moderatingId, setModeratingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [clanData, historyData] = await Promise.allSettled([
          api.clans.get(slug),
          api.clanHistory.allWithModeration(slug),
        ]);
        if (clanData.status === 'fulfilled') setClan(clanData.value);
        else router.push('/dashboard/clans');
        if (historyData.status === 'fulfilled') {
          const allEntries = Array.isArray(historyData.value) ? historyData.value : historyData.value?.history || [];
          setHistory(allEntries);
          setPendingEntries(allEntries.filter((e: any) => e.moderationStatus === 'PENDING'));
        }
      } catch {
        router.push('/dashboard/clans');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug, router]);

  const handleEdit = (section: string) => {
    const existing = history.find((h: any) => h.section?.toLowerCase() === section.toLowerCase());
    setEditingSection(section);
    setEditContent(existing?.content || '');
  };

  const handleSave = async () => {
    if (!editingSection || !clan) return;
    setSaving(true);
    try {
      const clanId = clan.id || clan.slug;
      const existing = history.find((h: any) => h.section?.toLowerCase() === editingSection.toLowerCase());
      if (existing) {
        await api.clanHistory.update(existing.id, editContent);
      } else {
        await api.clanHistory.create(clanId, { section: editingSection, content: editContent });
      }
      const updated = await api.clanHistory.allWithModeration(clanId);
      const allEntries = Array.isArray(updated) ? updated : updated?.history || [];
      setHistory(allEntries);
      setPendingEntries(allEntries.filter((e: any) => e.moderationStatus === 'PENDING'));
      setEditingSection(null);
      setEditContent('');
    } catch {
      /* empty */
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (id: string) => {
    setModeratingId(id);
    try {
      await api.clanHistory.approve(id, moderationNote[id] || undefined);
      const updated = await api.clanHistory.allWithModeration(slug);
      const allEntries = Array.isArray(updated) ? updated : updated?.history || [];
      setHistory(allEntries);
      setPendingEntries(allEntries.filter((e: any) => e.moderationStatus === 'PENDING'));
    } catch {
      /* empty */
    } finally {
      setModeratingId(null);
      setModerationNote(prev => { const n = { ...prev }; delete n[id]; return n; });
    }
  };

  const handleReject = async (id: string) => {
    setModeratingId(id);
    try {
      await api.clanHistory.reject(id, moderationNote[id] || undefined);
      const updated = await api.clanHistory.allWithModeration(slug);
      const allEntries = Array.isArray(updated) ? updated : updated?.history || [];
      setHistory(allEntries);
      setPendingEntries(allEntries.filter((e: any) => e.moderationStatus === 'PENDING'));
    } catch {
      /* empty */
    } finally {
      setModeratingId(null);
      setModerationNote(prev => { const n = { ...prev }; delete n[id]; return n; });
    }
  };

  const handleRequestChanges = async (id: string) => {
    const note = moderationNote[id];
    if (!note) return;
    setModeratingId(id);
    try {
      await api.clanHistory.requestChanges(id, note);
      const updated = await api.clanHistory.allWithModeration(slug);
      const allEntries = Array.isArray(updated) ? updated : updated?.history || [];
      setHistory(allEntries);
      setPendingEntries(allEntries.filter((e: any) => e.moderationStatus === 'PENDING'));
    } catch {
      /* empty */
    } finally {
      setModeratingId(null);
      setModerationNote(prev => { const n = { ...prev }; delete n[id]; return n; });
    }
  };

  const isAdmin = clan?.ownerId === user?.id || clan?.createdBy === user?.id || clan?.admins?.some((a: any) => a.userId === user?.id || a.id === user?.id);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!clan) return null;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/dashboard/clans/${slug}`} className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
          â† Back to {clan.name}
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Clan History</h1>
      </div>

      {isAdmin && pendingEntries.length > 0 && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/10">
          <div className="border-b border-yellow-200 px-6 py-3 dark:border-yellow-800">
            <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">Pending Review ({pendingEntries.length})</h3>
          </div>
          <div className="divide-y divide-yellow-200 dark:divide-yellow-800">
            {pendingEntries.map((entry: any) => (
              <div key={entry.id} className="px-6 py-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">{entry.section}</span>
                    <p className="mt-1 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                    {entry.submittedBy && (
                      <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                        Submitted by {entry.submittedBy.name || 'Unknown'} Â· {formatRelative(entry.createdAt)}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <input
                    type="text"
                    value={moderationNote[entry.id] || ''}
                    onChange={(e) => setModerationNote(prev => ({ ...prev, [entry.id]: e.target.value }))}
                    placeholder="Add a note (optional for approve, required for changes)"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(entry.id)}
                    disabled={moderatingId === entry.id}
                    className="rounded-lg bg-green-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {moderatingId === entry.id ? '...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleReject(entry.id)}
                    disabled={moderatingId === entry.id}
                    className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {moderatingId === entry.id ? '...' : 'Reject'}
                  </button>
                  <button
                    onClick={() => handleRequestChanges(entry.id)}
                    disabled={moderatingId === entry.id || !(moderationNote[entry.id] || '').trim()}
                    className="rounded-lg bg-orange-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                  >
                    {moderatingId === entry.id ? '...' : 'Request Changes'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {SECTIONS.map((section) => {
          const entry = history.find((h: any) => h.section?.toLowerCase() === section.toLowerCase());
          const isEditing = editingSection === section;
          const statusCfg = entry?.moderationStatus ? MODERATION_STATUS_CONFIG[entry.moderationStatus] : null;

          return (
            <div key={section} className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{section}</h3>
                  {statusCfg && (
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
                      {statusCfg.label}
                    </span>
                  )}
                </div>
                {(clan?.ownerId === user?.id || clan?.createdBy === user?.id) && !isEditing && (
                  <button onClick={() => handleEdit(section)} className="text-xs font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
                    {entry ? 'Edit' : 'Add'}
                  </button>
                )}
              </div>
              <div className="px-6 py-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder={`Write about ${section.toLowerCase()}...`}
                      rows={6}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleSave} disabled={saving} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={() => { setEditingSection(null); setEditContent(''); }} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : entry ? (
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                    {entry.updatedAt && (
                      <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">Last updated {formatRelative(entry.updatedAt)}</p>
                    )}
                    {entry.moderationNote && (
                      <p className="mt-2 text-xs text-orange-600 dark:text-orange-400 italic">Moderation note: {entry.moderationNote}</p>
                    )}
                    {entry.versions && entry.versions.length > 1 && (
                      <div className="mt-4">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Version History</p>
                        <div className="space-y-1">
                          {entry.versions.slice(0, 5).map((v: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                              <div className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                              <span>Version {entry.versions.length - i}</span>
                              <span>â€”</span>
                              <span>{formatRelative(v.updatedAt || v.createdAt)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 dark:text-slate-500 italic">No content yet.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
