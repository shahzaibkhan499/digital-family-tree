'use client';

import { useEffect } from 'react';

export function ReticleDev() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      void import('@reticlehq/react').then(({ reticle, SESSION_AUTO }) => {
        const token = process.env.NEXT_PUBLIC_RETICLE_TOKEN;
        reticle.connect({
          session: SESSION_AUTO,
          projectId: 'digital-family-tree-fa17f901',
          ...(token ? { token } : {}),
        });
      });
    }
  }, []);

  return null;
}
