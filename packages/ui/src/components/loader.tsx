import * as React from 'react';
import { cn } from '../lib/utils';

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizeClasses = {
  sm: 'h-6 w-6 border-2',
  md: 'h-10 w-10 border-4',
  lg: 'h-16 w-16 border-4',
};

function Loader({ size = 'md', label = 'Loading...', className, ...props }: LoaderProps) {
  return (
    <div
      className={cn('flex min-h-[240px] items-center justify-center', className)}
      role="status"
      aria-label={label}
      {...props}
    >
      <div
        className={cn(
          'animate-spin rounded-full border-primary border-t-transparent',
          sizeClasses[size],
        )}
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export { Loader };
