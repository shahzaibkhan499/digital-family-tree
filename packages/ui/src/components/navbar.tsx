'use client';

import * as React from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  scrolled?: boolean;
}

const Navbar = React.forwardRef<HTMLElement, NavbarProps>(
  ({ className, scrolled, ...props }, ref) => (
    <header
      ref={ref}
      className={cn(
        'sticky top-0 z-40 border-b transition-all duration-300',
        scrolled
          ? 'border-border/60 bg-background/95 shadow-sm backdrop-blur-md'
          : 'border-transparent bg-transparent',
        className,
      )}
      role="banner"
      {...props}
    />
  ),
);
Navbar.displayName = 'Navbar';

function NavbarContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8', className)}
      {...props}
    />
  );
}

function NavbarBrand({ className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className={cn('flex items-center gap-2 text-lg font-bold', className)}
      {...props}
    />
  );
}

function NavbarNav({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return (
    <nav role="navigation" aria-label="Main navigation">
      <ul className={cn('flex items-center gap-6', className)} {...props} />
    </nav>
  );
}

function NavbarNavItem({
  className,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className={cn(
        'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
        className,
      )}
      {...props}
    />
  );
}

function NavbarActions({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-center gap-3', className)} {...props} />;
}

function NavbarMobileToggle({
  open,
  onToggle,
  className,
}: {
  open: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn('rounded-md p-2 text-foreground md:hidden', className)}
      aria-label={open ? 'Close menu' : 'Open menu'}
      aria-expanded={open}
    >
      {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </button>
  );
}

function NavbarMobileMenu({
  open,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { open: boolean }) {
  if (!open) return null;
  return (
    <div
      className={cn(
        'border-t border-border/60 bg-background/95 backdrop-blur-md md:hidden',
        className,
      )}
      {...props}
    />
  );
}

export {
  Navbar,
  NavbarContent,
  NavbarBrand,
  NavbarNav,
  NavbarNavItem,
  NavbarActions,
  NavbarMobileToggle,
  NavbarMobileMenu,
};
