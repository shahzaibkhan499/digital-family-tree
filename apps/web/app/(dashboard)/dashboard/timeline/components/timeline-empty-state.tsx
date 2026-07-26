'use client';

import { motion } from 'framer-motion';
import { Calendar, Plus, Users, Globe, UserPlus, Sparkles, ArrowRight } from 'lucide-react';

interface TimelineEmptyStateProps {
  onCreateEvent?: () => void;
  hasFamily?: boolean;
  hasClan?: boolean;
  hasCommunity?: boolean;
}

const steps = [
  {
    icon: Calendar,
    label: 'Create your first family event',
    desc: 'Birthdays, weddings, graduations â€” every milestone matters',
  },
  {
    icon: UserPlus,
    label: 'Invite family members',
    desc: 'Share your timeline and build your family history together',
  },
  {
    icon: Globe,
    label: 'Join a Clan or Community',
    desc: 'Connect with extended family and discover shared heritage',
  },
];

export default function TimelineEmptyState({
  onCreateEvent,
  hasFamily,
  hasClan,
  hasCommunity,
}: TimelineEmptyStateProps) {
  const filteredSteps = steps.filter((_, i) => {
    if (i === 0) return true;
    if (i === 1 && hasFamily) return false;
    if (i === 2 && (hasClan || hasCommunity)) return false;
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center px-6 py-16 text-center"
    >
      <div className="relative mb-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30"
        >
          <Sparkles className="h-10 w-10 text-emerald-500 dark:text-emerald-400" />
        </motion.div>
      </div>

      <h3 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
        No events yet
      </h3>
      <p className="mb-10 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
        Your timeline is a blank canvas. Start capturing your family&apos;s story â€” every event, big or small, deserves to be remembered.
      </p>

      {/* Onboarding Steps */}
      <div className="mb-10 w-full max-w-md space-y-3 text-left">
        {filteredSteps.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="flex items-start gap-4 rounded-2xl border border-slate-200/60 bg-white/80 p-4 shadow-sm backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/80"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {step.label}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {step.desc}
                </p>
              </div>
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                {i + 1}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCreateEvent}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-700 hover:shadow-xl"
        >
          <Plus className="h-4 w-4" />
          Create Your First Event
        </motion.button>
        <a
          href="/dashboard/families"
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <Users className="h-4 w-4" />
          Invite Family
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </motion.div>
  );
}
