'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Person {
  id: string;
  name: string;
  avatar?: string;
  gender?: string;
}

interface PathNode {
  id: string;
  name: string;
  gender?: string;
}

interface PathEdge {
  fromId: string;
  toId: string;
  type: string;
  label: string;
}

interface PathData {
  nodes: PathNode[];
  edges: PathEdge[];
  length: number;
}

interface NearestCommonAncestor {
  id: string;
  name: string;
  distanceFromA: number;
  distanceFromB: number;
}

interface RelationshipResult {
  found: boolean;
  relationshipType?: string;
  relationshipLabel?: string;
  relationshipCategory?: string;
  degree?: number;
  removal?: number;
  generationDifference?: number;
  nearestCommonAncestor?: NearestCommonAncestor;
  path?: PathData;
  side?: string;
  confidence?: number;
}

interface LineageData {
  side: string;
  maternalAncestors: number;
  paternalAncestors: number;
}

interface GenerationsData {
  personAGeneration: number;
  personBGeneration: number;
  commonAncestorGeneration: number;
  totalGenerationsFromA: number;
  totalGenerationsFromB: number;
}

interface ExtendedRelationshipResult extends RelationshipResult {
  lineage?: LineageData;
  generations?: GenerationsData;
}

interface RelationshipViewerProps {
  personA: Person | null;
  personB: Person | null;
  result: ExtendedRelationshipResult | null;
  loading?: boolean;
  error?: string;
  onLocatePerson?: (personId: string) => void;
  onClear?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Blood: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
  Marriage: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:border-pink-800',
  Adoption: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  Step: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:border-teal-800',
  Foster: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
  Legal: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
};

const SIDE_COLORS: Record<string, string> = {
  Paternal: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  Maternal: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-800',
  Both: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
  Unknown: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
};

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).filter(Boolean).join('').toUpperCase().slice(0, 2) || '?';
}

function PersonAvatar({ person, size = 'md' }: { person: Person; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'lg' ? 'h-14 w-14 text-lg' : size === 'md' ? 'h-10 w-10 text-sm' : 'h-7 w-7 text-[10px]';
  if (person.avatar) {
    return (
      <img src={person.avatar} alt={person.name} className={`${dims} rounded-full object-cover ring-2 ring-white dark:ring-slate-900`} />
    );
  }
  const genderColor = person.gender === 'male'
    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    : person.gender === 'female'
      ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
      : 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400';
  return (
    <div className={`${dims} rounded-full ${genderColor} flex items-center justify-center font-bold ring-2 ring-white dark:ring-slate-900`}>
      {getInitials(person.name)}
    </div>
  );
}

function SkeletonBlock() {
  return (
    <div className="animate-pulse space-y-3 p-4">
      <div className="flex items-center justify-center gap-4">
        <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="h-4 w-8 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="mx-auto h-6 w-40 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="mx-auto flex gap-2 justify-center">
        <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-700" />
      <div className="space-y-1">
        <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}

function ConfidenceMeter({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const color = score >= 90 ? 'bg-emerald-500' : score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';
  const label = score >= 95 ? 'Very High' : score >= 80 ? 'High' : score >= 60 ? 'Good' : score >= 40 ? 'Low' : 'Very Low';
  const height = size === 'sm' ? 'h-1' : size === 'lg' ? 'h-2.5' : 'h-1.5';
  const textSize = size === 'sm' ? 'text-[8px]' : size === 'lg' ? 'text-xs' : 'text-[10px]';
  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 ${height} rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      <div className="flex flex-col items-end min-w-[3rem]">
        <span className={`${textSize} font-medium text-slate-500 dark:text-slate-400`}>{score}%</span>
        <span className={`${textSize === 'text-[8px]' ? 'text-[6px]' : textSize === 'text-xs' ? 'text-[9px]' : 'text-[7px]'} text-slate-400 dark:text-slate-500`}>{label}</span>
      </div>
    </div>
  );
}

function RelationshipPath({ path, onLocatePerson }: { path: PathData; onLocatePerson?: (id: string) => void }) {
  if (!path || !path.nodes || path.nodes.length < 2) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {path.nodes.map((node, idx) => (
        <React.Fragment key={node.id}>
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.08, duration: 0.2 }}
            onClick={() => onLocatePerson?.(node.id)}
            className="group inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs shadow-sm hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:border-emerald-600 dark:hover:bg-emerald-900/20 transition-all"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-[8px] font-bold text-slate-500 dark:bg-slate-700 dark:text-slate-400 group-hover:bg-emerald-200 group-hover:text-emerald-700 dark:group-hover:bg-emerald-800 dark:group-hover:text-emerald-300 transition-colors">
              {getInitials(node.name)}
            </span>
            <span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors truncate max-w-[80px]">
              {node.name}
            </span>
          </motion.button>
          {idx < path.nodes.length - 1 && (
            <div className="flex items-center gap-0.5">
              <svg className="h-3 w-3 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {path.edges[idx] && (
                <span className="text-[9px] text-slate-400 dark:text-slate-500 italic hidden sm:inline">{path.edges[idx].label}</span>
              )}
            </div>
          )}
        </React.Fragment>
      ))}
      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        {path.length} steps
      </span>
    </div>
  );
}

