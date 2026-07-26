'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import type { NavItem } from './nav-config';

interface SidebarItemProps {
  item: NavItem;
  collapsed?: boolean;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onClick?: () => void;
}

export default function SidebarItem({
  item,
  collapsed = false,
  isFavorite,
  onToggleFavorite,
  onClick,
}: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
  const Icon = item.icon;

  return (
    <div className="group/item relative" role="none">
      <Link
        href={item.href}
        onClick={onClick}
        role="menuitem"
        aria-current={isActive ? 'page' : undefined}
        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
          collapsed ? 'justify-center px-2' : 'px-3'
        } ${
          isActive
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
            : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
        } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900`}
        title={collapsed ? item.label : undefined}
      >
        {isActive && (
          <motion.div
            layoutId="sidebar-active-indicator"
            className="absolute inset-y-1 left-0 w-[3px] rounded-full bg-emerald-600 dark:bg-emerald-400"
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
        <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`} />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
      {!collapsed && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite(item.id);
          }}
          aria-label={isFavorite ? `Remove ${item.label} from favorites` : `Add ${item.label} to favorites`}
          className={`absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 transition-opacity duration-150 ${
            isFavorite
              ? 'opacity-100 text-amber-500'
              : 'opacity-0 group-hover/item:opacity-100 text-slate-400 hover:text-amber-500'
          } hover:bg-slate-200 dark:hover:bg-slate-700`}
        >
          <Star className={`h-3.5 w-3.5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      )}
    </div>
  );
}
