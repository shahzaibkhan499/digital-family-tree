'use client';

import React, { useMemo, useRef, useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TreeGenerationNavigatorProps {
  nodes: any[];
  positions: Record<string, { x: number; y: number }>;
  layout: string;
  onJumpToGeneration: (generation: number) => void;
}

const GENERATION_NAMES: Record<number, string> = {
  [-4]: 'Great-Great-Grandparents',
  [-3]: 'Great-Grandparents',
  [-2]: 'Grandparents',
  [-1]: 'Parents',
  [0]: 'You & Siblings',
  [1]: 'Children',
  [2]: 'Grandchildren',
  [3]: 'Great-Grandchildren',
  [4]: 'Great-Great-Grandchildren',
};

const GENERATION_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444',
  '#06b6d4', '#d946ef', '#f97316', '#14b8a6', '#6366f1',
];

function getGenName(gen: number): string {
  return GENERATION_NAMES[gen] || `Generation ${gen}`;
}

function getGenColor(gen: number): string {
  return GENERATION_COLORS[((gen % GENERATION_COLORS.length) + GENERATION_COLORS.length) % GENERATION_COLORS.length];
}

export default function TreeGenerationNavigator({
  nodes,
  positions,
  layout,
  onJumpToGeneration,
}: TreeGenerationNavigatorProps) {
  const [hoveredGen, setHoveredGen] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const generations = useMemo(() => {
    const genMap = new Map<number, { count: number; minY: number; maxY: number }>();
    for (const node of nodes) {
      const gen = node.depth || 0;
      const pos = positions[node.id];
      if (!pos) continue;
      const existing = genMap.get(gen) || { count: 0, minY: Infinity, maxY: -Infinity };
      existing.count++;
      existing.minY = Math.min(existing.minY, pos.y);
      existing.maxY = Math.max(existing.maxY, pos.y);
      genMap.set(gen, existing);
    }
    return Array.from(genMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([gen, data]) => ({ generation: gen, ...data }));
  }, [nodes, positions]);

  const handleJump = useCallback((generation: number) => {
    onJumpToGeneration(generation);
  }, [onJumpToGeneration]);

  if (generations.length === 0) return null;

  const maxCount = Math.max(...generations.map(g => g.count));
  const middleGen = generations.length > 0 ? generations[Math.floor(generations.length / 2)].generation : 0;

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-xl border border-slate-200 bg-white/95 shadow-lg backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95 p-2.5"
    >
      <div className="mb-2 text-center">
        <span className="text-[9px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">Generations</span>
      </div>
      <div className="flex flex-col-reverse gap-1">
        {generations.map(({ generation, count }) => {
          const isCurrent = generation === 0;
          const isHovered = hoveredGen === generation;
          const width = Math.max(6, (count / maxCount) * 56);
          const barColor = getGenColor(generation);

          return (
            <motion.button
              key={generation}
              layout
              onClick={() => handleJump(generation)}
              onMouseEnter={() => setHoveredGen(generation)}
              onMouseLeave={() => setHoveredGen(null)}
              className="group relative flex items-center gap-1.5 rounded-md px-1 py-0.5 transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
              title={`Generation ${generation}: ${count} member${count !== 1 ? 's' : ''}`}
              whileTap={{ scale: 0.97 }}
            >
              <span className="w-4 text-right text-[9px] font-mono text-slate-400 dark:text-slate-500">
                {generation}
              </span>
              <div className="relative flex items-center gap-1.5">
                <div
                  className="h-2.5 rounded-sm transition-all duration-200"
                  style={{
                    width: `${width}px`,
                    backgroundColor: isHovered ? barColor : `${barColor}99`,
                  }}
                />
                {isCurrent && (
                  <motion.div
                    layoutId="current-gen-indicator"
                    className="absolute -left-0.5 -top-0.5"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <span className="flex h-3.5 w-3.5 items-center justify-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-300" />
                    </span>
                  </motion.div>
                )}
              </div>
              <span className="text-[9px] text-slate-400 dark:text-slate-500 min-w-[14px] text-right">{count}</span>

              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute -top-8 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium text-slate-700 shadow-md dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {getGenName(generation)} &middot; {count} member{count !== 1 ? 's' : ''}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
