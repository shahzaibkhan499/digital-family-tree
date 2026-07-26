'use client';

import React, { useMemo, useRef, useCallback, useEffect, useState } from 'react';

const MINIMAP_W = 200;
const MINIMAP_H = 140;

interface TreeMinimapProps {
  nodes: any[];
  edges: any[];
  positions: Record<string, { x: number; y: number }>;
  viewBox: { x: number; y: number; w: number; h: number };
  selectedNodeId?: string;
  searchHighlightIds?: string[];
  onViewBoxChange?: (vb: { x: number; y: number; w: number; h: number }) => void;
}

export default function TreeMinimap({
  nodes,
  edges,
  positions,
  viewBox,
  selectedNodeId,
  searchHighlightIds = [],
  onViewBoxChange,
}: TreeMinimapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0 });

  const bounds = useMemo(() => {
    const posArr = Object.values(positions);
    if (posArr.length === 0) return { minX: 0, minY: 0, maxX: 1000, maxY: 800 };
    const xs = posArr.map(p => p.x);
    const ys = posArr.map(p => p.y);
    return {
      minX: Math.min(...xs) - 50,
      minY: Math.min(...ys) - 50,
      maxX: Math.max(...xs) + 250,
      maxY: Math.max(...ys) + 150,
    };
  }, [positions]);

  const scaleX = MINIMAP_W / (bounds.maxX - bounds.minX || 1);
  const scaleY = MINIMAP_H / (bounds.maxY - bounds.minY || 1);
  const scale = Math.min(scaleX, scaleY);

  const mapX = (x: number) => (x - bounds.minX) * scale;
  const mapY = (y: number) => (y - bounds.minY) * scale;

  const viewportRect = useMemo(() => ({
    x: mapX(viewBox.x),
    y: mapY(viewBox.y),
    w: viewBox.w * scale,
    h: viewBox.h * scale,
  }), [viewBox, scale, bounds]);

  const highlightSet = useMemo(() => new Set(searchHighlightIds), [searchHighlightIds]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY };

    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * MINIMAP_W;
    const my = ((e.clientY - rect.top) / rect.height) * MINIMAP_H;

    const realX = mx / scale + bounds.minX;
    const realY = my / scale + bounds.minY;
    onViewBoxChange?.({ x: realX - viewBox.w / 2, y: realY - viewBox.h / 2, w: viewBox.w, h: viewBox.h });
  }, [viewBox, scale, bounds, onViewBoxChange]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * MINIMAP_W;
    const my = ((e.clientY - rect.top) / rect.height) * MINIMAP_H;
    const realX = mx / scale + bounds.minX;
    const realY = my / scale + bounds.minY;
    onViewBoxChange?.({ x: realX - viewBox.w / 2, y: realY - viewBox.h / 2, w: viewBox.w, h: viewBox.h });
  }, [dragging, viewBox, scale, bounds, onViewBoxChange]);

  const handleMouseUp = useCallback(() => setDragging(false), []);

  if (nodes.length === 0) return null;

  return (
    <div className="absolute bottom-3 left-3 z-20 rounded-lg border border-slate-200 bg-white/90 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-2 py-1 dark:border-slate-800">
        <span className="text-[9px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">Overview</span>
        <span className="text-[9px] text-slate-400 dark:text-slate-500">{nodes.length} nodes</span>
      </div>
      <svg
        ref={svgRef}
        width={MINIMAP_W}
        height={MINIMAP_H}
        viewBox={`0 0 ${MINIMAP_W} ${MINIMAP_H}`}
        className="cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <rect width={MINIMAP_W} height={MINIMAP_H} fill="transparent" />

        {edges.map((edge: any, idx: number) => {
          const fromId = edge.from || edge.fromMemberId || edge.source;
          const toId = edge.to || edge.toMemberId || edge.target;
          const from = positions[fromId];
          const to = positions[toId];
          if (!from || !to) return null;
          return (
            <line
              key={`me-${idx}`}
              x1={mapX(from.x + 90)}
              y1={mapY(from.y + 44)}
              x2={mapX(to.x + 90)}
              y2={mapY(to.y + 44)}
              stroke="#cbd5e1"
              strokeWidth={0.5}
            />
          );
        })}

        {nodes.map((node: any) => {
          const p = positions[node.id];
          if (!p) return null;
          const isSearch = highlightSet.has(node.id);
          const isSelected = selectedNodeId === node.id;
          const color = node.gender?.toLowerCase() === 'male' ? '#3b82f6'
            : node.gender?.toLowerCase() === 'female' ? '#ec4899' : '#8b5cf6';
          return (
            <rect
              key={`mn-${node.id}`}
              x={mapX(p.x)}
              y={mapY(p.y)}
              width={Math.max(4, 180 * scale)}
              height={Math.max(3, 88 * scale)}
              rx={2}
              fill={isSelected ? '#10b981' : isSearch ? '#fbbf24' : color}
              opacity={isSelected ? 1 : isSearch ? 0.9 : 0.6}
            />
          );
        })}

        <rect
          x={viewportRect.x}
          y={viewportRect.y}
          width={viewportRect.w}
          height={viewportRect.h}
          fill="none"
          stroke="#10b981"
          strokeWidth={1.5}
          strokeDasharray="3 2"
          rx={2}
        />
      </svg>
    </div>
  );
}
