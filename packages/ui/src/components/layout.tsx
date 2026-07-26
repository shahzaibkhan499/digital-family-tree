import * as React from 'react';
import { cn } from '../lib/utils';

function Section({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return <section className={cn('py-16 sm:py-20 lg:py-24', className)} {...props} />;
}

function SectionHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mx-auto mb-12 max-w-2xl text-center lg:mb-16', className)}
      {...props}
    />
  );
}

function SectionTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn('text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl', className)}
      {...props}
    />
  );
}

function SectionDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('mt-4 text-lg text-muted-foreground', className)}
      {...props}
    />
  );
}

function Container({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mx-auto max-w-7xl', className)} {...props} />;
}

export { Section, SectionHeader, SectionTitle, SectionDescription, Container };
