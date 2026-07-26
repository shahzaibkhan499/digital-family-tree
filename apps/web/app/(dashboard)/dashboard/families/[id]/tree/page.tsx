'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  gender?: string;
  birthDate?: string;
  deathDate?: string;
  avatar?: string;
}

interface Relationship {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  type: string;
}

interface LayoutResult {
  positions: Record<string, { x: number; y: number }>;
  couples: { members: string[]; generation: number }[];
  parentChildLinks: { parentCoupleIdx: number; childMemberIds: string[] }[];
  rootCouples: number[];
  coupleToChildCouples: Map<number, number[]>;
  coupleCenterX: Map<number, number>;
}

const CARD_W = 200;
const CARD_H = 100;
const SPOUSE_GAP = 16;
const SIBLING_GAP = 48;
const ROW_GAP = 140;
const PADDING = 60;

const MALE_COLOR = '#3b82f6';
const FEMALE_COLOR = '#ec4899';
const OTHER_COLOR = '#8b5cf6';
const DEFAULT_COLOR = '#6b7280';

function genderColor(g?: string) {
  const v = (g || '').toLowerCase();
  if (v === 'male') return MALE_COLOR;
  if (v === 'female') return FEMALE_COLOR;
  if (v === 'other') return OTHER_COLOR;
  return DEFAULT_COLOR;
}

function genderIcon(g?: string) {
  const v = (g || '').toLowerCase();
  if (v === 'male') return '\u2642';
  if (v === 'female') return '\u2640';
  return '\u2661';
}

function birthYear(d?: string) {
  if (!d) return null;
  try { return new Date(d).getFullYear(); } catch { return null; }
}

function getInitials(first?: string, last?: string) {
  return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase() || '?';
}

