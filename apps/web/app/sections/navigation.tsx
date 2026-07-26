'use client';

import * as React from 'react';
import Link from 'next/link';
import { TreePine } from 'lucide-react';
import {
  Navbar,
  NavbarContent,
  NavbarBrand,
  NavbarNav,
  NavbarNavItem,
  NavbarActions,
  NavbarMobileToggle,
  NavbarMobileMenu,
  ThemeToggle,
  Button,
} from '@digital-family-tree/ui';
import { navItems } from '@digital-family-tree/config';

export function Navigation() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <Navbar scrolled={scrolled}>
      <NavbarContent>
        <NavbarBrand href="/">
          <TreePine className="h-6 w-6 text-green-600" />
          <span className="text-foreground">Digital Family Tree</span>
        </NavbarBrand>

        <NavbarNav className="hidden md:flex">
          {navItems.map((item) => (
            <li key={item.href}>
              <NavbarNavItem href={item.href}>{item.label}</NavbarNavItem>
            </li>
          ))}
        </NavbarNav>

        <NavbarActions className="hidden md:flex">
          <ThemeToggle />
          <Link href="/register">
            <Button size="sm" className="hidden lg:inline-flex">
              Get Started
            </Button>
          </Link>
        </NavbarActions>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <NavbarMobileToggle
            open={mobileOpen}
            onToggle={() => setMobileOpen(!mobileOpen)}
          />
        </div>
      </NavbarContent>

      <NavbarMobileMenu open={mobileOpen}>
        <div className="space-y-1 px-4 pb-4 pt-2">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <div className="mt-4 border-t border-border/60 pt-4">
            <Link href="/register" onClick={() => setMobileOpen(false)}>
              <Button className="w-full" size="lg">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </NavbarMobileMenu>
    </Navbar>
  );
}
