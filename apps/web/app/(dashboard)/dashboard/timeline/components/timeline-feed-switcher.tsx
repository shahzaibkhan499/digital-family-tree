'use client';

import { useRef, useState } from 'react';
import {
  Clock, Star, Users, Globe, Building2, MapPin, TrendingUp,
  CalendarClock, BookOpen, Heart, Cake, Sparkles, RefreshCw, Shield, Bookmark,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

const FEED_TYPES = [
  { id: 'chronological', label: 'Chronological', icon: Clock },
  { id: 'importance', label: 'Important', icon: Star },
  { id: 'family', label: 'Family Only', icon: Users },
  { id: 'clan', label: 'Clan', icon: Globe },
  { id: 'community', label: 'Community', icon: Building2 },
  { id: 'nearby', label: 'Nearby', icon: MapPin },
  { id: 'popular', label: 'Popular', icon: TrendingUp },
  { id: 'upcoming', label: 'Upcoming', icon: CalendarClock },
  { id: 'historical', label: 'Historical', icon: BookOpen },
  { id: 'anniversary', label: 'Anniversaries', icon: Heart },
  { id: 'birthdays', label: 'Birthdays', icon: Cake },
  { id: 'ai_suggested', label: 'AI Suggested', icon: Sparkles },
  { id: 'recently_updated', label: 'Recently Updated', icon: RefreshCw },
  { id: 'verified', label: 'Verified', icon: Shield },
  { id: 'bookmarked', label: 'Bookmarked', icon: Bookmark },
];

export default function TimelineFeedSwitcher({ activeFeed, onChange }: {
  activeFeed: string;
  onChange: (feed: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -200 : 200, behavior: 'smooth' });
  };

  return (
    <div className="relative flex items-center gap-1">
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-md dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700"
        >
          <ChevronLeft className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-1.5 overflow-x-auto scrollbar-none px-1 py-1"
      >
        {FEED_TYPES.map(feed => {
          const Icon = feed.icon;
          const isActive = activeFeed === feed.id;
          return (
            <button
              key={feed.id}
              onClick={() => onChange(feed.id)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {feed.label}
            </button>
          );
        })}
      </div>

      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow-md dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700"
        >
          <ChevronRight className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
        </button>
      )}
    </div>
  );
}
