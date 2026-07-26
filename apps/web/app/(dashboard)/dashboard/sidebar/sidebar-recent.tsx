'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { History } from 'lucide-react';
import {
  Home,
  Users,
  GitBranch,
  Clock,
  BookOpen,
  Globe,
  Layers,
  Compass,
  Copy,
  FileText,
  Archive,
  Image,
  BookMarked,
  Bell,
  User,
  Settings,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  Users,
  GitBranch,
  Clock,
  BookOpen,
  Globe,
  Layers,
  Compass,
  Copy,
  FileText,
  Archive,
  Image,
  BookMarked,
  Bell,
  User,
  Settings,
  Search: Compass,
  History,
};

interface RecentEntry {
  id: string;
  label: string;
  href: string;
  icon: string;
}

interface SidebarRecentProps {
  recent: RecentEntry[];
  collapsed?: boolean;
  onClick?: () => void;
}

export default function SidebarRecent({ recent, collapsed = false, onClick }: SidebarRecentProps) {
  if (recent.length === 0) return null;

  return (
    <div role="group" aria-label="Recently visited">
      {!collapsed && (
        <div className="flex items-center gap-2 px-3 py-1.5">
          <History className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Recent
          </span>
        </div>
      )}
      {collapsed && <div className="my-1 border-t border-slate-200 dark:border-slate-700" />}
      <div className="space-y-0.5">
        <AnimatePresence>
          {recent.map((entry) => {
            const IconComponent = iconMap[entry.icon] || Compass;
            return (
              <motion.div
                key={entry.href}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Link
                  href={entry.href}
                  onClick={onClick}
                  role="menuitem"
                  className={`flex items-center gap-3 rounded-lg py-2 text-sm font-medium text-slate-600 transition-colors duration-150 ${
                    collapsed ? 'justify-center px-2' : 'px-3'
                  } hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900`}
                  title={collapsed ? entry.label : undefined}
                >
                  <IconComponent className="h-5 w-5 shrink-0 text-slate-400" />
                  {!collapsed && <span className="truncate">{entry.label}</span>}
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