function KinshipTree({ path, onLocatePerson }: { path: PathData; onLocatePerson?: (id: string) => void }) {
  if (!path || !path.nodes || path.nodes.length < 2) return null;
  const nodeWidth = 120;
  const nodeHeight = 36;
  const verticalGap = 60;
  const svgWidth = nodeWidth + 40;
  const svgHeight = path.nodes.length * (nodeHeight + verticalGap) - verticalGap + nodeHeight;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="overflow-x-auto"
    >
      <svg width={svgWidth} height={svgHeight} className="mx-auto">
        {path.nodes.map((node, idx) => {
          const x = svgWidth / 2;
          const y = idx * (nodeHeight + verticalGap) + nodeHeight / 2;
          const isMale = node.gender === 'male';
          const isFemale = node.gender === 'female';
          const fill = isMale ? '#dbeafe' : isFemale ? '#fce7f3' : '#f1f5f9';
          const stroke = isMale ? '#93c5fd' : isFemale ? '#f9a8d4' : '#cbd5e1';
          const textColor = isMale ? '#1e40af' : isFemale ? '#9d174d' : '#475569';
          return (
            <g key={node.id}>
              {idx > 0 && (
                <>
                  <line
                    x1={svgWidth / 2}
                    y1={y - nodeHeight / 2 - verticalGap / 2}
                    x2={svgWidth / 2}
                    y2={y - nodeHeight / 2}
                    stroke="#cbd5e1"
                    strokeWidth={1.5}
                  />
                  {path.edges[idx - 1] && (
                    <text
                      x={svgWidth / 2 + 8}
                      y={y - nodeHeight / 2 - verticalGap / 2 + 4}
                      fill="#94a3b8"
                      fontSize="8"
                      fontStyle="italic"
                    >
                      {path.edges[idx - 1].label}
                    </text>
                  )}
                </>
              )}
              <motion.rect
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ delay: idx * 0.1, duration: 0.3, ease: 'easeOut' }}
                x={x - nodeWidth / 2}
                y={y - nodeHeight / 2}
                width={nodeWidth}
                height={nodeHeight}
                rx={8}
                ry={8}
                fill={fill}
                stroke={stroke}
                strokeWidth={1.5}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onLocatePerson?.(node.id)}
              />
              <motion.text
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.1 + 0.15, duration: 0.2 }}
                x={svgWidth / 2}
                y={y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={textColor}
                fontSize="10"
                fontWeight="600"
                className="pointer-events-none select-none"
              >
                {node.name.length > 12 ? node.name.slice(0, 11) + '\u2026' : node.name}
              </motion.text>
            </g>
          );
        })}
      </svg>
    </motion.div>
  );
}

