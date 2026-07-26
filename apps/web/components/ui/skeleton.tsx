'use client';

import { cn } from '@digital-family-tree/ui';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  count?: number;
  animate?: boolean;
}

function getVariantClasses(variant: SkeletonProps['variant']): string {
  switch (variant) {
    case 'circular':
      return 'rounded-full';
    case 'rounded':
      return 'rounded-xl';
    case 'rectangular':
      return 'rounded-none';
    case 'text':
    default:
      return 'rounded h-4';
  }
}

export function Skeleton({
  className,
  variant = 'text',
  width,
  height,
  count = 1,
  animate = true,
}: SkeletonProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            getVariantClasses(variant),
            animate && 'animate-shimmer',
            'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800',
            'bg-[length:200%_100%]'
          )}
          style={{
            width: i === count - 1 && variant === 'text' ? '60%' : width,
            height: height,
          }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="40%" height={16} />
          <Skeleton variant="text" width="25%" height={12} />
        </div>
      </div>
      <Skeleton variant="text" width="100%" height={14} count={3} />
      <div className="flex gap-2 pt-1">
        <Skeleton variant="rounded" width={64} height={28} />
        <Skeleton variant="rounded" width={48} height={28} />
      </div>
    </div>
  );
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return <Skeleton variant="text" count={lines} height={14} />;
}

export function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeMap = { sm: 32, md: 40, lg: 56 };
  const px = sizeMap[size];
  return <Skeleton variant="circular" width={px} height={px} />;
}

export function SkeletonImage({ className }: { className?: string }) {
  return (
    <Skeleton
      variant="rounded"
      width="100%"
      height={200}
      className={cn('overflow-hidden', className)}
    />
  );
}
