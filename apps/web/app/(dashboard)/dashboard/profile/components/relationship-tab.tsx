'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api-client';

interface RelationshipTabProps {
  personId: string;
  personName: string;
}

interface FamilyMember {
  id: string;
  name: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  avatar?: string;
  relationshipType?: string;
  birthDate?: string;
  deathDate?: string;
  displayId?: string;
}

function getDisplayName(person: any): string {
  return person?.displayName || person?.name || `${person?.firstName || ''} ${person?.lastName || ''}`.trim() || 'Unknown';
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).filter(Boolean).join('').toUpperCase().slice(0, 2) || '?';
}

function PersonAvatar({ person, size = 'md' }: { person: FamilyMember; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'lg' ? 'h-12 w-12 text-base' : size === 'md' ? 'h-9 w-9 text-xs' : 'h-7 w-7 text-[9px]';
  if (person.avatar) {
    return <img src={person.avatar} alt={getDisplayName(person)} className={`${dims} rounded-full object-cover ring-2 ring-white dark:ring-slate-900`} />;
  }
  const genderColor = person.gender === 'male'
    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    : person.gender === 'female'
      ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
      : 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400';
  return (
    <div className={`${dims} rounded-full ${genderColor} flex items-center justify-center font-bold ring-2 ring-white dark:ring-slate-900`}>
      {getInitials(getDisplayName(person))}
    </div>
  );
}

function SectionCard({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <h4 className="text-xs font-semibold text-slate-900 dark:text-white">{title}</h4>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

function PersonCard({ person, onClick }: { person: FamilyMember; onClick?: () => void }) {
  const isDeceased = !!person.deathDate;
  return (
    <motion.button
      whileHover={{ y: -1 }}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border border-slate-100 bg-white p-2.5 text-left hover:border-slate-200 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700 transition-all"
    >
      <PersonAvatar person={person} size="md" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
          {getDisplayName(person)}
          {isDeceased && <span className="ml-1 text-[10px] text-slate-400">&#8224;</span>}
        </p>
        {person.relationshipType && (
          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{person.relationshipType}</p>
        )}
      </div>
      <svg className="h-3 w-3 shrink-0 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </motion.button>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse space-y-2">
      <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="flex gap-2">
        <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-2 w-14 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-700" />
          <div className="h-2 w-14 rounded bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <svg className="mb-2 h-8 w-8 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
      <p className="text-xs text-slate-400 dark:text-slate-500">{message}</p>
    </div>
  );
}

function StatBox({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800/50">
      <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
        {icon}
      </div>
      <p className="text-lg font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-[10px] text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

export default function RelationshipTab({ personId, personName }: RelationshipTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<FamilyMember | null>(null);
  const [calculateResult, setCalculateResult] = useState<any>(null);
  const [calculateLoading, setCalculateLoading] = useState(false);

  const [memberData, setMemberData] = useState<any>(null);
  const [memberLoading, setMemberLoading] = useState(true);
  const [ancestors, setAncestors] = useState<any[]>([]);
  const [ancestorsLoading, setAncestorsLoading] = useState(false);

  const familyId = memberData?.familyId || memberData?.treeId || memberData?.parentFamilyId;

  useEffect(() => {
    if (!personId) return;
    setMemberLoading(true);
    const loadMember = async () => {
      try {
        const membersRes = await api.members.list('');
        const found = Array.isArray(membersRes) ? membersRes.find((m: any) => m.id === personId || m.displayId === personId) : null;
        if (found) {
          setMemberData(found);
        }
      } catch { /* empty */ }
      setMemberLoading(false);
    };
    loadMember();
  }, [personId]);

  useEffect(() => {
    if (!personId) return;
    setAncestorsLoading(true);
    api.tree.ancestors(personId, 10)
      .then((res: any) => {
        const items = res?.nodes || res?.members || (Array.isArray(res) ? res : []);
        setAncestors(items);
      })
      .catch(() => setAncestors([]))
      .finally(() => setAncestorsLoading(false));
  }, [personId]);

  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const res = await api.search.global(q, { limit: 8, type: 'members' });
      const items = res?.members || (Array.isArray(res) ? res : []);
      setSearchResults(items.filter((m: any) => m.id !== personId));
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [personId]);

  const handleCalculate = useCallback(async (targetPerson: FamilyMember) => {
    setSelectedPerson(targetPerson);
    setCalculateLoading(true);
    setCalculateResult(null);
    try {
      const token = api.getToken();
      const targetId = targetPerson.id || targetPerson.displayId;
      const res = await fetch(`/api/nest/genealogy/calculate/${personId}/${targetId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to calculate');
      setCalculateResult(data);
    } catch {
      setCalculateResult({ found: false });
    } finally {
      setCalculateLoading(false);
    }
  }, [personId]);

  const parents = useMemo(() => {
    if (!memberData) return [];
    const list: FamilyMember[] = [];
    if (memberData.fatherId) list.push({ id: memberData.fatherId, name: memberData.fatherName || 'Father', relationshipType: 'Father' });
    if (memberData.motherId) list.push({ id: memberData.motherId, name: memberData.motherName || 'Mother', relationshipType: 'Mother' });
    return list;
  }, [memberData]);

  const siblings = useMemo(() => {
    if (!memberData?.siblingIds) return [];
    const ids: string[] = typeof memberData.siblingIds === 'string' ? memberData.siblingIds.split(',').filter(Boolean) : (Array.isArray(memberData.siblingIds) ? memberData.siblingIds : []);
    return ids.map((id: string) => ({ id, name: 'Sibling', relationshipType: 'Sibling' } as FamilyMember));
  }, [memberData]);

  const spouses = useMemo(() => {
    if (!memberData?.spouseId) return [];
    const ids: string[] = typeof memberData.spouseId === 'string' ? memberData.spouseId.split(',').filter(Boolean) : (Array.isArray(memberData.spouseId) ? memberData.spouseId : []);
    return ids.map((id: string) => ({ id, name: 'Spouse', relationshipType: 'Spouse' } as FamilyMember));
  }, [memberData]);

  const children = useMemo(() => {
    if (!memberData?.childrenIds) return [];
    const ids: string[] = typeof memberData.childrenIds === 'string' ? memberData.childrenIds.split(',').filter(Boolean) : (Array.isArray(memberData.childrenIds) ? memberData.childrenIds : []);
    return ids.map((id: string) => ({ id, name: 'Child', relationshipType: 'Child' } as FamilyMember));
  }, [memberData]);

  const genLevel = useMemo(() => {
    if (ancestors.length === 0) return '--';
    const depths = ancestors.map((a: any) => a.depth ?? a.generation ?? 0);
    return Math.abs(Math.min(...depths, 0)).toString();
  }, [ancestors]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      <SectionCard title="Quick Relationship Calculator">
        <div className="space-y-3">
          <div className="relative">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
              <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search for a person to compare..."
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none dark:text-white"
              />
              {searchLoading && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
              )}
            </div>
            <AnimatePresence>
              {searchResults.length > 0 && searchQuery && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute left-0 right-0 top-full z-50 mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
                >
                  {searchResults.map((m: any) => (
                    <button
                      key={m.id}
                      onClick={() => {
                        handleCalculate(m);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {getInitials(getDisplayName(m))}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-slate-800 dark:text-slate-200">{getDisplayName(m)}</p>
                        {m.gender && <p className="text-[10px] text-slate-400">{m.gender}</p>}
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            {calculateLoading && (
              <motion.div
                key="calc-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2 py-3"
              >
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Calculating relationship...</span>
              </motion.div>
            )}

            {!calculateLoading && selectedPerson && calculateResult && calculateResult.found && (
              <motion.div
                key="calc-result"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-200 text-[9px] font-bold text-emerald-700 dark:bg-emerald-800 dark:text-emerald-300">
                    {getInitials(personName)}
                  </div>
                  <svg className="h-3 w-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-200 text-[9px] font-bold text-blue-700 dark:bg-blue-800 dark:text-blue-300">
                    {getInitials(getDisplayName(selectedPerson))}
                  </div>
                </div>
                <p className="text-center text-sm font-bold text-slate-800 dark:text-slate-200">
                  {calculateResult.relationshipLabel || calculateResult.relationshipType || 'Related'}
                </p>
                {calculateResult.generationDifference !== undefined && (
                  <p className="text-center text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                    Generation gap: {Math.abs(calculateResult.generationDifference)} {Math.abs(calculateResult.generationDifference) === 1 ? 'gen' : 'gens'}
                  </p>
                )}
                {calculateResult.confidence !== undefined && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${calculateResult.confidence}%` }}
                        className="h-full rounded-full bg-emerald-500"
                      />
                    </div>
                    <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400">{calculateResult.confidence}%</span>
                  </div>
                )}
              </motion.div>
            )}

            {!calculateLoading && selectedPerson && calculateResult && !calculateResult.found && (
              <motion.div
                key="calc-not-found"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-700 dark:bg-slate-800"
              >
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No relationship found between {personName} and {getDisplayName(selectedPerson)}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SectionCard>

      <SectionCard title="Family Network">
        {memberLoading ? (
          <SkeletonCard />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">Parents</p>
              {parents.length > 0 ? (
                <div className="space-y-1.5">
                  {parents.map((p, i) => <PersonCard key={p.id + i} person={p} />)}
                </div>
              ) : <EmptyState message="No parents listed" />}
            </div>
            <div>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">Siblings</p>
              {siblings.length > 0 ? (
                <div className="space-y-1.5">
                  {siblings.map((s, i) => <PersonCard key={s.id + i} person={s} />)}
                </div>
              ) : <EmptyState message="No siblings listed" />}
            </div>
            <div>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">Spouses</p>
              {spouses.length > 0 ? (
                <div className="space-y-1.5">
                  {spouses.map((s, i) => <PersonCard key={s.id + i} person={s} />)}
                </div>
              ) : <EmptyState message="No spouses listed" />}
            </div>
            <div>
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">Children</p>
              {children.length > 0 ? (
                <div className="space-y-1.5">
                  {children.map((c, i) => <PersonCard key={c.id + i} person={c} />)}
                </div>
              ) : <EmptyState message="No children listed" />}
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Ancestor Chain">
        {ancestorsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-2 animate-pulse">
                <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700" />
                <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        ) : ancestors.length > 0 ? (
          <div className="relative space-y-1">
            <div className="absolute left-[13px] top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
              {ancestors.slice(0, 10).map((a: any, idx: number) => (
              <motion.div
                key={a.id || idx}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.2 }}
                className="relative flex items-center gap-2.5 pl-0"
              >
                <div className="z-10 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-slate-100 text-[8px] font-bold text-slate-500 ring-2 ring-white dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-900">
                  {getInitials(getDisplayName(a)).charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">
                    {getDisplayName(a)}
                  </p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500">
                    {a.depth !== undefined ? `Gen ${a.depth} ${a.depth < 0 ? `(${Math.abs(a.depth)} up)` : ''}` : ''}
                  </p>
                </div>
              </motion.div>
            ))}
            {ancestors.length > 10 && (
              <p className="pt-1 text-center text-[10px] text-slate-400 dark:text-slate-500">
                +{ancestors.length - 10} more ancestors
              </p>
            )}
          </div>
        ) : (
          <EmptyState message="No ancestor data available" />
        )}
      </SectionCard>

      <SectionCard title="Generation Info">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatBox
            label="Generation Level"
            value={genLevel}
            icon={
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" />
              </svg>
            }
          />
          <StatBox
            label="Ancestors"
            value={ancestors.length}
            icon={
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            }
          />
          <StatBox
            label="Family Members"
            value={parents.length + siblings.length + spouses.length + children.length}
            icon={
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
          <StatBox
            label="Generations"
            value={ancestors.length > 0 ? Math.max(...ancestors.map((a: any) => Math.abs(a.depth ?? 0)), 1) : '--'}
            icon={
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" />
              </svg>
            }
          />
        </div>
      </SectionCard>
    </motion.div>
  );
}
