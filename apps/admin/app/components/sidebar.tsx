'use client';

import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'Users', href: '/users' },
  { label: 'Families', href: '/families' },
  { label: 'Communities', href: '/communities' },
  { label: 'Clans', href: '/clans' },
  { label: 'SubClans', href: '/subclans' },
  { label: 'Duplicates', href: '/duplicates' },
  { label: 'Merge History', href: '/merges' },
  { label: 'Activities', href: '/activities' },
  { label: 'Events', href: '/events' },
  { label: 'Memories', href: '/memories' },
  { label: 'Notifications', href: '/notifications' },
  { label: 'Document Vault', href: '/documents' },
  { label: 'Tree Analytics', href: '/tree' },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 border-r border-border/60 bg-card/80 lg:block">
      <div className="flex h-16 items-center border-b border-border/60 px-6">
        <h1 className="text-lg font-bold">DFT Admin</h1>
      </div>
      <nav className="space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex rounded-lg px-3 py-2 text-sm font-medium ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {item.label}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
