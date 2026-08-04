'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ConnectionStatusBanner } from '@/components/ui/connection-status-banner';
import { ApiProvider } from '@/components/providers/api-provider';
import { useAuth } from '@/lib/auth-context';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <ApiProvider>
      <ConnectionStatusBanner />
      <ErrorBoundary>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <div className="flex min-h-screen flex-col">
          <nav aria-label="Main navigation" className="sr-only">
            <span>Navigation landmarks are managed by the application shell.</span>
          </nav>
          <main id="main-content" role="main" aria-label="Dashboard content" className="flex-1">
            {children}
          </main>
        </div>
      </ErrorBoundary>
    </ApiProvider>
  );
}
