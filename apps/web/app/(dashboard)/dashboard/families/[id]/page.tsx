'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';

const RELATIONSHIP_TYPES = [
  'FATHER', 'MOTHER', 'SON', 'DAUGHTER', 'BROTHER', 'SISTER',
  'HUSBAND', 'WIFE', 'GRANDFATHER', 'GRANDMOTHER', 'GRANDSON', 'GRANDDAUGHTER',
  'UNCLE', 'AUNT', 'COUSIN',
];

export default function FamilyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const familyId = params.id as string;
  const [family, setFamily] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberForm, setMemberForm] = useState({
    firstName: '', lastName: '', gender: '', birthDate: '', deathDate: '',
    bio: '', email: '', phone: '', address: '', notes: '',
  });
  const [addingMember, setAddingMember] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  const [editingFamily, setEditingFamily] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingFamily, setSavingFamily] = useState(false);

  const [showAddRelationship, setShowAddRelationship] = useState(false);
  const [relFrom, setRelFrom] = useState('');
  const [relTo, setRelTo] = useState('');
  const [relType, setRelType] = useState('');
  const [addingRelationship, setAddingRelationship] = useState(false);
  const [relationships, setRelationships] = useState<any[]>([]);

  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editMemberForm, setEditMemberForm] = useState({
    firstName: '', lastName: '', gender: '', birthDate: '', deathDate: '',
    bio: '', email: '', phone: '', address: '', notes: '',
  });
  const [savingMember, setSavingMember] = useState(false);

  const [linkDisplayId, setLinkDisplayId] = useState('');
  const [linkSearching, setLinkSearching] = useState(false);
  const [linkResult, setLinkResult] = useState<any>(null);
  const [linkNotFound, setLinkNotFound] = useState(false);
  const [linkingMember, setLinkingMember] = useState(false);

  const [duplicateCheck, setDuplicateCheck] = useState<any[] | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [showDuplicatePrompt, setShowDuplicatePrompt] = useState(false);

  const [smartInviteQuery, setSmartInviteQuery] = useState('');
  const [smartInviteResults, setSmartInviteResults] = useState<any[]>([]);
  const [smartInviteLoading, setSmartInviteLoading] = useState(false);
  const [smartInviteSent, setSmartInviteSent] = useState<string | null>(null);

  useEffect(() => {
    const loadFamily = async () => {
      try {
        const data = await api.families.get(familyId);
        setFamily(data);
      } catch {
        router.push('/dashboard/families');
      } finally {
        setLoading(false);
      }
    };
    loadFamily();
  }, [familyId, router]);

  useEffect(() => {
    if (familyId) {
      api.relationships.list(familyId).then(setRelationships).catch(() => {});
    }
  }, [familyId]);

  useEffect(() => {
    if (!smartInviteQuery.trim() || smartInviteQuery.trim().length < 2) {
      setSmartInviteResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSmartInviteLoading(true);
      try {
        const results = await api.smartInvite.search(familyId, smartInviteQuery.trim());
        const items = Array.isArray(results) ? results : results?.users || results?.members || [];
        setSmartInviteResults(items);
      } catch {
        setSmartInviteResults([]);
      } finally {
        setSmartInviteLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [smartInviteQuery, familyId]);

  const filteredMembers = useMemo(() => {
    if (!family?.members) return [];
    if (!memberSearch.trim()) return family.members;
    const q = memberSearch.toLowerCase();
    return family.members.filter((m: any) =>
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
      (m.email && m.email.toLowerCase().includes(q))
    );
  }, [family?.members, memberSearch]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleCheckDuplicate();
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Remove this member?')) return;
    try {
      await api.members.delete(familyId, memberId);
      setFamily((prev: any) => ({
        ...prev,
        members: prev.members.filter((m: any) => m.id !== memberId),
        _count: { ...prev._count, members: (prev._count?.members || 1) - 1 },
      }));
      setRelationships((prev) => prev.filter((r) => r.fromMemberId !== memberId && r.toMemberId !== memberId));
    } catch {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to remove member');
      }
    }
  };

  const startEditMember = (member: any) => {
    setEditingMemberId(member.id);
    setEditMemberForm({
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      gender: member.gender || '',
      birthDate: member.birthDate ? member.birthDate.split('T')[0] : '',
      deathDate: member.deathDate ? member.deathDate.split('T')[0] : '',
      bio: member.bio || '',
      email: member.email || '',
      phone: member.phone || '',
      address: member.address || '',
      notes: member.notes || '',
    });
  };

  const handleEditMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMemberId) return;
    setSavingMember(true);
    try {
      const updated = await api.members.update(familyId, editingMemberId, {
        ...editMemberForm,
        birthDate: editMemberForm.birthDate || undefined,
        deathDate: editMemberForm.deathDate || undefined,
      });
      setFamily((prev: any) => ({
        ...prev,
        members: prev.members.map((m: any) => m.id === editingMemberId ? { ...m, ...updated } : m),
      }));
      setEditingMemberId(null);
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error(err.message || 'Failed to update member');
      }
    } finally {
      setSavingMember(false);
    }
  };

  const handleSaveFamily = async () => {
    setSavingFamily(true);
    try {
      const updated = await api.families.update(familyId, { name: editName, description: editDescription });
      setFamily((prev: any) => ({ ...prev, ...updated }));
      setEditingFamily(false);
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error(err.message || 'Failed to update family');
      }
    } finally {
      setSavingFamily(false);
    }
  };

  const handleAddRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!relFrom || !relTo || !relType) return;
    setAddingRelationship(true);
    try {
      const rel = await api.relationships.create({ fromMemberId: relFrom, toMemberId: relTo, type: relType });
      setRelationships((prev) => [...prev, rel]);
      setShowAddRelationship(false);
      setRelFrom('');
      setRelTo('');
      setRelType('');
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error(err.message || 'Failed to add relationship');
      }
    } finally {
      setAddingRelationship(false);
    }
  };

  const handleRemoveRelationship = async (relId: string) => {
    if (!confirm('Remove this relationship?')) return;
    try {
      await api.relationships.remove(relId);
      setRelationships((prev) => prev.filter((r) => r.id !== relId));
    } catch {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to remove relationship');
      }
    }
  };

  const handleLinkMember = async () => {
    if (!linkDisplayId.trim()) return;
    setLinkSearching(true);
    setLinkNotFound(false);
    setLinkResult(null);
    try {
      const result = await api.families.searchMember(linkDisplayId.trim());
      if (result) {
        setLinkResult(result);
      } else {
        setLinkNotFound(true);
      }
    } catch {
      setLinkNotFound(true);
    } finally {
      setLinkSearching(false);
    }
  };

  const handleConfirmLink = async () => {
    if (!linkResult) return;
    setLinkingMember(true);
    try {
      const newMember = await api.members.create(familyId, {
        firstName: linkResult.firstName || '',
        lastName: linkResult.lastName || '',
        gender: linkResult.gender || '',
        email: linkResult.email || '',
        phone: linkResult.phone || '',
        displayId: linkResult.displayId || linkDisplayId.trim(),
      });
      setFamily((prev: any) => ({
        ...prev,
        members: [...(prev.members || []), newMember],
        _count: { ...prev._count, members: (prev._count?.members || 0) + 1 },
      }));
      setLinkDisplayId('');
      setLinkResult(null);
      setLinkNotFound(false);
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error(err.message || 'Failed to link member');
      }
    } finally {
      setLinkingMember(false);
    }
  };

  const handleCheckDuplicate = async () => {
    if (!memberForm.firstName.trim() || !memberForm.lastName.trim()) return;
    setCheckingDuplicate(true);
    setDuplicateCheck(null);
    setShowDuplicatePrompt(false);
    try {
      const result = await api.members.checkDuplicate(familyId, {
        firstName: memberForm.firstName.trim(),
        lastName: memberForm.lastName.trim(),
        birthDate: memberForm.birthDate || undefined,
      });
      if (result.duplicate && result.member) {
        setDuplicateCheck([result.member]);
        setShowDuplicatePrompt(true);
      } else {
        await handleAddMemberConfirm();
      }
    } catch {
      await handleAddMemberConfirm();
    } finally {
      setCheckingDuplicate(false);
    }
  };

  const handleAddMemberConfirm = async () => {
    setAddingMember(true);
    try {
      const newMember = await api.members.create(familyId, {
        ...memberForm,
        birthDate: memberForm.birthDate || undefined,
        deathDate: memberForm.deathDate || undefined,
      });
      setFamily((prev: any) => ({
        ...prev,
        members: [...(prev.members || []), newMember],
        _count: { ...prev._count, members: (prev._count?.members || 0) + 1 },
      }));
      setShowAddMember(false);
      setMemberForm({
        firstName: '', lastName: '', gender: '', birthDate: '', deathDate: '',
        bio: '', email: '', phone: '', address: '', notes: '',
      });
    } catch (err: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error(err.message || 'Failed to add member');
      }
    } finally {
      setAddingMember(false);
    }
  };

  const getMemberName = (memberId: string) => {
    const member = family?.members?.find((m: any) => m.id === memberId);
    return member ? `${member.firstName} ${member.lastName}` : 'Unknown';
  };

  const getMemberRelationships = (memberId: string) => {
    return relationships.filter((r) => r.fromMemberId === memberId || r.toMemberId === memberId);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!family) return null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/families" className="text-sm text-emerald-600 hover:text-emerald-700">
          â† Back to families
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex-1">
            {editingFamily ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-3xl font-bold text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  placeholder="Family description..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveFamily}
                    disabled={savingFamily || !editName.trim()}
                    className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {savingFamily ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditingFamily(false)}
                    className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{family.name}</h1>
                  <button
                    onClick={() => {
                      setEditName(family.name);
                      setEditDescription(family.description || '');
                      setEditingFamily(true);
                    }}
                    className="rounded p-1 text-slate-400 hover:text-emerald-600"
                    title="Edit family"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
                {family.description && (
                  <p className="mt-1 text-slate-600 dark:text-slate-400">{family.description}</p>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2 ml-4">
            <Link
              href={`/dashboard/families/${familyId}/timeline`}
              className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
            >
              Timeline
            </Link>
            <Link
              href={`/dashboard/families/${familyId}/tree`}
              className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20"
            >
              View Tree
            </Link>
            <button
              onClick={() => setShowAddRelationship(!showAddRelationship)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {showAddRelationship ? 'Cancel' : '+ Relationship'}
            </button>
            <button
              onClick={() => setShowAddMember(!showAddMember)}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {showAddMember ? 'Cancel' : '+ Add Member'}
            </button>
          </div>
        </div>
      </div>

      {showAddRelationship && (
        <form onSubmit={handleAddRelationship} className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-6 dark:border-emerald-800 dark:bg-emerald-900/10">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Add Relationship</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">From Member</label>
              <select
                value={relFrom}
                onChange={(e) => setRelFrom(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Select member</option>
                {(family.members || []).map((m: any) => (
                  <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">To Member</label>
              <select
                value={relTo}
                onChange={(e) => setRelTo(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Select member</option>
                {(family.members || []).map((m: any) => (
                  <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Relationship Type</label>
              <select
                value={relType}
                onChange={(e) => setRelType(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 capitalize focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Select type</option>
                {RELATIONSHIP_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace('-', ' ')}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={addingRelationship || !relFrom || !relTo || !relType}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {addingRelationship ? 'Adding...' : 'Add Relationship'}
          </button>
        </form>
      )}

      {showAddMember && (
        <>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-6 dark:border-indigo-800 dark:bg-indigo-900/10">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Search for Existing Users</h3>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={smartInviteQuery}
              onChange={(e) => setSmartInviteQuery(e.target.value)}
              placeholder="Search by name, email, or username..."
              className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
            />
          </div>

          {smartInviteLoading && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              Searching...
            </div>
          )}

          {smartInviteResults.length > 0 && (
            <div className="mt-3 space-y-2">
              {smartInviteResults.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between rounded-lg bg-white px-4 py-3 dark:bg-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                      {user.name?.charAt(0)?.toUpperCase() || user.displayName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {user.displayName || user.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                    </div>
                  </div>
                  <button
                    disabled={smartInviteSent === user.id}
                    onClick={async () => {
                      setSmartInviteSent(user.id);
                      try {
                        await api.invitations.create({ familyId, email: user.email });
                      } catch {
                        /* empty */
                      }
                    }}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {smartInviteSent === user.id ? 'Invited' : 'Invite to Family'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {!smartInviteLoading && smartInviteQuery.trim().length >= 2 && smartInviteResults.length === 0 && (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">No matching users found. Add as a new member below.</p>
          )}
        </div>

        <form onSubmit={handleAddMember} className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/50 p-6 dark:border-emerald-800 dark:bg-emerald-900/10">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">First Name *</label>
              <input
                type="text"
                value={memberForm.firstName}
                onChange={(e) => setMemberForm({ ...memberForm, firstName: e.target.value })}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Last Name *</label>
              <input
                type="text"
                value={memberForm.lastName}
                onChange={(e) => setMemberForm({ ...memberForm, lastName: e.target.value })}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Gender</label>
              <select
                value={memberForm.gender}
                onChange={(e) => setMemberForm({ ...memberForm, gender: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Birth Date</label>
              <input
                type="date"
                value={memberForm.birthDate}
                onChange={(e) => setMemberForm({ ...memberForm, birthDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Death Date</label>
              <input
                type="date"
                value={memberForm.deathDate}
                onChange={(e) => setMemberForm({ ...memberForm, deathDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
              <input
                type="email"
                value={memberForm.email}
                onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
              <input
                type="tel"
                value={memberForm.phone}
                onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
              <input
                type="text"
                value={memberForm.address}
                onChange={(e) => setMemberForm({ ...memberForm, address: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                placeholder="City, Country"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Bio</label>
            <textarea
              value={memberForm.bio}
              onChange={(e) => setMemberForm({ ...memberForm, bio: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Notes</label>
            <textarea
              value={memberForm.notes}
              onChange={(e) => setMemberForm({ ...memberForm, notes: e.target.value })}
              rows={2}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              placeholder="Additional notes about this member..."
            />
          </div>
          <button
            type="submit"
            disabled={addingMember || checkingDuplicate || !memberForm.firstName.trim() || !memberForm.lastName.trim()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {checkingDuplicate ? 'Checking...' : addingMember ? 'Adding...' : 'Add Member'}
          </button>
        </form>

        {showDuplicatePrompt && duplicateCheck && duplicateCheck.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-900/10">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">This person may already exist</p>
            <div className="space-y-2">
              {duplicateCheck.map((dup: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 dark:bg-slate-800">
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{dup.firstName} {dup.lastName}</p>
                    {dup.birthDate && <p className="text-xs text-slate-500 dark:text-slate-400">Born: {new Date(dup.birthDate).toLocaleDateString()}</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={async () => {
                  if (duplicateCheck[0]) {
                    const newMember = await api.members.create(familyId, {
                      ...duplicateCheck[0],
                      birthDate: duplicateCheck[0].birthDate || undefined,
                      deathDate: duplicateCheck[0].deathDate || undefined,
                    });
                    setFamily((prev: any) => ({
                      ...prev,
                      members: [...(prev.members || []), newMember],
                      _count: { ...prev._count, members: (prev._count?.members || 0) + 1 },
                    }));
                    setShowAddMember(false);
                    setShowDuplicatePrompt(false);
                    setMemberForm({ firstName: '', lastName: '', gender: '', birthDate: '', deathDate: '', bio: '', email: '', phone: '', address: '', notes: '' });
                  }
                }}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Link Existing
              </button>
              <button
                onClick={() => {
                  setShowDuplicatePrompt(false);
                  handleAddMemberConfirm();
                }}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Create New Anyway
              </button>
              <button
                onClick={() => setShowDuplicatePrompt(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
        </div>
        )}
        </>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Link Existing Member</h3>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Member ID</label>
            <input
              type="text"
              value={linkDisplayId}
              onChange={(e) => setLinkDisplayId(e.target.value)}
              placeholder="MEM-XXXXXXXX"
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <button
            onClick={handleLinkMember}
            disabled={linkSearching || !linkDisplayId.trim()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {linkSearching ? 'Looking...' : 'Look Up'}
          </button>
        </div>

        {linkNotFound && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">No member found with that ID</p>
        )}

        {linkResult && (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-semibold text-slate-600 dark:text-slate-300">
                {linkResult.firstName?.charAt(0)}{linkResult.lastName?.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {linkResult.firstName} {linkResult.lastName}
                </p>
                {linkResult.city && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{linkResult.city}</p>
                )}
                {linkResult.familyName && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">{linkResult.familyName}</p>
                )}
              </div>
              <button
                onClick={handleConfirmLink}
                disabled={linkingMember}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {linkingMember ? 'Linking...' : 'Confirm Link'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Members ({family._count?.members || 0})
          </h2>
          {family.members && family.members.length > 3 && (
            <input
              type="text"
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder="Search members..."
              className="w-64 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
            />
          )}
        </div>
        {!family.members || family.members.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-slate-500 dark:text-slate-400">
              No members yet. Add the first member to this family.
            </p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-slate-500 dark:text-slate-400">
              No members match &ldquo;{memberSearch}&rdquo;
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMembers.map((member: any) => {
              const memberRels = getMemberRelationships(member.id);
              if (editingMemberId === member.id) {
                return (
                  <div key={member.id} className="col-span-full rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-800 dark:bg-emerald-900/10">
                    <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Editing {member.firstName} {member.lastName}</h3>
                    <form onSubmit={handleEditMember} className="space-y-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">First Name</label>
                          <input type="text" value={editMemberForm.firstName} onChange={(e) => setEditMemberForm(p => ({ ...p, firstName: e.target.value }))} required className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Last Name</label>
                          <input type="text" value={editMemberForm.lastName} onChange={(e) => setEditMemberForm(p => ({ ...p, lastName: e.target.value }))} required className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Gender</label>
                          <select value={editMemberForm.gender} onChange={(e) => setEditMemberForm(p => ({ ...p, gender: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Birth Date</label>
                          <input type="date" value={editMemberForm.birthDate} onChange={(e) => setEditMemberForm(p => ({ ...p, birthDate: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Death Date</label>
                          <input type="date" value={editMemberForm.deathDate} onChange={(e) => setEditMemberForm(p => ({ ...p, deathDate: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Email</label>
                          <input type="email" value={editMemberForm.email} onChange={(e) => setEditMemberForm(p => ({ ...p, email: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Phone</label>
                          <input type="tel" value={editMemberForm.phone} onChange={(e) => setEditMemberForm(p => ({ ...p, phone: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Address</label>
                          <input type="text" value={editMemberForm.address} onChange={(e) => setEditMemberForm(p => ({ ...p, address: e.target.value }))} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Bio</label>
                        <textarea value={editMemberForm.bio} onChange={(e) => setEditMemberForm(p => ({ ...p, bio: e.target.value }))} rows={2} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Notes</label>
                        <textarea value={editMemberForm.notes} onChange={(e) => setEditMemberForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                      </div>
                      <div className="flex gap-2">
                        <button type="submit" disabled={savingMember || !editMemberForm.firstName.trim() || !editMemberForm.lastName.trim()} className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                          {savingMember ? 'Saving...' : 'Save Changes'}
                        </button>
                        <button type="button" onClick={() => setEditingMemberId(null)} className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                );
              }
              return (
                <div
                  key={member.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {member.firstName} {member.lastName}
                        </h3>
                        {member.gender && (
                          <p className="text-xs text-slate-500 capitalize dark:text-slate-400">
                            {member.gender}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEditMember(member)}
                        className="rounded p-1 text-slate-400 hover:text-emerald-500"
                        title="Edit member"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="rounded p-1 text-slate-400 hover:text-red-500"
                        title="Remove member"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {member.birthDate && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Born: {new Date(member.birthDate).toLocaleDateString()}
                    </p>
                  )}
                  {member.deathDate && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Died: {new Date(member.deathDate).toLocaleDateString()}
                    </p>
                  )}
                  {member.email && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {member.email}
                    </p>
                  )}
                  {member.phone && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {member.phone}
                    </p>
                  )}
                  {member.address && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {member.address}
                    </p>
                  )}
                  {member.bio && (
                    <p className="mt-2 text-sm text-slate-600 line-clamp-2 dark:text-slate-400">
                      {member.bio}
                    </p>
                  )}
                  {member.notes && (
                    <p className="mt-1 text-xs text-slate-400 italic dark:text-slate-500">
                      {member.notes}
                    </p>
                  )}
                  {memberRels.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {memberRels.map((rel: any) => {
                        const otherId = rel.fromMemberId === member.id ? rel.toMemberId : rel.fromMemberId;
                        const otherName = getMemberName(otherId);
                        const direction = rel.fromMemberId === member.id ? '' : '(reverse)';
                        return (
                          <span
                            key={rel.id}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          >
                            {rel.type.replace('-', ' ')} â†’ {otherName} {direction}
                            <button
                              onClick={() => handleRemoveRelationship(rel.id)}
                              className="ml-0.5 text-slate-400 hover:text-red-500"
                              title="Remove"
                            >
                              Ã—
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
