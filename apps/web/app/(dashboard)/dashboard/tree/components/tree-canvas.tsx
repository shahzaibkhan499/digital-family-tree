'use client';

import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import TreeHoverCard from './tree-hover-card';

const MALE_COLOR = '#3b82f6';
const FEMALE_COLOR = '#ec4899';
const OTHER_COLOR = '#8b5cf6';
const DEFAULT_COLOR = '#94a3b8';
const CARD_W = 200;
const CARD_H = 100;
const GAP_SIB = 48;
const GAP_LEV = 120;
const PADDING = 60;

const GENERATION_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444',
  '#06b6d4', '#d946ef', '#f97316', '#14b8a6', '#6366f1',
];

function genderColor(g?: string) {
  const v = (g || '').toLowerCase();
  if (v === 'male') return MALE_COLOR;
  if (v === 'female') return FEMALE_COLOR;
  if (v === 'other') return OTHER_COLOR;
  return DEFAULT_COLOR;
}

function generationColor(depth: number) {
  return GENERATION_COLORS[depth % GENERATION_COLORS.length];
}

function genderIcon(g?: string) {
  const v = (g || '').toLowerCase();
  if (v === 'male') return '\u2642';
  if (v === 'female') return '\u2640';
  return '\u2661';
}

function formatDateShort(d?: string) {
  if (!d) return '';
  try { return new Date(d).getFullYear().toString(); } catch { return ''; }
}

function getDisplayName(n: any) {
  const name = n.name || n.displayName || `${n.firstName || ''} ${n.lastName || ''}`.trim() || 'Unknown';
  return name.length > 20 ? name.slice(0, 19) + '\u2026' : name;
}

function getFullDates(n: any) {
  const b = formatDateShort(n.birthDate || n.dob);
  const d = formatDateShort(n.deathDate || n.dod);
  if (b && d) return `${b} \u2013 ${d}`;
  if (b) return `b. ${b}`;
  if (d) return `d. ${d}`;
  return '';
}

function getAgeYears(dob?: string, dod?: string): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const end = dod ? new Date(dod) : new Date();
  let age = end.getFullYear() - birth.getFullYear();
  const m = end.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) age--;
  return age;
}

function getMarriageStatusColor(status?: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'married' || s === 'active') return '#10b981';
  if (s === 'divorced' || s === 'separated') return '#f59e0b';
  if (s === 'widowed') return '#94a3b8';
  return '#10b981';
}

function getMarriageStatusLabel(status?: string): string {
  const s = (status || '').toLowerCase();
  if (s === 'divorced') return 'Divorced';
  if (s === 'separated') return 'Separated';
  if (s === 'widowed') return 'Widowed';
  return 'Married';
}

// â”€â”€â”€ Hierarchical Layout Algorithm â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface LayoutResult {
  positions: Record<string, { x: number; y: number }>;
  layoutWidth: number;
  layoutHeight: number;
}

interface CoupleData {
  ids: string[];
  childrenIds: Set<string>;
}

