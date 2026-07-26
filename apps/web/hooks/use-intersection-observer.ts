'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  callback: (entry: IntersectionObserverEntry) => void,
  options?: UseIntersectionObserverOptions
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const callbackRef = useRef(callback);
  const hasTriggered = useRef(false);

  callbackRef.current = callback;

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (!entry) return;

      setIsIntersecting(entry.isIntersecting);
      callbackRef.current(entry);

      if (entry.isIntersecting && options?.triggerOnce) {
        hasTriggered.current = true;
      }
    },
    [options?.triggerOnce]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!ref.current) return;
    if (hasTriggered.current) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: options?.threshold ?? 0,
      rootMargin: options?.rootMargin ?? '200px',
    });

    const el = ref.current;
    observer.observe(el);

    return () => {
      observer.unobserve(el);
      observer.disconnect();
    };
  }, [ref, handleIntersection, options?.threshold, options?.rootMargin]);

  return isIntersecting;
}
