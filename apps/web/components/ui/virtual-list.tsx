'use client';

import { useState, useRef, useCallback, useMemo, useEffect, type CSSProperties } from 'react';
import { cn } from '@digital-family-tree/ui';
import { Loader2 } from 'lucide-react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number, style: CSSProperties) => React.ReactNode;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  className?: string;
  overscan?: number;
  getItemHeight?: (item: T, index: number) => number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  onLoadMore,
  hasMore = false,
  loading = false,
  className,
  overscan = 5,
  getItemHeight,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const heightCache = useRef<Map<number, number>>(new Map());

  const getHeight = useCallback(
    (item: T, index: number): number => {
      if (heightCache.current.has(index)) {
        return heightCache.current.get(index)!;
      }
      const h = getItemHeight ? getItemHeight(item, index) : itemHeight;
      heightCache.current.set(index, h);
      return h;
    },
    [getItemHeight, itemHeight]
  );

  const getOffsetForIndex = useCallback(
    (index: number): number => {
      let offset = 0;
      for (let i = 0; i < index; i++) {
        offset += getHeight(items[i], i);
      }
      return offset;
    },
    [items, getHeight]
  );

  const totalHeight = useMemo(() => {
    let total = 0;
    for (let i = 0; i < items.length; i++) {
      total += getHeight(items[i], i);
    }
    return total;
  }, [items, getHeight]);

  const { startIndex, endIndex } = useMemo(() => {
    let accumulated = 0;
    let start = 0;

    for (let i = 0; i < items.length; i++) {
      const h = getHeight(items[i], i);
      if (accumulated + h > scrollTop) {
        start = i;
        break;
      }
      accumulated += h;
      if (i === items.length - 1) start = i;
    }

    let end = start;
    let visibleHeight = 0;
    for (let i = start; i < items.length; i++) {
      const h = getHeight(items[i], i);
      visibleHeight += h;
      end = i;
      if (visibleHeight >= containerHeight) break;
    }

    return {
      startIndex: Math.max(0, start - overscan),
      endIndex: Math.min(items.length - 1, end + overscan),
    };
  }, [scrollTop, containerHeight, items, getHeight, overscan]);

  const visibleItems = useMemo(() => {
    const result: { item: T; index: number; style: CSSProperties }[] = [];
    let offset = 0;

    for (let i = 0; i < startIndex; i++) {
      offset += getHeight(items[i], i);
    }

    for (let i = startIndex; i <= endIndex && i < items.length; i++) {
      const h = getHeight(items[i], i);
      result.push({
        item: items[i],
        index: i,
        style: {
          position: 'absolute',
          top: offset,
          left: 0,
          right: 0,
          height: h,
        },
      });
      offset += h;
    }

    return result;
  }, [startIndex, endIndex, items, getHeight]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    setScrollTop(containerRef.current.scrollTop);
  }, []);

  useEffect(() => {
    if (!onLoadMore || !hasMore || loading) return;
    if (!containerRef.current) return;

    const el = containerRef.current;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (nearBottom) {
      onLoadMore();
    }
  }, [scrollTop, hasMore, loading, onLoadMore, items.length]);

  if (items.length === 0 && !loading) {
    return (
      <div
        className={cn(
          'flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm',
          className
        )}
        style={{ height: containerHeight }}
      >
        No items to display
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn('overflow-y-auto relative', className)}
      style={{ height: containerHeight, scrollBehavior: 'smooth' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, style }) => (
          <div key={index} style={style}>
            {renderItem(item, index, style)}
          </div>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-4 gap-2 text-gray-400 dark:text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading more...</span>
        </div>
      )}
    </div>
  );
}
