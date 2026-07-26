import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist.',
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="mb-4 text-6xl font-bold tracking-tighter text-muted-foreground/30">404</p>
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Page Not Found</h1>
      <p className="mb-8 max-w-md text-muted-foreground">
        The page you are looking for does not exist or has been moved. Please check the URL or
        navigate back to the homepage.
      </p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      >
        Return Home
      </Link>
    </div>
  );
}
