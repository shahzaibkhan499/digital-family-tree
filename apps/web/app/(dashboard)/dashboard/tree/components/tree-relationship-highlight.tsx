'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api-client';
import RelationshipViewer from './relationship-viewer';

interface TreeRelationshipHighlightProps {
  nodes: any[];
  onFindPath: (memberIdA: string, memberIdB: string) => void;
  onFindCommonAncestor: (memberIdA: string, memberIdB: string) => void;
  onClear: () => void;
  pathResult?: any;
  commonAncestorResult?: any;
  onLocatePerson?: (personId: string) => void;
}

type Mode = 'calculate' | 'path' | 'ancestor' | 'lineage';

const NATURE_COLORS: Record<string, string> = {
  Blood: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  Marriage: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  Adoption: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Step: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  Foster: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  Legal: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400',
};

const SIDE_COLORS: Record<string, string> = {
  Paternal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Maternal: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  Both: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Unknown: 'bg-slate-100 text-slate-500 dark:bg-slate-900/30 dark:text-slate-400',
};

const RELATION_NAMES: Record<number, string> = {
  [-4]: 'Great-Great-Grandparent',
  [-3]: 'Great-Grandparent',
  [-2]: 'Grandparent',
  [-1]: 'Parent',
  [0]: 'Self',
  [1]: 'Child',
  [2]: 'Grandchild',
  [3]: 'Great-Grandchild',
  [4]: 'Great-Great-Grandchild',
};

function classifyRelationship(pathResult: any): {
  nature: string;
  side: string;
  type: string;
  degree: string;
  removal: string;
} {
  const rel = pathResult?.relationship || '';
  const path = pathResult?.path || [];

  let nature = 'Blood';
  let side = 'Unknown';
  let type = 'Direct';
  let degree = '';
  let removal = '';

  const upper = rel.toLowerCase();
  if (upper.includes('in-law') || upper.includes('in law') || upper.includes('spouse')) {
    nature = 'Marriage';
  } else if (upper.includes('adopt')) {
    nature = 'Adoption';
  } else if (upper.includes('step')) {
    nature = 'Step';
  } else if (upper.includes('foster')) {
    nature = 'Foster';
  }

  if (upper.includes('maternal')) {
    side = 'Maternal';
  } else if (upper.includes('paternal')) {
    side = 'Paternal';
  } else if (upper.includes('both') || upper.includes('shared')) {
    side = 'Both';
  }

  if (upper.includes('cousin')) {
    type = 'Cousin';
  } else if (upper.includes('sibling') || upper.includes('brother') || upper.includes('sister') || upper.includes('twin')) {
    type = 'Sibling';
  } else if (upper.includes('uncle') || upper.includes('aunt') || upper.includes('nephew') || upper.includes('niece')) {
    type = 'Avuncular';
  } else if (upper.includes('parent') || upper.includes('father') || upper.includes('mother') || upper.includes('grandparent')) {
    type = 'Direct';
  } else if (upper.includes('child') || upper.includes('son') || upper.includes('daughter') || upper.includes('grandchild')) {
    type = 'Direct';
  } else if (upper.includes('spouse') || upper.includes('husband') || upper.includes('wife') || upper.includes('in-law')) {
    type = 'In-law';
  } else if (upper.includes('grand')) {
    type = 'Direct';
  }

  const degreeMatch = rel.match(/(\d+)(st|nd|rd|th)\s+(Cousin|Great)/i);
  if (degreeMatch) {
    const num = parseInt(degreeMatch[1], 10);
    degree = `${num}${num === 1 ? 'st' : num === 2 ? 'nd' : num === 3 ? 'rd' : 'th'}`;
  } else if (upper.includes('great')) {
    const greatMatch = rel.match(/great-*/gi);
    if (greatMatch) {
      degree = `${greatMatch.length}${greatMatch.length === 1 ? 'st' : greatMatch.length === 2 ? 'nd' : greatMatch.length === 3 ? 'rd' : 'th'}`;
    }
  } else if (upper.includes('cousin') && !degree) {
    degree = '1st';
  }

  if (upper.includes('once removed')) {
    removal = 'Once Removed';
  } else if (upper.includes('twice removed')) {
    removal = 'Twice Removed';
  } else if (upper.includes('thrice removed')) {
    removal = 'Thrice Removed';
  } else if (upper.match(/\d+\s+times\s+removed/i)) {
    removal = 'Removed';
  } else if (upper.includes('removed')) {
    removal = 'Removed';
  }

  if (!degree && path.length >= 2) {
    const genA = path[0]?.depth || 0;
    const genB = path[path.length - 1]?.depth || 0;
    const diff = Math.abs(genA - genB);
    if (diff > 0 && !upper.includes('cousin') && !upper.includes('sibling')) {
      degree = `${diff}${diff === 1 ? 'st' : diff === 2 ? 'nd' : diff === 3 ? 'rd' : 'th'}`;
    }
  }

  return { nature, side, type, degree: degree || '-', removal: removal || '-' };
}

