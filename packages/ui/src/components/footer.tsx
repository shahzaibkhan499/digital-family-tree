import * as React from 'react';
import { Heart } from 'lucide-react';
import { cn } from '../lib/utils';

interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  brandName?: string;
}

const Footer = React.forwardRef<HTMLElement, FooterProps>(
  ({ className, brandName = 'Digital Family Tree', ...props }, ref) => (
    <footer
      ref={ref}
      className={cn('border-t border-border/60 bg-card/50', className)}
      role="contentinfo"
      {...props}
    />
  ),
);
Footer.displayName = 'Footer';

function FooterContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8', className)}
      {...props}
    />
  );
}

function FooterGrid({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4', className)} {...props} />;
}

function FooterSection({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-4', className)} {...props} />;
}

function FooterSectionTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-sm font-semibold uppercase tracking-wider', className)} {...props} />;
}

function FooterLinkList({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn('space-y-2', className)} {...props} />;
}

function FooterLink({ className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      className={cn(
        'text-sm text-muted-foreground transition-colors hover:text-foreground',
        className,
      )}
      {...props}
    />
  );
}

function FooterBottom({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'border-t border-border/60 px-4 py-6 sm:px-6 lg:px-8',
        className,
      )}
      {...props}
    />
  );
}

function FooterBottomContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row',
        className,
      )}
      {...props}
    />
  );
}

function FooterCopyright({ year, brandName = 'Digital Family Tree', className }: { year?: number; brandName?: string; className?: string }) {
  const currentYear = year || new Date().getFullYear();
  return (
    <p className={cn('text-sm text-muted-foreground', className)}>
      &copy; {currentYear} {brandName}. All rights reserved.
    </p>
  );
}

function FooterMadeWith({ className }: { className?: string }) {
  return (
    <p className={cn('flex items-center gap-1 text-sm text-muted-foreground', className)}>
      Made with <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" /> for families everywhere
    </p>
  );
}

export {
  Footer,
  FooterContent,
  FooterGrid,
  FooterSection,
  FooterSectionTitle,
  FooterLinkList,
  FooterLink,
  FooterBottom,
  FooterBottomContent,
  FooterCopyright,
  FooterMadeWith,
};
