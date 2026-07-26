'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

export default function ClanAdminsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = params.slug as string;

  const [clan, setClan] = useState<any>(null);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferEmail, setTransferEmail] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.clans.get(slug);
      setClan(data);
      setAdmins(data?.admins || data?.members?.filter((m: any) => m.role === 'ADMIN' || m.role === 'OWNER') || []);
    } catch {
      router.push('/dashboard/clans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [slug, router]);

  const handleSearchUser = useCallback(async () => {
    if (!searchEmail.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const data = await api.search.global(searchEmail.trim(), { limit: 10, type: 'user' });
      setSearchResults(data?.users || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [searchEmail]);

  const handleAddAdmin = async (userId: string) => {
    setAddingId(userId);
    try {
      await api.clans.update(clan.id || clan.slug, { addAdmin: userId });
      await loadData();
      setShowAddModal(false);
      setSearchEmail('');
      setSearchResults([]);
    } catch {
      /* empty */
    } finally {
      setAddingId(null);
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (!confirm('Remove this admin?')) return;
    setRemovingId(userId);
    try {
      await api.clans.update(clan.id || clan.slug, { removeAdmin: userId });
      await loadData();
    } catch {
      /* empty */
    } finally {
      setRemovingId(null);
    }
  };

  const handleTransferOwnership = async () => {
    if (!transferEmail.trim()) return;
    try {
      await api.clans.update(clan.id || clan.slug, { transferOwnership: transferEmail.trim() });
      setShowTransferModal(false);
      setTransferEmail('');
      await loadData();
    } catch {
      /* empty */
    }
  };

  const isOwner = clan?.ownerId === user?.id || clan?.createdBy === user?.id;

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
        <div className="mt-1 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clan Admins</h1>
          <div className="flex gap-2">
            {isOwner && (
              <>
                <button onClick={() => setShowAddModal(true)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                  + Add Admin
                </button>
                <button onClick={() => setShowTransferModal(true)} className="rounded-lg border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/20">
                  Transfer Ownership
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {admins.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-400 dark:text-slate-500 italic">No admins found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {admins.map((admin: any) => {
            const adminId = admin.userId || admin.id;
            const adminUser = admin.user || admin;
            const name = adminUser.firstName ? `${adminUser.firstName} ${adminUser.lastName || ''}` : adminUser.name || adminUser.email;
            const isCurrentUserOwner = admin.role === 'OWNER';

            return (
              <div key={adminId} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {adminUser.firstName?.charAt(0) || adminUser.name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{name}</p>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        isCurrentUserOwner
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      }`}>{admin.role || 'Admin'}</span>
                      {adminUser.email && <span className="text-[11px] text-slate-400 dark:text-slate-500">{adminUser.email}</span>}
                    </div>
                  </div>
                </div>
                {isOwner && !isCurrentUserOwner && (
                  <button
                    onClick={() => handleRemoveAdmin(adminId)}
                    disabled={removingId === adminId}
                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50"
                  >
                    {removingId === adminId ? 'Removing...' : 'Remove'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Add Admin</h3>
              <button onClick={() => { setShowAddModal(false); setSearchEmail(''); setSearchResults([]); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                placeholder="Search by email..."
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button onClick={handleSearchUser} disabled={searching} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {searching ? '...' : 'Search'}
              </button>
            </div>
            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-700">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{u.name || u.displayName}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{u.email}</p>
                  </div>
                  <button
                    onClick={() => handleAddAdmin(u.id)}
                    disabled={addingId === u.id}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {addingId === u.id ? '...' : 'Add'}
                  </button>
                </div>
              ))}
              {searchEmail && !searching && searchResults.length === 0 && (
                <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-4">No users found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Transfer Ownership</h3>
              <button onClick={() => { setShowTransferModal(false); setTransferEmail(''); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Enter the email of the user you want to transfer ownership to. This action cannot be undone.</p>
            <input
              type="email"
              value={transferEmail}
              onChange={(e) => setTransferEmail(e.target.value)}
              placeholder="Enter user email..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <div className="mt-4 flex gap-2">
              <button onClick={handleTransferOwnership} disabled={!transferEmail.trim()} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50">
                Transfer Ownership
              </button>
              <button onClick={() => { setShowTransferModal(false); setTransferEmail(''); }} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