function LineageInfo({ lineage }: { lineage: LineageData }) {
  const maxAncestors = Math.max(lineage.maternalAncestors, lineage.paternalAncestors, 1);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
    >
      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        Lineage Info
      </p>
      <div className="flex items-center gap-2 mb-2">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${SIDE_COLORS[lineage.side] || SIDE_COLORS.Unknown}`}>
          {lineage.side}
        </span>
      </div>
      <div className="space-y-2">
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Maternal</span>
            <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300">{lineage.maternalAncestors}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(lineage.maternalAncestors / maxAncestors) * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-full bg-pink-400"
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Paternal</span>
            <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300">{lineage.paternalAncestors}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(lineage.paternalAncestors / maxAncestors) * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded-full bg-blue-400"
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function RelationshipViewer({
  personA,
  personB,
  result,
  loading = false,
  error,
  onLocatePerson,
  onClear,
}: RelationshipViewerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          <svg className="mr-1.5 inline-block h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Relationship Calculator
        </h4>
        {onClear && (
          <button onClick={onClear} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors">
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SkeletonBlock />
          </motion.div>
        )}

        {!loading && !personA && !personB && !result && !error && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col items-center justify-center px-6 py-10 text-center"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <svg className="h-6 w-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">Select two people</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">to calculate their relationship</p>
          </motion.div>
        )}

        {!loading && error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col items-center px-6 py-8 text-center"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Try selecting different people</p>
          </motion.div>
        )}

        {!loading && personA && personB && result && !result.found && (
          <motion.div
            key="not-found"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col items-center px-6 py-8 text-center"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <svg className="h-6 w-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">No relationship found</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {personA.name} and {personB.name} do not appear to be related
            </p>
          </motion.div>
        )}

        {!loading && personA && personB && result && result.found && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-center gap-3">
                <PersonAvatar person={personA} size="lg" />
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="flex items-center gap-1.5"
                >
                  <div className="h-px w-6 bg-slate-300 dark:bg-slate-600" />
                  <svg className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <div className="h-px w-6 bg-slate-300 dark:bg-slate-600" />
                </motion.div>
                <PersonAvatar person={personB} size="lg" />
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="truncate max-w-[120px]">{personA.name}</span>
                  <span>&amp;</span>
                  <span className="truncate max-w-[120px]">{personB.name}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4" />

              <div className="text-center">
                <motion.h2
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.3 }}
                  className="text-xl font-bold text-slate-900 dark:text-white"
                >
                  {result.relationshipLabel || result.relationshipType || 'Related'}
                </motion.h2>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                  className="mt-2 flex flex-wrap items-center justify-center gap-1.5"
                >
                  {result.relationshipCategory && (
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[result.relationshipCategory] || CATEGORY_COLORS.Blood}`}>
                      {result.relationshipCategory}
                    </span>
                  )}
                  {result.side && (
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${SIDE_COLORS[result.side] || SIDE_COLORS.Unknown}`}>
                      {result.side}
                    </span>
                  )}
                  {result.degree !== undefined && (
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                      {result.degree}{result.degree === 1 ? 'st' : result.degree === 2 ? 'nd' : result.degree === 3 ? 'rd' : 'th'} Degree
                    </span>
                  )}
                  {result.removal !== undefined && result.removal > 0 && (
                    <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600 dark:border-violet-800 dark:bg-violet-900/20 dark:text-violet-400">
                      {result.removal}x Removed
                    </span>
                  )}
                </motion.div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {result.generationDifference !== undefined && (
                  <div className="rounded-lg bg-slate-50 p-2.5 text-center dark:bg-slate-800/50">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Generation Gap</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {result.generationDifference === 0 ? 'Same' : `${Math.abs(result.generationDifference)} ${Math.abs(result.generationDifference) === 1 ? 'gen' : 'gens'}`}
                    </p>
                  </div>
                )}
                {result.confidence !== undefined && (
                  <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/50">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">Confidence</p>
                    <ConfidenceMeter score={result.confidence} />
                  </div>
                )}
              </div>

              {result.nearestCommonAncestor && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-900/20"
                >
                  <p className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                    Nearest Common Ancestor
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-200 text-xs font-bold text-emerald-700 dark:bg-emerald-800 dark:text-emerald-300">
                      {getInitials(result.nearestCommonAncestor.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {result.nearestCommonAncestor.name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {result.nearestCommonAncestor.distanceFromA} gen(s) from {personA.name} &middot; {result.nearestCommonAncestor.distanceFromB} gen(s) from {personB.name}
                      </p>
                    </div>
                    {onLocatePerson && (
                      <button
                        onClick={() => onLocatePerson(result.nearestCommonAncestor!.id)}
                        className="rounded-lg px-2 py-1 text-[10px] font-medium text-emerald-600 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-900/30 transition-colors"
                      >
                        Locate
                      </button>
                    )}
                  </div>
                </motion.div>
              )}

              {result.path && result.path.nodes.length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.3 }}
                >
                  <p className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    Path
                  </p>
                  <RelationshipPath path={result.path} onLocatePerson={onLocatePerson} />
                </motion.div>
              )}

              {result.lineage && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                >
                  <LineageInfo lineage={result.lineage} />
                </motion.div>
              )}

              {result.generations && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, duration: 0.3 }}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50"
                >
                  <p className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Generations
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded bg-white/60 p-1.5 text-center dark:bg-slate-800">
                      <span className="text-[9px] text-slate-500 dark:text-slate-400">Person A Gen</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{result.generations.personAGeneration}</p>
                    </div>
                    <div className="rounded bg-white/60 p-1.5 text-center dark:bg-slate-800">
                      <span className="text-[9px] text-slate-500 dark:text-slate-400">Person B Gen</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{result.generations.personBGeneration}</p>
                    </div>
                    <div className="rounded bg-white/60 p-1.5 text-center dark:bg-slate-800">
                      <span className="text-[9px] text-slate-500 dark:text-slate-400">Common Ancestor Gen</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{result.generations.commonAncestorGeneration}</p>
                    </div>
                    <div className="rounded bg-white/60 p-1.5 text-center dark:bg-slate-800">
                      <span className="text-[9px] text-slate-500 dark:text-slate-400">Total Gen A</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{result.generations.totalGenerationsFromA}</p>
                    </div>
                    <div className="rounded bg-white/60 p-1.5 text-center dark:bg-slate-800">
                      <span className="text-[9px] text-slate-500 dark:text-slate-400">Total Gen B</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{result.generations.totalGenerationsFromB}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {result.path && result.path.nodes.length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                >
                  <p className="mb-2 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                    Kinship Tree
                  </p>
                  <KinshipTree path={result.path} onLocatePerson={onLocatePerson} />
                </motion.div>
              )}

              <div className="flex gap-2 pt-1">
                {onLocatePerson && (
                  <>
                    <button
                      onClick={() => onLocatePerson(personA.id)}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
                    >
                      Locate {personA.name.split(' ')[0]}
                    </button>
                    <button
                      onClick={() => onLocatePerson(personB.id)}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
                    >
                      Locate {personB.name.split(' ')[0]}
                    </button>
                  </>
                )}
                {onClear && (
                  <button
                    onClick={onClear}
                    className="rounded-lg bg-slate-100 px-2 py-1.5 text-[10px] font-medium text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
