'use client';

import { useEffect } from 'react';
import { Button } from '@digital-family-tree/ui';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="mb-4 text-6xl font-bold tracking-tighter text-destructive/30">!</p>
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Something went wrong</h1>
      <p className="mb-8 max-w-md text-muted-foreground">
        An unexpected error occurred. Our team has been notified. Please try again or contact
        support if the problem persists.
      </p>
      <div className="flex gap-4">
        <Button onClick={reset} size="lg">
          Try Again
        </Button>
        <Button onClick={() => (window.location.href = '/')} variant="outline" size="lg">
          Return Home
        </Button>
      </div>
    </div>
  );
}