function calculateHierarchicalLayout(
  members: Member[],
  relationships: Relationship[]
): LayoutResult {
  const positions: Record<string, { x: number; y: number }> = {};
  const couples: { members: string[]; generation: number }[] = [];
  const parentChildLinks: { parentCoupleIdx: number; childMemberIds: string[] }[] = [];
  const rootCouples: number[] = [];
  const coupleToChildCouples = new Map<number, number[]>();
  const coupleCenterX = new Map<number, number>();

  if (members.length === 0) {
    return { positions, couples, parentChildLinks, rootCouples, coupleToChildCouples, coupleCenterX };
  }

  const spouseOf = new Map<string, Set<string>>();
  const childrenOf = new Map<string, string[]>();
  const parentsOf = new Map<string, string[]>();

  for (const m of members) {
    spouseOf.set(m.id, new Set());
    childrenOf.set(m.id, []);
    parentsOf.set(m.id, []);
  }

  for (const r of relationships) {
    const t = r.type.toUpperCase();
    if (['HUSBAND', 'WIFE', 'PARTNER'].includes(t)) {
      spouseOf.get(r.fromMemberId)?.add(r.toMemberId);
      spouseOf.get(r.toMemberId)?.add(r.fromMemberId);
    } else if (['SON', 'DAUGHTER', 'GRANDSON', 'GRANDDAUGHTER'].includes(t)) {
      childrenOf.get(r.fromMemberId)?.push(r.toMemberId);
      parentsOf.get(r.toMemberId)?.push(r.fromMemberId);
    } else if (['FATHER', 'MOTHER', 'GRANDFATHER', 'GRANDMOTHER'].includes(t)) {
      childrenOf.get(r.toMemberId)?.push(r.fromMemberId);
      parentsOf.get(r.fromMemberId)?.push(r.toMemberId);
    }
  }

  const visited = new Set<string>();
  const memberToCoupleIdx = new Map<string, number>();

  for (const m of members) {
    if (visited.has(m.id)) continue;
    const group: string[] = [];
    const stack = [m.id];
    while (stack.length > 0) {
      const id = stack.pop()!;
      if (visited.has(id)) continue;
      visited.add(id);
      group.push(id);
      for (const sp of spouseOf.get(id) || []) {
        if (!visited.has(sp)) stack.push(sp);
      }
    }
    if (group.length > 0) {
      const idx = couples.length;
      couples.push({ members: group, generation: 0 });
      for (const gid of group) memberToCoupleIdx.set(gid, idx);
    }
  }

  const coupleChildren = new Map<number, Set<string>>();
  for (let i = 0; i < couples.length; i++) coupleChildren.set(i, new Set());

  for (const [childId, parentIds] of parentsOf) {
    for (const pid of parentIds) {
      const ci = memberToCoupleIdx.get(pid);
      if (ci !== undefined) {
        coupleChildren.get(ci)?.add(childId);
        break;
      }
    }
  }

  for (let i = 0; i < couples.length; i++) coupleToChildCouples.set(i, []);

  for (let ci = 0; ci < couples.length; ci++) {
    for (const childId of coupleChildren.get(ci) || []) {
      const childCi = memberToCoupleIdx.get(childId);
      if (childCi !== undefined && childCi !== ci) {
        const existing = coupleToChildCouples.get(ci)!;
        if (!existing.includes(childCi)) existing.push(childCi);
      }
    }
  }

  for (let ci = 0; ci < couples.length; ci++) {
    const hasParent = couples[ci].members.some(id =>
      (parentsOf.get(id) || []).some(p => memberToCoupleIdx.has(p))
    );
    if (!hasParent) rootCouples.push(ci);
  }
  if (rootCouples.length === 0 && couples.length > 0) rootCouples.push(0);

  const coupleGen = new Map<number, number>();
  const queue: { ci: number; gen: number }[] = [];
  for (const rc of rootCouples) {
    coupleGen.set(rc, 0);
    queue.push({ ci: rc, gen: 0 });
  }

  while (queue.length > 0) {
    const { ci, gen } = queue.shift()!;
    for (const childCi of coupleToChildCouples.get(ci) || []) {
      if (!coupleGen.has(childCi) || coupleGen.get(childCi)! < gen + 1) {
        coupleGen.set(childCi, gen + 1);
        queue.push({ ci: childCi, gen: gen + 1 });
      }
    }
  }

  let maxGen = 0;
  for (const [, gen] of coupleGen) maxGen = Math.max(maxGen, gen);
  for (let ci = 0; ci < couples.length; ci++) {
    if (!coupleGen.has(ci)) coupleGen.set(ci, ++maxGen);
  }

  for (let ci = 0; ci < couples.length; ci++) {
    couples[ci].generation = coupleGen.get(ci) || 0;
  }

  const subtreeWidth = new Map<number, number>();
  const sortedCouples = [...coupleGen.entries()].sort((a, b) => b[1] - a[1]);

  for (const [ci] of sortedCouples) {
    const numMembers = couples[ci].members.length;
    const cardW = numMembers * CARD_W + (numMembers - 1) * SPOUSE_GAP;
    const childCouples = coupleToChildCouples.get(ci) || [];
    const childWidths = childCouples.map(c => subtreeWidth.get(c) || 0).filter(w => w > 0);
    const totalChildW = childWidths.length > 0
      ? childWidths.reduce((a, b) => a + b, 0) + (childWidths.length - 1) * SIBLING_GAP
      : 0;
    subtreeWidth.set(ci, Math.max(cardW, totalChildW));
  }

  const sortedRoots = [...rootCouples].sort(
    (a, b) => (subtreeWidth.get(a) || CARD_W) - (subtreeWidth.get(b) || CARD_W)
  );

  let rx = PADDING;
  for (const rc of sortedRoots) {
    const w = subtreeWidth.get(rc) || CARD_W;
    coupleCenterX.set(rc, rx + w / 2);
    rx += w + SIBLING_GAP;
  }

  const processed = new Set<number>();
  const q = [...rootCouples];
  while (q.length > 0) {
    const ci = q.shift()!;
    if (processed.has(ci)) continue;
    processed.add(ci);

    const parentCenter = coupleCenterX.get(ci) || PADDING + CARD_W / 2;
    const children = (coupleToChildCouples.get(ci) || []).filter(c => !processed.has(c));

    if (children.length > 0) {
      const childW = children.map(c => subtreeWidth.get(c) || CARD_W);
      const totalChildW = childW.reduce((a, b) => a + b, 0) + (children.length - 1) * SIBLING_GAP;
      const startX = parentCenter - totalChildW / 2;

      let cx = startX;
      for (const childCi of children) {
        const cw = subtreeWidth.get(childCi) || CARD_W;
        coupleCenterX.set(childCi, cx + cw / 2);
        cx += cw + SIBLING_GAP;
        q.push(childCi);
      }
    }
  }

  for (let ci = 0; ci < couples.length; ci++) {
    if (!coupleCenterX.has(ci)) {
      coupleCenterX.set(ci, PADDING + CARD_W / 2);
    }
  }

  for (const [ci, gen] of coupleGen) {
    const membersList = couples[ci].members;
    const numM = membersList.length;
    const totalCardW = numM * CARD_W + (numM - 1) * SPOUSE_GAP;
    const cx = coupleCenterX.get(ci) || PADDING + CARD_W / 2;
    const startX = cx - totalCardW / 2;

    membersList.forEach((id, i) => {
      positions[id] = {
        x: startX + i * (CARD_W + SPOUSE_GAP),
        y: PADDING + gen * (CARD_H + ROW_GAP),
      };
    });
  }

  for (let ci = 0; ci < couples.length; ci++) {
    const childMembers = [...(coupleChildren.get(ci) || [])].filter(id => {
      const childCi = memberToCoupleIdx.get(id);
      return childCi === undefined || childCi === ci;
    });
    if (childMembers.length > 0) {
      parentChildLinks.push({ parentCoupleIdx: ci, childMemberIds: childMembers });
    }
  }

  return {
    positions,
    couples,
    parentChildLinks,
    rootCouples,
    coupleToChildCouples,
    coupleCenterX,
  };
}