function getDisplayName(n: any): string {
  return n?.name || n?.displayName || `${n?.firstName || ''} ${n?.lastName || ''}`.trim() || 'Unknown';
}

function getRelationLabelAtStep(path: any[], index: number): string {
  if (index >= path.length - 1) return '';
  const current = path[index];
  const next = path[index + 1];
  if (!current || !next) return '';
  const edgeType = current._relationshipType || next._relationshipType || '';
  if (edgeType) return edgeType;
  if ((next.depth || 0) < (current.depth || 0)) return 'Parent of';
  if ((next.depth || 0) > (current.depth || 0)) return 'Child of';
  if (next.gender === 'male') return 'Brother of';
  if (next.gender === 'female') return 'Sister of';
  return 'Related to';
}

export default function TreeRelationshipHighlight({
  nodes,
  onFindPath,
  onFindCommonAncestor,
  onClear,
  pathResult,
  commonAncestorResult,
  onLocatePerson,
}: TreeRelationshipHighlightProps) {
  const [memberA, setMemberA] = useState('');
  const [memberB, setMemberB] = useState('');
  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');
  const [dropdownA, setDropdownA] = useState(false);
  const [dropdownB, setDropdownB] = useState(false);
  const [mode, setMode] = useState<Mode>('calculate');
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);

  const [calculateResult, setCalculateResult] = useState<any>(null);
  const [calculateLoading, setCalculateLoading] = useState(false);
  const [calculateError, setCalculateError] = useState<string>('');

  const [lineagePersonId, setLineagePersonId] = useState('');
  const [lineageSearch, setLineageSearch] = useState('');
  const [lineageDropdown, setLineageDropdown] = useState(false);
  const [lineageLoading, setLineageLoading] = useState(false);
  const [lineageError, setLineageError] = useState<string>('');
  const [paternalLineage, setPaternalLineage] = useState<any[] | null>(null);
  const [maternalLineage, setMaternalLineage] = useState<any[] | null>(null);
  const [oldestAncestor, setOldestAncestor] = useState<any | null>(null);

  const filteredA = useMemo(() => nodes.filter(n => {
    if (!searchA) return false;
    const name = n.name || n.displayName || '';
    return name.toLowerCase().includes(searchA.toLowerCase()) && n.entityType === 'MEMBER';
  }).slice(0, 10), [nodes, searchA]);

  const filteredB = useMemo(() => nodes.filter(n => {
    if (!searchB) return false;
    const name = n.name || n.displayName || '';
    return name.toLowerCase().includes(searchB.toLowerCase()) && n.entityType === 'MEMBER';
  }).slice(0, 10), [nodes, searchB]);

  const lineageFiltered = useMemo(() => nodes.filter(n => {
    if (!lineageSearch) return false;
    const name = n.name || n.displayName || '';
    return name.toLowerCase().includes(lineageSearch.toLowerCase()) && n.entityType === 'MEMBER';
  }).slice(0, 10), [nodes, lineageSearch]);

  const selectedNameA = useMemo(() => getDisplayName(nodes.find(n => n.id === memberA)), [nodes, memberA]);
  const selectedNameB = useMemo(() => getDisplayName(nodes.find(n => n.id === memberB)), [nodes, memberB]);
  const selectedGenderA = useMemo(() => nodes.find(n => n.id === memberA)?.gender, [nodes, memberA]);
  const selectedGenderB = useMemo(() => nodes.find(n => n.id === memberB)?.gender, [nodes, memberB]);

  const classification = useMemo(() => {
    if (!pathResult?.found) return null;
    return classifyRelationship(pathResult);
  }, [pathResult]);

  const handleCalculate = useCallback(async () => {
    if (!memberA || !memberB) return;
    setCalculateLoading(true);
    setCalculateError('');
    setCalculateResult(null);
    try {
      const token = api.getToken();
      const res = await fetch(`/api/nest/genealogy/calculate/${memberA}/${memberB}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to calculate relationship');
      setCalculateResult(data);
    } catch (err: any) {
      setCalculateError(err?.message || 'Failed to calculate relationship');
      setCalculateResult(null);
    } finally {
      setCalculateLoading(false);
    }
  }, [memberA, memberB]);

  const handleFetchLineage = useCallback(async () => {
    if (!lineagePersonId) return;
    setLineageLoading(true);
    setLineageError('');
    setPaternalLineage(null);
    setMaternalLineage(null);
    setOldestAncestor(null);
    try {
      const token = api.getToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [paternalRes, maternalRes, oldestRes] = await Promise.all([
        fetch(`/api/nest/genealogy/paternal-lineage/${lineagePersonId}`, { headers }),
        fetch(`/api/nest/genealogy/maternal-lineage/${lineagePersonId}`, { headers }),
        fetch(`/api/nest/genealogy/oldest-ancestor/${lineagePersonId}`, { headers }),
      ]);

      if (paternalRes.ok) {
        const paternalData = await paternalRes.json();
        setPaternalLineage(paternalData?.lineage || paternalData || []);
      }
      if (maternalRes.ok) {
        const maternalData = await maternalRes.json();
        setMaternalLineage(maternalData?.lineage || maternalData || []);
      }
      if (oldestRes.ok) {
        const oldestData = await oldestRes.json();
        setOldestAncestor(oldestData?.ancestor || oldestData);
      }
    } catch (err: any) {
      setLineageError(err?.message || 'Failed to fetch lineage info');
    } finally {
      setLineageLoading(false);
    }
  }, [lineagePersonId]);

  const handleFind = useCallback(() => {
    if (!memberA || !memberB) return;
    if (mode === 'calculate') {
      handleCalculate();
    } else if (mode === 'path') {
      onFindPath(memberA, memberB);
    } else if (mode === 'ancestor') {
      onFindCommonAncestor(memberA, memberB);
    }
  }, [memberA, memberB, mode, onFindPath, onFindCommonAncestor, handleCalculate]);

  const handleClear = useCallback(() => {
    setMemberA('');
    setMemberB('');
    setSearchA('');
    setSearchB('');
    setSelectedStepIndex(null);
    setCalculateResult(null);
    setCalculateError('');
    setCalculateLoading(false);
    onClear();
  }, [onClear]);

  const resultFound = pathResult?.found || commonAncestorResult?.found;
  const resultNotFound = (pathResult && !pathResult.found) || (commonAncestorResult && !commonAncestorResult.found);

  const personAObj = useMemo(() => {
    if (!memberA) return null;
    const n = nodes.find(x => x.id === memberA);
    if (!n) return null;
    return { id: n.id, name: getDisplayName(n), avatar: n.avatar, gender: n.gender };
  }, [nodes, memberA]);

  const personBObj = useMemo(() => {
    if (!memberB) return null;
    const n = nodes.find(x => x.id === memberB);
    if (!n) return null;
    return { id: n.id, name: getDisplayName(n), avatar: n.avatar, gender: n.gender };
  }, [nodes, memberB]);

  function renderRelationshipPath(path: any[]) {
    if (!path || path.length < 2) return null;
    return (
      <div className="mt-2 space-y-0.5">
        {path.map((m: any, i: number) => {
          const label = getRelationLabelAtStep(path, i);
          const isLast = i === path.length - 1;
          const isSelected = selectedStepIndex === i;
          return (
            <React.Fragment key={m.id || i}>
              <motion.button
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.2 }}
                onClick={() => setSelectedStepIndex(isSelected ? null : i)}
                className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs transition-all ${
                  isSelected
                    ? 'bg-emerald-100 ring-1 ring-emerald-400 dark:bg-emerald-900/30 dark:ring-emerald-600'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[8px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                  {i + 1}
                </span>
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {getDisplayName(m).charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800 dark:text-slate-200">{getDisplayName(m)}</p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500">
                    {RELATION_NAMES[m.depth] || `Gen ${m.depth}`}
                  </p>
                </div>
                {m.gender && (
                  <span className="shrink-0 text-[9px] text-slate-400">{m.gender === 'male' ? '\u2642' : m.gender === 'female' ? '\u2640' : '\u2661'}</span>
                )}
              </motion.button>
              {!isLast && label && (
                <div className="flex items-center gap-2 pl-6">
                  <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
                  <span className="text-[9px] italic text-slate-400 dark:text-slate-500">{label}</span>
                  <svg className="h-2.5 w-2.5 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  function renderLineageChain(chain: any[], label: string, colorClass: string) {
    if (!chain || chain.length === 0) return null;
    return (
      <div className="space-y-1">
        <p className={`text-[10px] font-medium uppercase tracking-wider ${colorClass === 'pink' ? 'text-pink-500 dark:text-pink-400' : 'text-blue-500 dark:text-blue-400'}`}>
          {label}
        </p>
        <div className="space-y-0.5">
          {chain.map((person: any, idx: number) => (
            <motion.div
              key={person.id || idx}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.2 }}
              className="flex items-center gap-2 rounded-lg bg-white/50 px-2 py-1.5 text-xs dark:bg-white/5"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[7px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                {idx + 1}
              </span>
              <span className="font-medium text-slate-800 dark:text-slate-200 truncate flex-1">
                {getDisplayName(person)}
              </span>
              {person.generation !== undefined && (
                <span className="text-[9px] text-slate-400 dark:text-slate-500">
                  Gen {person.generation}
                </span>
              )}
              {person.gender && (
                <span className="text-[9px] text-slate-400">{person.gender === 'male' ? '\u2642' : person.gender === 'female' ? '\u2640' : '\u2661'}</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
          <svg className="mr-1 inline-block h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Relationship Calculator
        </h4>
      </div>

      <div className="mb-3 flex gap-0.5 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800">
        {([
          { key: 'calculate' as Mode, label: 'Calculate' },
          { key: 'path' as Mode, label: 'Path' },
          { key: 'ancestor' as Mode, label: 'Common Ancestor' },
          { key: 'lineage' as Mode, label: 'Lineage' },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setMode(tab.key);
              setSelectedStepIndex(null);
            }}
            className={`flex-1 rounded-md px-1.5 py-1 text-[10px] font-medium transition-all ${
              mode === tab.key
                ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {mode !== 'lineage' && (
        <div className="space-y-2">
          <div className="relative">
            <label className="mb-0.5 flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-100 text-[8px] font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">A</span>
              Person A
            </label>
            {memberA ? (
              <div className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 dark:border-emerald-800 dark:bg-emerald-900/20">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-200 text-[8px] font-bold text-emerald-700 dark:bg-emerald-800 dark:text-emerald-300">
                  {selectedNameA.charAt(0)}
                </div>
                <span className="flex-1 truncate text-xs font-medium text-emerald-700 dark:text-emerald-400">{selectedNameA}</span>
                <button onClick={() => { setMemberA(''); setSearchA(''); setCalculateResult(null); setCalculateError(''); }} className="text-emerald-400 hover:text-emerald-600">&times;</button>
              </div>
            ) : (
              <input
                type="text"
                value={searchA}
                onChange={(e) => { setSearchA(e.target.value); setDropdownA(true); }}
                onFocus={() => setDropdownA(true)}
                placeholder="Search person..."
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            )}
            {dropdownA && searchA && filteredA.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {filteredA.map(n => (
                  <button key={n.id} onClick={() => { setMemberA(n.id); setSearchA(''); setDropdownA(false); }}
                    className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-800">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[8px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {getDisplayName(n).charAt(0)}
                    </div>
                    <span className="font-medium">{getDisplayName(n)}</span>
                    <span className="text-[10px] text-slate-400">{n.gender || ''}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <svg className="h-2.5 w-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>

          <div className="relative">
            <label className="mb-0.5 flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-blue-100 text-[8px] font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">B</span>
              Person B
            </label>
            {memberB ? (
              <div className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1.5 dark:border-blue-800 dark:bg-blue-900/20">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-200 text-[8px] font-bold text-blue-700 dark:bg-blue-800 dark:text-blue-300">
                  {selectedNameB.charAt(0)}
                </div>
                <span className="flex-1 truncate text-xs font-medium text-blue-700 dark:text-blue-400">{selectedNameB}</span>
                <button onClick={() => { setMemberB(''); setSearchB(''); setCalculateResult(null); setCalculateError(''); }} className="text-blue-400 hover:text-blue-600">&times;</button>
              </div>
            ) : (
              <input
                type="text"
                value={searchB}
                onChange={(e) => { setSearchB(e.target.value); setDropdownB(true); }}
                onFocus={() => setDropdownB(true)}
                placeholder="Search person..."
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            )}
            {dropdownB && searchB && filteredB.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {filteredB.map(n => (
                  <button key={n.id} onClick={() => { setMemberB(n.id); setSearchB(''); setDropdownB(false); }}
                    className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-800">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[8px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {getDisplayName(n).charAt(0)}
                    </div>
                    <span className="font-medium">{getDisplayName(n)}</span>
                    <span className="text-[10px] text-slate-400">{n.gender || ''}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={handleFind}
              disabled={!memberA || !memberB || (mode === 'calculate' && calculateLoading)}
              className="flex-1 rounded-lg bg-emerald-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {mode === 'calculate' ? (calculateLoading ? 'Calculating...' : 'Calculate') : mode === 'path' ? 'Find Path' : 'Find Common Ancestor'}
            </button>
            <button onClick={handleClear} className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              Clear
            </button>
          </div>
        </div>
      )}

      {mode === 'lineage' && (
        <div className="space-y-2">
          <div className="relative">
            <label className="mb-0.5 flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              Person
            </label>
            {lineagePersonId ? (
              <div className="flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2 py-1.5 dark:border-violet-800 dark:bg-violet-900/20">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-200 text-[8px] font-bold text-violet-700 dark:bg-violet-800 dark:text-violet-300">
                  {getDisplayName(nodes.find(n => n.id === lineagePersonId)).charAt(0)}
                </div>
                <span className="flex-1 truncate text-xs font-medium text-violet-700 dark:text-violet-400">
                  {getDisplayName(nodes.find(n => n.id === lineagePersonId))}
                </span>
                <button onClick={() => { setLineagePersonId(''); setLineageSearch(''); setPaternalLineage(null); setMaternalLineage(null); setOldestAncestor(null); setLineageError(''); }} className="text-violet-400 hover:text-violet-600">&times;</button>
              </div>
            ) : (
              <input
                type="text"
                value={lineageSearch}
                onChange={(e) => { setLineageSearch(e.target.value); setLineageDropdown(true); }}
                onFocus={() => setLineageDropdown(true)}
                placeholder="Search person..."
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:border-violet-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            )}
            {lineageDropdown && lineageSearch && lineageFiltered.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
                {lineageFiltered.map(n => (
                  <button key={n.id} onClick={() => { setLineagePersonId(n.id); setLineageSearch(''); setLineageDropdown(false); }}
                    className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-800">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[8px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {getDisplayName(n).charAt(0)}
                    </div>
                    <span className="font-medium">{getDisplayName(n)}</span>
                    <span className="text-[10px] text-slate-400">{n.gender || ''}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleFetchLineage}
            disabled={!lineagePersonId || lineageLoading}
            className="w-full rounded-lg bg-violet-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {lineageLoading ? 'Loading Lineage...' : 'Show Lineage'}
          </button>

          <AnimatePresence mode="wait">
            {lineageLoading && (
              <motion.div key="lineage-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="animate-pulse space-y-2 py-4">
                <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
              </motion.div>
            )}

            {!lineageLoading && lineageError && (
              <motion.div key="lineage-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-3 text-center text-[11px] text-red-500">
                {lineageError}
              </motion.div>
            )}

            {!lineageLoading && !lineageError && (paternalLineage || maternalLineage || oldestAncestor) && (
              <motion.div
                key="lineage-results"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-3 mt-3"
              >
                {oldestAncestor && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 dark:border-amber-800 dark:bg-amber-900/20"
                  >
                    <p className="text-[9px] font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">Oldest Known Ancestor</p>
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-200 text-[9px] font-bold text-amber-700 dark:bg-amber-800 dark:text-amber-300">
                        {getDisplayName(oldestAncestor).charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {getDisplayName(oldestAncestor)}
                        </p>
                        {oldestAncestor.generation !== undefined && (
                          <p className="text-[9px] text-slate-500 dark:text-slate-400">
                            Generation {oldestAncestor.generation}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {paternalLineage && paternalLineage.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1, duration: 0.25 }}
                      className="rounded-lg border border-blue-200 bg-blue-50/50 p-2 dark:border-blue-800 dark:bg-blue-900/10"
                    >
                      {renderLineageChain(paternalLineage, 'Paternal Lineage', 'blue')}
                    </motion.div>
                  )}
                  {maternalLineage && maternalLineage.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15, duration: 0.25 }}
                      className="rounded-lg border border-pink-200 bg-pink-50/50 p-2 dark:border-pink-800 dark:bg-pink-900/10"
                    >
                      {renderLineageChain(maternalLineage, 'Maternal Lineage', 'pink')}
                    </motion.div>
                  )}
                </div>

                {((paternalLineage && paternalLineage.length > 0) || (maternalLineage && maternalLineage.length > 0)) && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.25 }}
                    className="rounded-lg bg-slate-50 p-2 dark:bg-slate-800/50"
                  >
                    <p className="mb-1.5 text-[9px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Generation Depth</p>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      <div className="rounded bg-white/60 p-1.5 text-center dark:bg-slate-800">
                        <span className="text-[9px] text-slate-400">Paternal</span>
                        <p className="font-bold text-slate-700 dark:text-slate-300">{paternalLineage?.length || 0} gen(s)</p>
                      </div>
                      <div className="rounded bg-white/60 p-1.5 text-center dark:bg-slate-800">
                        <span className="text-[9px] text-slate-400">Maternal</span>
                        <p className="font-bold text-slate-700 dark:text-slate-300">{maternalLineage?.length || 0} gen(s)</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {!lineageLoading && !lineageError && !paternalLineage && !maternalLineage && !oldestAncestor && lineagePersonId && (
              <motion.div key="lineage-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-4 text-center text-[10px] text-slate-400 dark:text-slate-500">
                No lineage data found for this person
              </motion.div>
            )}

            {!lineageLoading && !lineageError && !lineagePersonId && (
              <div className="py-4 text-center">
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Select a person to view their lineage</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence mode="wait">
        {mode === 'calculate' && (
          <motion.div
            key="calculate-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mt-3"
          >
            <RelationshipViewer
              personA={personAObj}
              personB={personBObj}
              result={calculateResult}
              loading={calculateLoading}
              error={calculateError}
              onLocatePerson={onLocatePerson}
              onClear={() => { setCalculateResult(null); setCalculateError(''); }}
            />
          </motion.div>
        )}

        {mode === 'path' && (
          <motion.div
            key="path-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {resultFound && pathResult?.found && (
              <motion.div
                key="result-relationship"
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-200 text-[9px] font-bold text-emerald-700 dark:bg-emerald-800 dark:text-emerald-300">
                      {selectedNameA.charAt(0)}
                    </div>
                    <svg className="h-3 w-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-200 text-[9px] font-bold text-blue-700 dark:bg-blue-800 dark:text-blue-300">
                      {selectedNameB.charAt(0)}
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-[9px] font-medium text-emerald-700 dark:bg-emerald-800 dark:text-emerald-300">
                    {pathResult.distance} steps
                  </span>
                </div>

                <div className="mb-2 text-center">
                  <p className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                    {pathResult.relationship || 'Related'}
                  </p>
                </div>

                {classification && (
                  <div className="mb-2 flex flex-wrap gap-1">
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${NATURE_COLORS[classification.nature] || NATURE_COLORS.Blood}`}>
                      {classification.nature}
                    </span>
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${SIDE_COLORS[classification.side] || SIDE_COLORS.Unknown}`}>
                      {classification.side}
                    </span>
                    <span className="rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      {classification.type}
                    </span>
                    {classification.degree && classification.degree !== '-' && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        {classification.degree} Degree
                      </span>
                    )}
                    {classification.removal && classification.removal !== '-' && (
                      <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-medium text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
                        {classification.removal}
                      </span>
                    )}
                  </div>
                )}

                {pathResult.commonAncestor && (
                  <div className="mb-2 rounded-lg bg-white/60 p-2 dark:bg-white/5">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Common Ancestor</p>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {pathResult.commonAncestor.name || 'Unknown'}
                    </p>
                    <div className="mt-1 flex gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                      <span>{pathResult.commonAncestor.depthFromA ?? '?'} gen(s) from A</span>
                      <span>&middot;</span>
                      <span>{pathResult.commonAncestor.depthFromB ?? '?'} gen(s) from B</span>
                    </div>
                  </div>
                )}

                {renderRelationshipPath(pathResult.path)}
              </motion.div>
            )}

            {resultNotFound && mode === 'path' && (
              <motion.div
                key="result-not-found"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-700 dark:bg-slate-800"
              >
                <svg className="mx-auto mb-1 h-5 w-5 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">No relationship path found</p>
              </motion.div>
            )}

            {!resultFound && !resultNotFound && mode === 'path' && !pathResult && (
              <div className="mt-3 text-center py-4">
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Select two people to find their relationship path</p>
              </div>
            )}
          </motion.div>
        )}

        {mode === 'ancestor' && (
          <motion.div
            key="ancestor-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {resultFound && commonAncestorResult?.found && (
              <motion.div
                key="result-ancestor"
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20"
              >
                <div className="mb-2 flex items-center gap-2">
                  <svg className="h-4 w-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                  <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">Common Ancestor Found</span>
                </div>

                <div className="mb-2 flex items-center gap-3 rounded-lg bg-white/60 p-2 dark:bg-white/5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-200 text-sm font-bold text-amber-700 dark:bg-amber-800 dark:text-amber-300">
                    {getDisplayName(commonAncestorResult.commonAncestor).charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-800 dark:text-amber-200">
                      {getDisplayName(commonAncestorResult.commonAncestor)}
                    </p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400">
                      {commonAncestorResult.commonAncestor.gender || 'Unknown'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded bg-white/60 p-1.5 text-center dark:bg-white/5">
                    <p className="text-[9px] text-slate-500 dark:text-slate-400">From A</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {commonAncestorResult.commonAncestor.depthFromA ?? '?'} gen
                    </p>
                  </div>
                  <svg className="h-3 w-3 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                  <div className="flex-1 rounded bg-white/60 p-1.5 text-center dark:bg-white/5">
                    <p className="text-[9px] text-slate-500 dark:text-slate-400">From B</p>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {commonAncestorResult.commonAncestor.depthFromB ?? '?'} gen
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {resultNotFound && mode === 'ancestor' && (
              <motion.div
                key="result-not-found-ancestor"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-700 dark:bg-slate-800"
              >
                <svg className="mx-auto mb-1 h-5 w-5 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">No common ancestor found</p>
              </motion.div>
            )}

            {!resultFound && !resultNotFound && mode === 'ancestor' && !commonAncestorResult && (
              <div className="mt-3 text-center py-4">
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Select two people to find their common ancestor</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