export function calculateHierarchicalLayout(
  nodes: any[],
  edges: any[],
  cardWidth: number = CARD_W,
  cardHeight: number = CARD_H,
  gapHorizontal: number = GAP_SIB,
  gapVertical: number = GAP_LEV
): LayoutResult {
  const result: LayoutResult = { positions: {}, layoutWidth: 0, layoutHeight: 0 };
  if (nodes.length === 0) return result;

  // â”€â”€ 1. Build relationship maps â”€â”€
  const nodeMap = new Map<string, any>();
  const spouseOf = new Map<string, Set<string>>();
  const childrenOf = new Map<string, Set<string>>();
  const parentsOf = new Map<string, Set<string>>();

  for (const n of nodes) {
    nodeMap.set(n.id, n);
    spouseOf.set(n.id, new Set());
    childrenOf.set(n.id, new Set());
    parentsOf.set(n.id, new Set());
  }

  for (const e of edges) {
    const t = (e.type || '').toUpperCase();
    const from = e.from || e.fromMemberId || e.source;
    const to = e.to || e.toMemberId || e.target;
    if (!from || !to || !nodeMap.has(from) || !nodeMap.has(to)) continue;

    if (['CHILD', 'SON', 'DAUGHTER', 'GRANDSON', 'GRANDDAUGHTER'].includes(t)) {
      childrenOf.get(from)?.add(to);
      parentsOf.get(to)?.add(from);
    } else if (['PARENT', 'FATHER', 'MOTHER', 'GRANDFATHER', 'GRANDMOTHER'].includes(t)) {
      parentsOf.get(from)?.add(to);
      childrenOf.get(to)?.add(from);
    } else if (['SPOUSE', 'HUSBAND', 'WIFE', 'PARTNER'].includes(t)) {
      spouseOf.get(from)?.add(to);
      spouseOf.get(to)?.add(from);
    } else if (['SIBLING', 'BROTHER', 'SISTER'].includes(t)) {
      spouseOf.get(from)?.add(to);
      spouseOf.get(to)?.add(from);
    } else {
      childrenOf.get(from)?.add(to);
      parentsOf.get(to)?.add(from);
    }
  }

  // â”€â”€ 2. Form couples (connected spouses grouped together) â”€â”€
  const visited = new Set<string>();
  const nodeToCouple = new Map<string, number>();
  const couples: CoupleData[] = [];

  for (const n of nodes) {
    if (visited.has(n.id)) continue;
    const memberIds: string[] = [];
    const queue = [n.id];
    visited.add(n.id);
    while (queue.length > 0) {
      const id = queue.shift()!;
      memberIds.push(id);
      for (const spouseId of spouseOf.get(id) || []) {
        if (!visited.has(spouseId)) {
          visited.add(spouseId);
          queue.push(spouseId);
        }
      }
    }
    if (memberIds.length === 0) continue;
    const childrenIds = new Set<string>();
    for (const mid of memberIds) {
      for (const cid of childrenOf.get(mid) || []) {
        childrenIds.add(cid);
      }
    }
    const idx = couples.length;
    for (const mid of memberIds) nodeToCouple.set(mid, idx);
    couples.push({ ids: memberIds, childrenIds });
  }

  // Handle any orphan nodes (no relationships at all)
  for (const n of nodes) {
    if (!nodeToCouple.has(n.id)) {
      const idx = couples.length;
      nodeToCouple.set(n.id, idx);
      couples.push({ ids: [n.id], childrenIds: new Set(childrenOf.get(n.id) || []) });
    }
  }

  // â”€â”€ 3. Build couple-level parent-child graph â”€â”€
  const coupleChildren = new Map<number, Set<number>>();
  const coupleParents = new Map<number, Set<number>>();
  for (let i = 0; i < couples.length; i++) {
    coupleChildren.set(i, new Set());
    coupleParents.set(i, new Set());
  }
  for (let i = 0; i < couples.length; i++) {
    for (const childId of couples[i].childrenIds) {
      const childCouple = nodeToCouple.get(childId);
      if (childCouple !== undefined && childCouple !== i) {
        coupleChildren.get(i)?.add(childCouple);
        coupleParents.get(childCouple)?.add(i);
      }
    }
  }

  // â”€â”€ 4. Find root couples (no parents) and assign generations via BFS â”€â”€
  const rootCouples: number[] = [];
  for (let i = 0; i < couples.length; i++) {
    if ((coupleParents.get(i)?.size ?? 0) === 0) rootCouples.push(i);
  }

  const coupleGen = new Map<number, number>();
  const bfsQ: number[] = [];
  for (const r of rootCouples) {
    coupleGen.set(r, 0);
    bfsQ.push(r);
  }
  let bfsHead = 0;
  while (bfsHead < bfsQ.length) {
    const cur = bfsQ[bfsHead++];
    const g = coupleGen.get(cur) ?? 0;
    for (const child of coupleChildren.get(cur) ?? []) {
      const existing = coupleGen.get(child);
      const newGen = g + 1;
      if (existing === undefined || existing < newGen) {
        coupleGen.set(child, newGen);
        bfsQ.push(child);
      }
    }
  }
  for (let i = 0; i < couples.length; i++) {
    if (!coupleGen.has(i)) coupleGen.set(i, 0);
  }

  // Group couples by generation
  const gens = new Map<number, number[]>();
  for (const [ci, g] of coupleGen) {
    if (!gens.has(g)) gens.set(g, []);
    gens.get(g)?.push(ci);
  }
  const sortedGens = [...gens.keys()].sort((a, b) => a - b);

  // Assign depth to each node
  for (const n of nodes) {
    const ci = nodeToCouple.get(n.id);
    if (ci !== undefined) n.depth = coupleGen.get(ci) ?? 0;
  }

  // â”€â”€ 5. Bottom-up subtree width calculation â”€â”€
  const subtreeW = new Map<number, number>();
  const subChildrenW = new Map<number, number>();

  const computeVisited = new Set<number>();
  function computeWidth(ci: number): number {
    if (subtreeW.has(ci)) return subtreeW.get(ci)!;
    if (computeVisited.has(ci)) return 0;
    computeVisited.add(ci);
    const c = couples[ci];
    const numSpouses = c.ids.length;
    const cplW = numSpouses * cardWidth + Math.max(0, numSpouses - 1) * gapHorizontal;
    const childArr = [...(coupleChildren.get(ci) ?? [])];

    if (childArr.length === 0) {
      subtreeW.set(ci, cplW);
      subChildrenW.set(ci, 0);
      return cplW;
    }

    let totalChildW = 0;
    for (const ch of childArr) {
      totalChildW += computeWidth(ch);
    }
    totalChildW += (childArr.length - 1) * gapHorizontal;
    subChildrenW.set(ci, totalChildW);
    const result = Math.max(cplW, totalChildW);
    subtreeW.set(ci, result);
    return result;
  }

  for (let i = 0; i < couples.length; i++) computeWidth(i);

  // â”€â”€ 6. Top-down position assignment â”€â”€
  const positions: Record<string, { x: number; y: number }> = {};

  function positionCouple(ci: number, leftX: number, genY: number) {
    const c = couples[ci];
    const totalW = subtreeW.get(ci) ?? cardWidth;
    const cplW = c.ids.length * cardWidth + Math.max(0, c.ids.length - 1) * gapHorizontal;
    const childrenTotalW = subChildrenW.get(ci) ?? 0;

    // Center the couple within its allocated subtree width
    const coupleCenterInSubtree = totalW / 2;
    const coupleStartX = leftX + coupleCenterInSubtree - cplW / 2;

    for (let i = 0; i < c.ids.length; i++) {
      positions[c.ids[i]] = {
        x: coupleStartX + i * (cardWidth + gapHorizontal),
        y: genY,
      };
    }

    // Position children centered under the couple
    const childArr = [...(coupleChildren.get(ci) ?? [])];
    if (childArr.length > 0) {
      const childY = genY + cardHeight + gapVertical;
      // If children's total width is less than the couple's allocated width,
      // center the children within the allocated space
      let childLeftX = leftX;
      if (childrenTotalW < totalW) {
        childLeftX = leftX + (totalW - childrenTotalW) / 2;
      }

      for (const ch of childArr) {
        const chW = subtreeW.get(ch) ?? cardWidth;
        positionCouple(ch, childLeftX, childY);
        childLeftX += chW + gapHorizontal;
      }
    }
  }

  // Arrange root couples left-to-right with their full subtree widths
  let currentLeft = PADDING;
  for (const r of rootCouples) {
    const rW = subtreeW.get(r) ?? cardWidth;
    positionCouple(r, currentLeft, PADDING);
    currentLeft += rW + gapHorizontal * 2;
  }

  // Handle any unrooted couples (orphans not reachable from roots)
  const placedSet = new Set<number>();
  for (let i = 0; i < couples.length; i++) {
    if (positions[couples[i].ids[0]]) placedSet.add(i);
  }
  for (let i = 0; i < couples.length; i++) {
    if (!placedSet.has(i)) {
      const gen = coupleGen.get(i) ?? 0;
      const genY = PADDING + gen * (cardHeight + gapVertical);
      positionCouple(i, currentLeft, genY);
      currentLeft += (subtreeW.get(i) ?? cardWidth) + gapHorizontal * 2;
    }
  }

  // Compute final layout dimensions
  const allPos = Object.values(positions);
  const minX = allPos.length > 0 ? Math.min(...allPos.map(p => p.x)) : 0;
  const maxX = allPos.length > 0 ? Math.max(...allPos.map(p => p.x + cardWidth)) : PADDING;
  const maxGen = sortedGens.length > 0 ? sortedGens[sortedGens.length - 1] : 0;
  const layoutHeight = PADDING * 2 + (maxGen + 1) * (cardHeight + gapVertical) - gapVertical;

  // Shift all positions so the minimum x starts at PADDING
  if (minX < PADDING) {
    const shift = PADDING - minX;
    for (const key of Object.keys(positions)) {
      positions[key].x += shift;
    }
  }

  return {
    positions,
    layoutWidth: Math.max(maxX - minX + PADDING, 400),
    layoutHeight: Math.max(layoutHeight, 300),
  };
}