export default function FamilyTreePage() {
  const { user } = useAuth();
  const params = useParams();
  const familyId = params.id as string;
  const [family, setFamily] = useState<any>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 800, h: 600 });

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, vbX: 0, vbY: 0 });

  useEffect(() => {
    if (!familyId) return;
    setLoading(true);
    Promise.all([
      api.families.get(familyId).catch(() => null),
      api.relationships.list(familyId).catch(() => []),
    ]).then(([fam, rels]) => {
      if (!fam) {
        setError('Family not found.');
      } else {
        setFamily(fam);
        setRelationships(rels);
      }
      setLoading(false);
    });
  }, [familyId]);

  const layoutResult = useMemo(
    () => calculateHierarchicalLayout(family?.members || [], relationships),
    [family?.members, relationships]
  );

  const positions = layoutResult.positions;

  useEffect(() => {
    if (Object.keys(positions).length === 0) return;
    const xs = Object.values(positions).map(p => p.x);
    const ys = Object.values(positions).map(p => p.y);
    const minX = Math.min(...xs) - 60;
    const minY = Math.min(...ys) - 60;
    const maxX = Math.max(...xs) + CARD_W + 80;
    const maxY = Math.max(...ys) + CARD_H + 80;
    setViewBox(v => ({
      x: Math.min(v.x, minX),
      y: Math.min(v.y, minY),
      w: Math.max(v.w, maxX - minX),
      h: Math.max(v.h, maxY - minY),
    }));
  }, [positions]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current && svgRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setViewBox(v => ({
          x: v.x,
          y: v.y,
          w: Math.max(v.w, rect.width),
          h: Math.max(v.h, rect.height),
        }));
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      setDragging(true);
      dragRef.current = { startX: e.clientX, startY: e.clientY, vbX: viewBox.x, vbY: viewBox.y };
      e.preventDefault();
    },
    [viewBox.x, viewBox.y]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const scaleX = viewBox.w / rect.width;
      const scaleY = viewBox.h / rect.height;
      const dx = (e.clientX - dragRef.current.startX) * scaleX;
      const dy = (e.clientY - dragRef.current.startY) * scaleY;
      setViewBox(v => ({ ...v, x: dragRef.current.vbX - dx, y: dragRef.current.vbY - dy }));
    },
    [dragging, viewBox.w, viewBox.h]
  );

  const handleMouseUp = useCallback(() => setDragging(false), []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.08 : 0.92;
    setViewBox(v => {
      const newW = v.w * factor;
      const newH = v.h * factor;
      return { x: v.x - (newW - v.w) / 2, y: v.y - (newH - v.h) / 2, w: newW, h: newH };
    });
  }, []);

  const members: Member[] = family?.members || [];
  const hasRelationships = relationships.length > 0;

  const result = useMemo(() => {
    if (!hasRelationships || Object.keys(positions).length === 0) {
      return { spouseLines: [], parentChildLines: [], nodes: [] };
    }

    const spouseLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const parentChildLines: { x1: number; y1: number; x2: number; y2: number; midY?: number; childLines: { x: number; y1: number; y2: number }[] }[] = [];

    const spouseOf = new Map<string, string[]>();
    const childrenOf = new Map<string, string[]>();

    for (const m of members) {
      spouseOf.set(m.id, []);
      childrenOf.set(m.id, []);
    }

    for (const r of relationships) {
      const t = r.type.toUpperCase();
      if (['HUSBAND', 'WIFE', 'PARTNER'].includes(t)) {
        spouseOf.get(r.fromMemberId)?.push(r.toMemberId);
        spouseOf.get(r.toMemberId)?.push(r.fromMemberId);
      } else if (['SON', 'DAUGHTER', 'GRANDSON', 'GRANDDAUGHTER'].includes(t)) {
        childrenOf.get(r.fromMemberId)?.push(r.toMemberId);
      } else if (['FATHER', 'MOTHER', 'GRANDFATHER', 'GRANDMOTHER'].includes(t)) {
        childrenOf.get(r.toMemberId)?.push(r.fromMemberId);
      }
    }

    const drawnSpouse = new Set<string>();
    for (const [id, spouses] of spouseOf) {
      for (const sp of spouses) {
        const key = [id, sp].sort().join('::');
        if (drawnSpouse.has(key)) continue;
        drawnSpouse.add(key);
        const p1 = positions[id];
        const p2 = positions[sp];
        if (!p1 || !p2) continue;
        const left = p1.x < p2.x ? p1 : p2;
        const right = p1.x < p2.x ? p2 : p1;
        spouseLines.push({
          x1: left.x + CARD_W,
          y1: left.y + CARD_H / 2,
          x2: right.x,
          y2: right.y + CARD_H / 2,
        });
      }
    }

    const drawnChildren = new Set<string>();
    for (const [parentId, children] of childrenOf) {
      const parentPos = positions[parentId];
      if (!parentPos) continue;

      const validChildren = children.filter(c => positions[c] && !drawnChildren.has(c));
      if (validChildren.length === 0) continue;

      const parentCoupleMembers = layoutResult.couples.find(c => c.members.includes(parentId))?.members || [parentId];
      const parentPositions = parentCoupleMembers.map(id => positions[id]).filter(Boolean);
      if (parentPositions.length === 0) continue;

      const minParentX = Math.min(...parentPositions.map(p => p.x));
      const maxParentX = Math.max(...parentPositions.map(p => p.x + CARD_W));
      const parentBottomY = Math.max(...parentPositions.map(p => p.y + CARD_H));
      const parentCenterX = (minParentX + maxParentX) / 2;

      const childCenters = validChildren.map(id => {
        drawnChildren.add(id);
        const p = positions[id]!;
        return { x: p.x + CARD_W / 2, y: p.y };
      });

      childCenters.sort((a, b) => a.x - b.x);

      const childTopY = childCenters[0].y;
      const midY = parentBottomY + (childTopY - parentBottomY) / 2;

      const minChildX = Math.min(...childCenters.map(c => c.x));
      const maxChildX = Math.max(...childCenters.map(c => c.x));

      parentChildLines.push({
        x1: parentCenterX,
        y1: parentBottomY,
        x2: parentCenterX,
        y2: midY,
        midY,
        childLines: childCenters.map(c => ({
          x: c.x,
          y1: midY,
          y2: c.y,
        })),
      });
    }

    return { spouseLines, parentChildLines };
  }, [hasRelationships, positions, members, relationships, layoutResult.couples]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link
          href={`/dashboard/families/${familyId}`}
          className="text-sm text-emerald-600 hover:text-emerald-700"
        >
          &larr; Back to family
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-800 dark:bg-red-900/10">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!family) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href={`/dashboard/families/${familyId}`}
            className="text-sm text-emerald-600 hover:text-emerald-700"
          >
            &larr; Back to {family.name}
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {family.name} &mdash; Tree View
          </h1>
        </div>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {members.length} member{members.length !== 1 ? 's' : ''}
        </span>
      </div>

      {!hasRelationships ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-slate-900 dark:text-white">No relationships yet</p>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            Add relationships between members to see the family tree visualization.
          </p>
          <Link
            href={`/dashboard/families/${familyId}`}
            className="mt-4 inline-block rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Go to Family Page
          </Link>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
          style={{ height: 'calc(100vh - 220px)', minHeight: 400 }}
        >
          <svg
            ref={svgRef}
            viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
            className="h-full w-full"
            style={{ cursor: dragging ? 'grabbing' : 'grab' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <defs>
              <filter id="card-shadow" x="-10%" y="-10%" width="120%" height="140%">
                <feDropShadow dx="0" dy="1" stdDeviation="3" floodOpacity="0.12" />
              </filter>
            </defs>

            {result.spouseLines.map((line, i) => (
              <line
                key={`spouse-${i}`}
                x1={line.x1}
                y1={line.y1}
                x2={line.x2}
                y2={line.y2}
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="6 4"
              />
            ))}

            {result.parentChildLines.map((group, i) => (
              <g key={`parent-child-${i}`}>
                <line
                  x1={group.x1}
                  y1={group.y1}
                  x2={group.x2}
                  y2={group.y2}
                  stroke="#94a3b8"
                  strokeWidth={2}
                />
                <line
                  x1={Math.min(...group.childLines.map(c => c.x))}
                  y1={group.midY!}
                  x2={Math.max(...group.childLines.map(c => c.x))}
                  y2={group.midY!}
                  stroke="#94a3b8"
                  strokeWidth={2}
                />
                {group.childLines.map((cl, j) => (
                  <line
                    key={`cl-${j}`}
                    x1={cl.x}
                    y1={cl.y1}
                    x2={cl.x}
                    y2={cl.y2}
                    stroke="#94a3b8"
                    strokeWidth={2}
                  />
                ))}
              </g>
            ))}

            {members.map(m => {
              const p = positions[m.id];
              if (!p) return null;
              const color = genderColor(m.gender);
              const yr = birthYear(m.birthDate);
              const isDeceased = !!m.deathDate;
              const dy = birthYear(m.deathDate);
              const initials = getInitials(m.firstName, m.lastName);
              const fullName =
                `${m.firstName} ${m.lastName}`.length > 22
                  ? `${m.firstName} ${m.lastName}`.slice(0, 21) + '\u2026'
                  : `${m.firstName} ${m.lastName}`;
              const dates = yr ? (dy ? `${yr}\u2013${dy}` : `b. ${yr}`) : (dy ? `d. ${dy}` : '');
              const memberUserId = (m as any).userId || (m as any).id;
              const isCurrentUser = user && memberUserId === user.id;
              const genderLabel = m.gender || 'Unknown';

              return (
                <g key={m.id} filter={isCurrentUser ? undefined : 'url(#card-shadow)'}>
                  {/* ME badge for current user */}
                  {isCurrentUser && (
                    <g transform={`translate(${p.x + CARD_W - 20}, ${p.y - 5})`}>
                      <rect x={0} y={0} width={26} height={14} rx={4} fill="#3b82f6" />
                      <text x={13} y={11} textAnchor="middle" fontSize={8} fill="white" fontWeight="bold">ME</text>
                    </g>
                  )}

                  {/* Card shadow */}
                  {isCurrentUser && (
                    <rect x={p.x - 3} y={p.y - 3} width={CARD_W + 6} height={CARD_H + 6} rx={13} ry={13}
                      fill="none" stroke="#3b82f6" strokeWidth={2.5} opacity={0.6} />
                  )}

                  <rect
                    x={p.x}
                    y={p.y}
                    width={CARD_W}
                    height={CARD_H}
                    rx={12}
                    ry={12}
                    fill="white"
                    className="dark:fill-slate-800"
                    stroke={isCurrentUser ? '#3b82f6' : color}
                    strokeWidth={isCurrentUser ? 2.5 : 2}
                  />
                  <rect
                    x={p.x}
                    y={p.y}
                    width={CARD_W}
                    height={36}
                    rx={12}
                    ry={12}
                    fill={color}
                    opacity={0.12}
                  />
                  <clipPath id={`clip-${m.id}`}>
                    <rect x={p.x} y={p.y} width={CARD_W} height={36} rx={12} ry={12} />
                  </clipPath>
                  <g clipPath={`url(#clip-${m.id})`}>
                    <circle
                      cx={p.x + 19}
                      cy={p.y + 18}
                      r={11}
                      fill={color}
                      opacity={0.3}
                    />
                    <text
                      x={p.x + 19}
                      y={p.y + 22}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="700"
                      fill={color}
                    >
                      {initials}
                    </text>
                  </g>
                  <text
                    x={p.x + 38}
                    y={p.y + 16}
                    fontSize="12"
                    fontWeight="700"
                    className="fill-slate-900 dark:fill-white"
                  >
                    {fullName}
                  </text>
                  <text
                    x={p.x + 38}
                    y={p.y + 30}
                    fontSize="10"
                    className="fill-slate-400 dark:fill-slate-500"
                  >
                    {genderIcon(m.gender)} {genderLabel}
                  </text>
                  <text
                    x={p.x + 14}
                    y={p.y + 56}
                    fontSize="11"
                    className="fill-slate-500 dark:fill-slate-400"
                  >
                    {dates || '\u00a0'}
                  </text>
                  <rect
                    x={p.x + CARD_W - 52}
                    y={p.y + 52}
                    width={isDeceased ? 38 : 40}
                    height={17}
                    rx={8}
                    ry={8}
                    fill={isDeceased ? '#94a3b8' : '#10b981'}
                    opacity={0.12}
                  />
                  <text
                    x={p.x + CARD_W - (isDeceased ? 33 : 32)}
                    y={p.y + 63}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="600"
                    className={isDeceased ? 'fill-slate-500 dark:fill-slate-400' : 'fill-emerald-600 dark:fill-emerald-400'}
                  >
                    {isDeceased ? 'Deceased' : 'Living'}
                  </text>
                </g>
              );
            })}
          </svg>

          <div className="absolute bottom-3 left-3 flex gap-1 rounded-lg border border-slate-200 bg-white/90 p-1 dark:border-slate-700 dark:bg-slate-800/90">
            <button
              onClick={() =>
                setViewBox(v => {
                  const f = 0.8;
                  return {
                    x: v.x + (v.w * (1 - f)) / 2,
                    y: v.y + (v.h * (1 - f)) / 2,
                    w: v.w * f,
                    h: v.h * f,
                  };
                })
              }
              className="rounded px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
              title="Zoom in"
            >
              +
            </button>
            <button
              onClick={() =>
                setViewBox(v => {
                  const f = 1.25;
                  return {
                    x: v.x + (v.w * (1 - f)) / 2,
                    y: v.y + (v.h * (1 - f)) / 2,
                    w: v.w * f,
                    h: v.h * f,
                  };
                })
              }
              className="rounded px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
              title="Zoom out"
            >
              &minus;
            </button>
            <button
              onClick={() => {
                const xs = Object.values(positions).map(p => p.x);
                const ys = Object.values(positions).map(p => p.y);
                if (xs.length === 0) return;
                const minX = Math.min(...xs) - 60;
                const minY = Math.min(...ys) - 60;
                const maxX = Math.max(...xs) + CARD_W + 80;
                const maxY = Math.max(...ys) + CARD_H + 80;
                setViewBox({
                  x: minX,
                  y: minY,
                  w: Math.max(400, maxX - minX),
                  h: Math.max(300, maxY - minY),
                });
              }}
              className="rounded px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
              title="Reset view"
            >
              Reset
            </button>
          </div>

          <div className="absolute bottom-3 right-3 flex gap-2 text-xs text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-500" /> Male
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-pink-500" /> Female
            </span>
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3" viewBox="0 0 12 12">
                <line x1="0" y1="6" x2="12" y2="6" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 2" />
              </svg>
              Spouse
            </span>
            <span className="flex items-center gap-1">
              <svg className="h-3 w-3" viewBox="0 0 12 12">
                <line x1="6" y1="0" x2="6" y2="12" stroke="#94a3b8" strokeWidth="2" />
              </svg>
              Parent/Child
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
