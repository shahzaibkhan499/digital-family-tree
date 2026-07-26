'use client';

import { Users, UserPlus, BookOpen, Calendar, Mail, Globe, FileText } from 'lucide-react';
import { QuickAction } from './dashboard-widgets';

const actions = [
  { label: 'Create Family', href: '/dashboard/families/new', icon: <Users className="h-5 w-5" />, color: 'emerald' },
  { label: 'Add Member', href: '/dashboard/families', icon: <UserPlus className="h-5 w-5" />, color: 'blue' },
  { label: 'Create Memory', href: '/dashboard/memories/new', icon: <BookOpen className="h-5 w-5" />, color: 'amber' },
  { label: 'Create Event', href: '/dashboard/timeline/new', icon: <Calendar className="h-5 w-5" />, color: 'rose' },
  { label: 'Create Clan', href: '/dashboard/clans/new', icon: <Globe className="h-5 w-5" />, color: 'purple' },
  { label: 'Upload Document', href: '/dashboard/documents', icon: <FileText className="h-5 w-5" />, color: 'emerald' },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
      {actions.map((a) => (
        <QuickAction key={a.label} label={a.label} href={a.href} icon={a.icon} color={a.color} />
      ))}
    </div>
  );
}