// Backward-compatible alias for old import { calcPositions }
export function calcPositions(_layout: string, nodes: any[], edges: any[]): Record<string, { x: number; y: number }> {
  return calculateHierarchicalLayout(nodes, edges, CARD_W, CARD_H, GAP_SIB, GAP_LEV).positions;
}

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface TreeCanvasProps {
  nodes: any[];
  edges: any[];
  layout: string;
  viewBox: { x: number; y: number; w: number; h: number };
  selectedNodeId?: string;
  searchHighlightIds?: string[];
  highlightPathIds?: string[];
  collapsedNodeIds?: Set<string>;
  colorMode?: 'gender' | 'generation' | 'entity';
  showGenerationLabels?: boolean;
  showMarriageNodes?: boolean;
  currentUserId?: string;
  onNodeClick: (node: any) => void;
  onNodeExpand?: (node: any) => void;
  onNodeHover?: (node: any | null, x?: number, y?: number) => void;
  onViewBoxChange?: (vb: { x: number; y: number; w: number; h: number }) => void;
}

// â”€â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function TreeCanvas({
  nodes,
  edges,
  layout: _layout,
  viewBox,
  selectedNodeId,
  searchHighlightIds = [],
  highlightPathIds = [],
  collapsedNodeIds = new Set(),
  colorMode = 'gender',
  showGenerationLabels = true,
  showMarriageNodes = false,
  currentUserId,
  onNodeClick,
  onNodeExpand,
  onNodeHover,
  onViewBoxChange,
}: TreeCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, vbX: 0, vbY: 0 });
  const [localViewBox, setLocalViewBox] = useState(viewBox);
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  const cw = CARD_W;
  const ch = CARD_H;

  const { positions } = useMemo(
    () => calculateHierarchicalLayout(nodes, edges, cw, ch, GAP_SIB, GAP_LEV),
    [nodes, edges]
  );

  // Rebuild couples from edge data for connector rendering
  const couples = useMemo(() => {
    const spouseMap = new Map<string, Set<string>>();
    const childMap = new Map<string, Set<string>>();
    const parentMap = new Map<string, Set<string>>();

    for (const n of nodes) {
      spouseMap.set(n.id, new Set());
      childMap.set(n.id, new Set());
      parentMap.set(n.id, new Set());
    }

    for (const e of edges) {
      const t = (e.type || '').toUpperCase();
      const from = e.from || e.fromMemberId || e.source;
      const to = e.to || e.toMemberId || e.target;
      if (!from || !to || !spouseMap.has(from) || !spouseMap.has(to)) continue;
      if (['SPOUSE', 'HUSBAND', 'WIFE', 'PARTNER'].includes(t)) {
        spouseMap.get(from)?.add(to);
        spouseMap.get(to)?.add(from);
      } else if (['SIBLING', 'BROTHER', 'SISTER'].includes(t)) {
        spouseMap.get(from)?.add(to);
        spouseMap.get(to)?.add(from);
      } else if (['CHILD', 'SON', 'DAUGHTER'].includes(t)) {
        childMap.get(from)?.add(to);
        parentMap.get(to)?.add(from);
      } else if (['PARENT', 'FATHER', 'MOTHER'].includes(t)) {
        parentMap.get(from)?.add(to);
        childMap.get(to)?.add(from);
      } else {
        childMap.get(from)?.add(to);
        parentMap.get(to)?.add(from);
      }
    }

    const visited = new Set<string>();
    const coupleList: { ids: string[]; children: Set<string> }[] = [];

    for (const n of nodes) {
      if (visited.has(n.id)) continue;
      const members: string[] = [];
      const q = [n.id];
      visited.add(n.id);
      while (q.length > 0) {
        const id = q.shift()!;
        members.push(id);
        for (const s of spouseMap.get(id) ?? []) {
          if (!visited.has(s)) {
            visited.add(s);
            q.push(s);
          }
        }
      }
      const children = new Set<string>();
      for (const m of members) {
        for (const c of childMap.get(m) ?? []) children.add(c);
      }
      coupleList.push({ ids: members, children });
    }

    // Also create single-node couples for any remaining nodes
    for (const n of nodes) {
      if (!coupleList.some(c => c.ids.includes(n.id))) {
        coupleList.push({ ids: [n.id], children: new Set(childMap.get(n.id) ?? []) });
      }
    }

    return coupleList;
  }, [nodes, edges]);

  useEffect(() => {
    if (Object.keys(positions).length === 0) return;
    const xs = Object.values(positions).map((p) => p.x);
    const ys = Object.values(positions).map((p) => p.y);
    const minX = Math.min(...xs) - PADDING;
    const minY = Math.min(...ys) - PADDING;
    const maxX = Math.max(...xs) + cw + PADDING;
    const maxY = Math.max(...ys) + ch + PADDING;

    const newVb = {
      x: minX,
      y: minY,
      w: Math.max(400, maxX - minX),
      h: Math.max(300, maxY - minY),
    };
    setLocalViewBox(newVb);
    onViewBoxChange?.(newVb);
  }, [positions, cw, ch, onViewBoxChange]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      setDragging(true);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        vbX: localViewBox.x,
        vbY: localViewBox.y,
      };
      e.preventDefault();
    },
    [localViewBox]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const scaleX = localViewBox.w / rect.width;
      const scaleY = localViewBox.h / rect.height;
      const dx = (e.clientX - dragRef.current.startX) * scaleX;
      const dy = (e.clientY - dragRef.current.startY) * scaleY;
      setLocalViewBox((prev) => ({
        ...prev,
        x: dragRef.current.vbX - dx,
        y: dragRef.current.vbY - dy,
      }));
    },
    [dragging, localViewBox]
  );

  const handleMouseUp = useCallback(() => setDragging(false), []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.08 : 0.92;
    setLocalViewBox((prev) => {
      const newW = prev.w * factor;
      const newH = prev.h * factor;
      return {
        x: prev.x - (newW - prev.w) / 2,
        y: prev.y - (newH - prev.h) / 2,
        w: newW,
        h: newH,
      };
    });
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        setDragging(true);
        dragRef.current = {
          startX: touch.clientX,
          startY: touch.clientY,
          vbX: localViewBox.x,
          vbY: localViewBox.y,
        };
      }
    },
    [localViewBox]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1 || !dragging) return;
      const touch = e.touches[0];
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const scaleX = localViewBox.w / rect.width;
      const scaleY = localViewBox.h / rect.height;
      const dx = (touch.clientX - dragRef.current.startX) * scaleX;
      const dy = (touch.clientY - dragRef.current.startY) * scaleY;
      setLocalViewBox((prev) => ({
        ...prev,
        x: dragRef.current.vbX - dx,
        y: dragRef.current.vbY - dy,
      }));
    },
    [dragging, localViewBox]
  );

  const handleTouchEnd = useCallback(() => setDragging(false), []);

  useEffect(() => {
    const handler = (e: WheelEvent) => e.preventDefault();
    const el = containerRef.current;
    if (el) el.addEventListener('wheel', handler, { passive: false });
    return () => {
      if (el) el.removeEventListener('wheel', handler);
    };
  }, []);

  const highlightSet = useMemo(() => new Set(searchHighlightIds), [searchHighlightIds]);
  const pathSet = useMemo(() => new Set(highlightPathIds), [highlightPathIds]);

  const handleNodeMouseEnter = useCallback(
    (node: any, x: number, y: number) => {
      setHoveredNode(node);
      setHoverPos({ x, y });
      onNodeHover?.(node, x, y);
    },
    [onNodeHover]
  );

  const handleNodeMouseLeave = useCallback(() => {
    setHoveredNode(null);
    onNodeHover?.(null);
  }, [onNodeHover]);

  // â”€â”€ Spouse connector rendering â”€â”€
  const spouseConnectors = useMemo(() => {
    const lines: React.ReactNode[] = [];
    for (const couple of couples) {
      if (couple.ids.length < 2) continue;
      // Sort spouses left-to-right by their x position
      const sorted = [...couple.ids].sort((a, b) => {
        const pa = positions[a];
        const pb = positions[b];
        if (!pa || !pb) return 0;
        return pa.x - pb.x;
      });
      for (let i = 0; i < sorted.length - 1; i++) {
        const leftId = sorted[i];
        const rightId = sorted[i + 1];
        const left = positions[leftId];
        const right = positions[rightId];
        if (!left || !right) continue;
        const x1 = left.x + cw;
        const y1 = left.y + ch / 2;
        const x2 = right.x;
        const y2 = right.y + ch / 2;
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        lines.push(
          <g key={`spouse-${leftId}-${rightId}`}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f59e0b" strokeWidth={2} strokeDasharray="6 4" />
            <circle cx={mx} cy={my} r={5} fill="#f59e0b" stroke="white" strokeWidth={2} />
            <text x={mx} y={my + 1.5} textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">
              {'\u2661'}
            </text>
          </g>
        );
      }
    }
    return lines;
  }, [couples, positions, cw, ch]);

  // â”€â”€ Parent-child connector rendering (clean â”´ shape) â”€â”€
  const parentChildConnectors = useMemo(() => {
    const elements: React.ReactNode[] = [];
    let key = 0;

    for (const couple of couples) {
      const childArr = [...couple.children].filter((cid) => positions[cid]);
      if (childArr.length === 0) continue;

      // Compute couple center X (midpoint between leftmost and rightmost spouse)
      const spousePositions = couple.ids
        .map((id) => positions[id])
        .filter(Boolean)
        .sort((a, b) => a.x - b.x);
      if (spousePositions.length === 0) continue;

      const leftEdge = spousePositions[0].x;
      const rightEdge = spousePositions[spousePositions.length - 1].x + cw;
      const coupleCenterX = (leftEdge + rightEdge) / 2;

      const parentBottom = spousePositions[0].y + ch;

      // Find the children's top Y
      const childYs = childArr.map((cid) => positions[cid].y);
      const childTop = Math.min(...childYs);

      // Junction Y: halfway between parent bottom and child top
      const junctionY = parentBottom + (childTop - parentBottom) * 0.5;

      // Sort children left-to-right
      const sortedChildren = childArr.sort((a, b) => {
        const pa = positions[a];
        const pb = positions[b];
        return (pa?.x ?? 0) - (pb?.x ?? 0);
      });

      // Vertical drop from couple center to junction
      const isPathLine = pathSet.has(couple.ids[0]) && sortedChildren.some((c) => pathSet.has(c));
      const strokeColor = isPathLine ? '#10b981' : '#94a3b8';
      const strokeW = isPathLine ? 3 : 1.5;

      elements.push(
        <line
          key={`pc-v-${key++}`}
          x1={coupleCenterX}
          y1={parentBottom}
          x2={coupleCenterX}
          y2={junctionY}
          stroke={strokeColor}
          strokeWidth={strokeW}
          filter={isPathLine ? 'url(#glow-path)' : undefined}
          className={isPathLine ? 'animated-path pulse-glow' : ''}
          strokeDasharray={isPathLine ? '8 4' : undefined}
        />
      );

      for (const childId of sortedChildren) {
        const childPos = positions[childId];
        if (!childPos) continue;
        const childCenterX = childPos.x + cw / 2;
        const isPathEdge = pathSet.has(couple.ids[0]) && pathSet.has(childId);
        const edgeColor = isPathEdge ? '#10b981' : '#94a3b8';
        const edgeW = isPathEdge ? 3 : 1.5;

        elements.push(
          <line
            key={`pc-h-${key++}`}
            x1={coupleCenterX}
            y1={junctionY}
            x2={childCenterX}
            y2={junctionY}
            stroke={edgeColor}
            strokeWidth={edgeW}
            filter={isPathEdge ? 'url(#glow-path)' : undefined}
            className={isPathEdge ? 'animated-path pulse-glow' : ''}
            strokeDasharray={isPathEdge ? '8 4' : undefined}
          />
        );

        elements.push(
          <line
            key={`pc-vc-${key++}`}
            x1={childCenterX}
            y1={junctionY}
            x2={childCenterX}
            y2={childPos.y}
            stroke={edgeColor}
            strokeWidth={edgeW}
            filter={isPathEdge ? 'url(#glow-path)' : undefined}
            className={isPathEdge ? 'animated-path pulse-glow' : ''}
            strokeDasharray={isPathEdge ? '8 4' : undefined}
          />
        );
      }
    }

    return elements;
  }, [couples, positions, pathSet, cw, ch]);

  // â”€â”€ Generation labels (Task A) â”€â”€
  const generationLabels = useMemo(() => {
    const labels: React.ReactNode[] = [];
    const genRanges = new Map<number, { minY: number; maxY: number }>();
    for (const node of nodes) {
      const p = positions[node.id];
      if (!p) continue;
      const gen = node.depth ?? 0;
      const existing = genRanges.get(gen);
      if (existing) {
        existing.minY = Math.min(existing.minY, p.y);
        existing.maxY = Math.max(existing.maxY, p.y + ch);
      } else {
        genRanges.set(gen, { minY: p.y, maxY: p.y + ch });
      }
    }

    const sortedGens = [...genRanges.entries()].sort((a, b) => a[0] - b[0]);
    for (const [gen, range] of sortedGens) {
      const labelY = (range.minY + range.maxY) / 2;
      labels.push(
        <g key={`gen-${gen}`}>
          <line x1={localViewBox.x + 10} y1={range.minY} x2={localViewBox.x + 10} y2={range.maxY}
            stroke="#e2e8f0" strokeWidth={1} />
          <text x={localViewBox.x + 16} y={labelY + 4} fontSize={11} fontWeight="600"
            className="fill-slate-400 dark:fill-slate-500" dominantBaseline="middle">
            {gen === 0 ? 'Oldest' : gen === 1 ? 'Gen 1' : `Gen ${gen}`}
          </text>
        </g>
      );
    }
    return labels;
  }, [nodes, positions, localViewBox, ch]);

  // â”€â”€ Marriage node rendering (Task B) â”€â”€
  const marriageNodes = useMemo(() => {
    if (!showMarriageNodes) return null;
    const marriageNodeIds = new Set(
      nodes.filter(n => n.entityType === 'MARRIAGE' || n.type === 'marriage' || n.marriageStatus).map(n => n.id)
    );
    if (marriageNodeIds.size === 0) return null;

    const elements: React.ReactNode[] = [];

    for (const node of nodes) {
      if (!marriageNodeIds.has(node.id)) continue;
      const p = positions[node.id];
      if (!p) continue;

      const mw = 60;
      const mh = 40;
      const statusColor = getMarriageStatusColor(node.marriageStatus);
      const dateStr = node.marriageDate ? formatDateShort(node.marriageDate) : '';

      elements.push(
        <g key={`marriage-${node.id}`} className="tree-node-group" style={{ cursor: 'pointer' }}
          onClick={(e) => { e.stopPropagation(); onNodeClick(node); }}>
          <rect x={p.x + cw / 2 - mw / 2} y={p.y + ch / 2 - mh / 2} width={mw} height={mh} rx={8} ry={8}
            fill="white" className="dark:fill-slate-800" stroke={statusColor} strokeWidth={1.5} filter="url(#node-shadow)" />
          <text x={p.x + cw / 2} y={p.y + ch / 2 - 3} textAnchor="middle" fontSize={14} fill={statusColor}>
            {'\u26AD'}
          </text>
          {dateStr && (
            <text x={p.x + cw / 2} y={p.y + ch / 2 + 12} textAnchor="middle" fontSize={9}
              className="fill-slate-500 dark:fill-slate-400">
              {dateStr}
            </text>
          )}
        </g>
      );
    }

    return elements;
  }, [nodes, positions, showMarriageNodes, cw, ch, onNodeClick]);

  // â”€â”€ Multi-spouse hub connectors (Task C) â”€â”€
  const multiSpouseConnectors = useMemo(() => {
    const elements: React.ReactNode[] = [];
    for (const couple of couples) {
      if (couple.ids.length < 3) continue;
      const sorted = [...couple.ids].sort((a, b) => {
        const pa = positions[a];
        const pb = positions[b];
        if (!pa || !pb) return 0;
        return pa.x - pb.x;
      });
      const first = positions[sorted[0]];
      const last = positions[sorted[sorted.length - 1]];
      if (!first || !last) continue;
      const hubX = (first.x + last.x + cw) / 2;
      const hubY = first.y + ch / 2;

      for (const id of sorted) {
        const p = positions[id];
        if (!p) continue;
        const x1 = p.x + cw / 2;
        const y1 = p.y + ch / 2;
        if (Math.abs(x1 - hubX) < 2 && Math.abs(y1 - hubY) < 2) continue;
        elements.push(
          <line key={`multi-spouse-${id}`} x1={x1} y1={y1} x2={hubX} y2={hubY}
            stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3" />
        );
      }
      elements.push(
        <circle key={`multi-spouse-hub`} cx={hubX} cy={hubY} r={4}
          fill="#f59e0b" stroke="white" strokeWidth={1.5} />
      );
    }
    return elements;
  }, [couples, positions, cw, ch]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden tree-canvas-container"
      style={{ cursor: dragging ? 'grabbing' : 'grab' }}
    >
      <svg
        ref={svgRef}
        viewBox={`${localViewBox.x} ${localViewBox.y} ${localViewBox.w} ${localViewBox.h}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <defs>
          <filter id="node-shadow" x="-12%" y="-12%" width="124%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodOpacity="0.10" />
          </filter>
          <filter id="node-shadow-selected" x="-12%" y="-12%" width="124%" height="150%">
            <feDropShadow dx="0" dy="2" stdDeviation="6" floodOpacity="0.25" />
          </filter>
          <filter id="glow-path" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#10b981" floodOpacity="0.6" />
          </filter>
          <style>{`
            @keyframes dashFlow { to { stroke-dashoffset: -16; } }
            .animated-path { animation: dashFlow 1s linear infinite; }
            @keyframes pulseGlow { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
            .pulse-glow { animation: pulseGlow 2s ease-in-out infinite; }
            .tree-node-group { transition: transform 0.4s ease; }
            .tree-connector { transition: all 0.3s ease; }
            @keyframes treeFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; } }
            .tree-animate-enter { animation: treeFadeIn 0.3s ease; }
          `}</style>
        </defs>

        {/* Spouse connectors */}
        {spouseConnectors}

        {/* Multi-spouse hub connectors (Task C) */}
        {multiSpouseConnectors}

        {/* Parent-child connectors */}
        {parentChildConnectors}

        {/* Generation labels (Task A) */}
        {showGenerationLabels && generationLabels}

        {/* Render individual edges for backward compatibility (highlighted path edges) */}
        {edges.map((edge: any, idx: number) => {
          const fromId = edge.from || edge.fromMemberId || edge.source;
          const toId = edge.to || edge.toMemberId || edge.target;
          if (!fromId || !toId) return null;
          const from = positions[fromId];
          const to = positions[toId];
          if (!from || !to) return null;

          const type = (edge.type || '').toUpperCase();
          const isSpouse = ['SPOUSE', 'HUSBAND', 'WIFE', 'PARTNER'].includes(type);
          // For spouse/parent-child edges, the connectors are rendered above
          // Only render edges that are part of the highlighted path
          const isPathEdge = pathSet.has(fromId) && pathSet.has(toId);
          if (!isPathEdge) return null;

          if (isSpouse) {
            const x1 = from.x + cw / 2;
            const y1 = from.y + ch / 2;
            const x2 = to.x + cw / 2;
            const y2 = to.y + ch / 2;
            return (
              <g key={`e-${idx}`}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#10b981" strokeWidth={3}
                  strokeDasharray="8 4" filter="url(#glow-path)"
                  className="animated-path pulse-glow" />
              </g>
            );
          }

          return null;
        })}

        {/* Marriage nodes (Task B) */}
        {marriageNodes}

        {/* Node cards */}
        {nodes.map((node: any) => {
          const p = positions[node.id];
          if (!p) return null;
          const isSelected = selectedNodeId === node.id;
          const isHighlighted = highlightSet.has(node.id);
          const isOnPath = pathSet.has(node.id);
          const isCollapsed = collapsedNodeIds.has(node.id);
          const name = getDisplayName(node);
          const dates = getFullDates(node);
          const isDeceased = !!(node.deathDate || node.dod);
          const age = getAgeYears(node.birthDate || node.dob, node.deathDate || node.dod);
          const isCurrentUser = currentUserId ? (node.userId === currentUserId || node.id === currentUserId) : false;

          const country = node.country || node.countryCode || node.nationality;
          const clanName = node.clanName || node.familyName || node.clan;
          const relationshipLabel = node.relationshipLabel || node.relationLabel;
          const marriageCount = node.marriageCount ?? (node.spouseIds ? node.spouseIds.length : 0);
          const hasMultipleMarriages = marriageCount > 1;
          const cardWidth = name.length > 20 ? Math.max(cw, 160 + name.length * 4) : cw;

          let cardColor: string;
          if (colorMode === 'generation') {
            cardColor = generationColor(node.depth || 0);
          } else if (colorMode === 'entity') {
            const entityType = (node.entityType || '').toLowerCase();
            if (entityType === 'clan') cardColor = '#f59e0b';
            else if (entityType === 'subclan') cardColor = '#8b5cf6';
            else if (entityType === 'family') cardColor = '#06b6d4';
            else cardColor = genderColor(node.gender);
          } else {
            cardColor = genderColor(node.gender);
          }

          const initial = (node.name || node.firstName || '?').charAt(0).toUpperCase();

          return (
            <g
              key={node.id}
              className="tree-node-group"
              filter={isSelected ? 'url(#node-shadow-selected)' : isCurrentUser ? 'url(#node-shadow-selected)' : isOnPath ? 'url(#glow-path)' : 'url(#node-shadow)'}
               style={{ cursor: 'pointer', transform: `translate(${p.x}, ${p.y})` }}
              onClick={(e) => {
                e.stopPropagation();
                onNodeClick(node);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onNodeExpand?.(node);
              }}
              onMouseEnter={(e) => {
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) {
                  const svgRect = svgRef.current?.getBoundingClientRect();
                  if (svgRect) {
                    const sx = localViewBox.w / svgRect.width;
                    const sy = localViewBox.h / svgRect.height;
                    handleNodeMouseEnter(
                      node,
                      (e.clientX - svgRect.left) * sx + localViewBox.x,
                      (e.clientY - svgRect.top) * sy + localViewBox.y
                    );
                  }
                }
              }}
              onMouseLeave={handleNodeMouseLeave}
            >
              {/* Search highlight border */}
              {isHighlighted && (
                <rect x={-4} y={-4} width={cardWidth + 8} height={ch + 8} rx={14} ry={14}
                  fill="none" stroke="#10b981" strokeWidth={3} strokeDasharray="4 2" opacity={0.8} />
              )}

              {/* Path highlight background */}
              {isOnPath && !isSelected && (
                <rect x={-4} y={-4} width={cardWidth + 8} height={ch + 8} rx={14} ry={14}
                  fill="#10b981" opacity={0.08} stroke="#10b981" strokeWidth={2.5} />
              )}

              {/* Selected node highlight */}
              {isSelected && (
                <rect x={-3} y={-3} width={cardWidth + 6} height={ch + 6} rx={13} ry={13}
                  fill="none" stroke="#10b981" strokeWidth={2.5} opacity={1} />
              )}

              {/* ME badge for current user */}
              {isCurrentUser && (
                <g transform={`translate(${cardWidth - 20}, ${-5})`}>
                  <rect x={0} y={0} width={26} height={14} rx={4} fill="#3b82f6" />
                  <text x={13} y={11} textAnchor="middle" fontSize={8} fill="white" fontWeight="bold">ME</text>
                </g>
              )}

              {/* Relationship label badge */}
              {relationshipLabel && (
                <g transform={`translate(0, ${-18})`}>
                  <rect x={0} y={0} width={Math.min(cardWidth, relationshipLabel.length * 8 + 16)} height={16} rx={4}
                    fill={cardColor} opacity={0.85} />
                  <text x={Math.min(cardWidth, relationshipLabel.length * 8 + 16) / 2} y={12} textAnchor="middle" fontSize={9}
                    fill="white" fontWeight="600">
                    {relationshipLabel}
                  </text>
                </g>
              )}

              {/* Card background */}
              <rect x={0} y={0} width={cardWidth} height={ch} rx={12} ry={12}
                fill="white" className="dark:fill-slate-800" stroke={isCurrentUser ? '#3b82f6' : cardColor}
                strokeWidth={isSelected ? 2.5 : isCurrentUser ? 2.5 : isOnPath ? 2.5 : 2} />

              {/* Card header color strip */}
              <rect x={0} y={0} width={cardWidth} height={38} rx={12} ry={12}
                fill={cardColor} opacity={0.12} />

              {/* Avatar */}
              {node.avatar || node.profilePhoto ? (
                <image
                  href={node.avatar || node.profilePhoto}
                  x={10} y={7} width={26} height={26}
                  rx={13} ry={13}
                />
              ) : (
                <circle cx={23} cy={20} r={13} fill={cardColor} opacity={0.8} />
              )}
              {!node.avatar && !node.profilePhoto && (
                <text x={23} y={24} textAnchor="middle" fontSize="12"
                  fill="white" fontWeight="bold">
                  {initial}
                </text>
              )}

              {/* Name */}
              <text x={42} y={16} fontSize="12" fontWeight="700"
                className="fill-slate-900 dark:fill-white">
                {name}
              </text>

              {/* Gender icon */}
              <text x={42} y={30} fontSize="10"
                className="fill-slate-400 dark:fill-slate-500">
                {genderIcon(node.gender)} {node.gender || 'Unknown'}
              </text>

              {/* Country + Clan badge row */}
              <text x={14} y={54} fontSize="10"
                className="fill-slate-500 dark:fill-slate-400">
                {dates || '\u00a0'}
              </text>

              {/* Age */}
              {age !== null && (
                <text x={14} y={68} fontSize="10"
                  className="fill-slate-400 dark:fill-slate-500">
                  {isDeceased ? `Died age ${age}` : `Age ${age}`}
                </text>
              )}

              {/* Living / Deceased badge */}
              <rect x={cardWidth - 58} y={54} width={48} height={17} rx={8}
                fill={isDeceased ? '#94a3b8' : '#10b981'} opacity={0.12} />
              <text
                x={cardWidth - 34}
                y={65}
                textAnchor="middle"
                fontSize="9"
                fontWeight="600"
                className={isDeceased ? 'fill-slate-500 dark:fill-slate-400' : 'fill-emerald-600 dark:fill-emerald-400'}
              >
                {isDeceased ? 'Deceased' : 'Living'}
              </text>

              {/* Occupation */}
              {node.occupation && (
                <text x={14} y={82} fontSize="9"
                  className="fill-slate-400 dark:fill-slate-500">
                  {node.occupation.length > 24 ? node.occupation.slice(0, 23) + '\u2026' : node.occupation}
                </text>
              )}

              {/* Clan badge */}
              {clanName && (
                <g transform={`translate(12, ${84})`}>
                  <rect x={0} y={0} width={Math.min(clanName.length * 7 + 10, cardWidth - 40)} height={14} rx={3}
                    fill={cardColor} opacity={0.2} />
                  <text x={(Math.min(clanName.length * 7 + 10, cardWidth - 40)) / 2} y={11} textAnchor="middle" fontSize={8}
                    className="fill-slate-600 dark:fill-slate-300" fontWeight="500">
                    {clanName.length > 12 ? clanName.slice(0, 11) + '\u2026' : clanName}
                  </text>
                </g>
              )}

              {/* Verified badge */}
              {node.isVerified && (
                <g transform={`translate(${cardWidth - 20}, ${4})`}>
                  <rect x={0} y={0} width={16} height={14} rx={3} fill="#10b981" />
                  <text x={8} y={11} textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">
                    {'\u2713'}
                  </text>
                </g>
              )}

              {/* Multiple marriages badge */}
              {hasMultipleMarriages && (
                <g transform={`translate(${cardWidth - 22}, ${75})`}>
                  <rect x={0} y={0} width={18} height={14} rx={3} fill="#f59e0b" opacity={0.8} />
                  <text x={9} y={11} textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">
                    {marriageCount}
                  </text>
                </g>
              )}

              {/* Collapsed badge */}
              {isCollapsed && (
                <g transform={`translate(${cardWidth - 22}, ${80})`}>
                  <circle cx={7} cy={7} r={7} fill="#f59e0b" />
                  <text x={7} y={11} textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">+</text>
                </g>
              )}
            </g>
          );
        })}

        {/* Empty state */}
        {nodes.length === 0 && (
          <text
            x={localViewBox.x + localViewBox.w / 2}
            y={localViewBox.y + localViewBox.h / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="16"
            className="fill-slate-400 dark:fill-slate-500"
          >
            No tree data to display
          </text>
        )}
      </svg>

      {hoveredNode && (
        <TreeHoverCard node={hoveredNode} x={hoverPos.x} y={hoverPos.y} />
      )}
    </div>
  );
}