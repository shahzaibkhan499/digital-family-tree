'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SmilePlus } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

const EMOJI_OPTIONS = ['â¤ï¸', 'ðŸ‘', 'ðŸŽ‰', 'ðŸ˜Š', 'ðŸ”¥', 'ðŸ’ª', 'ðŸ™', 'âœ¨'];

interface ReactionGroup {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

export default function EventReactions({ eventId }: { eventId: string }) {
  const { user } = useAuth();
  const [grouped, setGrouped] = useState<ReactionGroup[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [animatingEmoji, setAnimatingEmoji] = useState<string | null>(null);

  const fetchReactions = useCallback(async () => {
    try {
      const res = await api.timeline.getReactions(eventId);
      const groupedData = res?.grouped || {};
      const userId = user?.id;
      const groups: ReactionGroup[] = Object.entries(groupedData).map(([emoji, users]: [string, any]) => ({
        emoji,
        count: Array.isArray(users) ? users.length : 0,
        users: Array.isArray(users) ? users : [],
        hasReacted: Array.isArray(users) && userId ? users.includes(userId) : false,
      }));
      setGrouped(groups);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, [eventId, user?.id]);

  useEffect(() => { fetchReactions(); }, [fetchReactions]);

  const handleReaction = async (emoji: string) => {
    setAnimatingEmoji(emoji);
    setShowPicker(false);

    // Optimistic update
    setGrouped(prev => {
      const existing = prev.find(g => g.emoji === emoji);
      if (existing) {
        if (existing.hasReacted) {
          const newUsers = existing.users.filter(id => id !== user?.id);
          if (newUsers.length === 0) {
            return prev.filter(g => g.emoji !== emoji);
          }
          return prev.map(g => g.emoji === emoji
            ? { ...g, count: newUsers.length, users: newUsers, hasReacted: false }
            : g
          );
        } else {
          return prev.map(g => g.emoji === emoji
            ? { ...g, count: g.count + 1, users: [...g.users, user?.id || ''], hasReacted: true }
            : g
          );
        }
      } else {
        return [...prev, { emoji, count: 1, users: [user?.id || ''], hasReacted: true }];
      }
    });

    try {
      await api.timeline.addReaction(eventId, emoji);
      await fetchReactions();
    } catch {
      await fetchReactions();
    } finally {
      setTimeout(() => setAnimatingEmoji(null), 400);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        {[1, 2].map(i => (
          <div key={i} className="h-8 w-16 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center flex-wrap gap-2">
      {/* Existing reactions */}
      {grouped.map(g => (
        <motion.button
          key={g.emoji}
          onClick={() => handleReaction(g.emoji)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
            g.hasReacted
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-base">{g.emoji}</span>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={g.count}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-xs font-medium"
            >
              {g.count}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      ))}

      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 bg-white px-3 py-1 text-sm text-slate-400 transition-colors hover:border-emerald-400 hover:text-emerald-600 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-500 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
        >
          <SmilePlus className="h-3.5 w-3.5" />
          <span className="text-xs">React</span>
        </button>

        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-0 z-20 mb-2 flex gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-800"
            >
              {EMOJI_OPTIONS.map(emoji => (
                <motion.button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="rounded-lg p-2 text-xl transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {emoji}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
