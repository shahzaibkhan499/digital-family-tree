'use client';

const shimmer = 'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent dark:before:via-white/5';

export function TimelineCardSkeleton() {
  return (
    <div className={`flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 ${shimmer}`} style={{ height: 72 }}>
      <div className="h-10 w-10 shrink-0 rounded-lg bg-slate-200 dark:bg-slate-800" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-2/5 rounded-md bg-slate-200 dark:bg-slate-800" />
        <div className="h-2.5 w-1/3 rounded-md bg-slate-100 dark:bg-slate-800/80" />
      </div>
      <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}

export function TimelineFeedSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ animationDelay: `${i * 75}ms` }} className="animate-fade-in">
          <TimelineCardSkeleton />
        </div>
      ))}
    </div>
  );
}

export function TimelineStatsSkeleton() {
  return (
    <div className={`grid grid-cols-2 gap-3 sm:grid-cols-4 ${shimmer}`}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
          <div className="mb-3 h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <div className="mb-1.5 h-5 w-12 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-2.5 w-20 rounded bg-slate-100 dark:bg-slate-800/80" />
        </div>
      ))}
    </div>
  );
}

export function TimelineDetailSkeleton() {
  return (
    <div className={`rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 ${shimmer}`}>
      <div className="mb-5 flex items-start justify-between">
        <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800/80" />
      </div>
      <div className="space-y-3">
        <div className="h-5 w-3/4 rounded-md bg-slate-200 dark:bg-slate-800" />
        <div className="h-3.5 w-1/2 rounded bg-slate-100 dark:bg-slate-800/80" />
        <div className="h-3.5 w-2/5 rounded bg-slate-100 dark:bg-slate-800/80" />
      </div>
      <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
        <div className="mb-3 h-3 w-16 rounded bg-slate-100 dark:bg-slate-800/80" />
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-24 rounded bg-slate-100 dark:bg-slate-800/80" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
        <div className="mb-3 h-3 w-20 rounded bg-slate-100 dark:bg-slate-800/80" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 w-16 rounded-lg bg-slate-100 dark:bg-slate-800/80" />
          ))}
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <div className="h-9 flex-1 rounded-lg bg-slate-200 dark:bg-slate-800" />
        <div className="h-9 flex-1 rounded-lg bg-slate-100 dark:bg-slate-800/80" />
        <div className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800/80" />
      </div>
    </div>
  );
}

export function TimelineCalendarSkeleton() {
  return (
    <div className={`rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900 ${shimmer}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="flex gap-1.5">
          <div className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800/80" />
          <div className="h-7 w-7 rounded-lg bg-slate-100 dark:bg-slate-800/80" />
        </div>
      </div>
      <div className="mb-2 grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-3 rounded bg-slate-100 dark:bg-slate-800/80" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-lg bg-slate-100/60 dark:bg-slate-800/40" />
        ))}
      </div>
    </div>
  );
}
