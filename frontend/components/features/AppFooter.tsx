'use client';

import { memo } from 'react';

function AppFooterComponent() {
  return (
    <footer className="p-6 text-center text-[10px] tracking-widest text-muted-foreground border-t border-white/5 relative z-10 uppercase">
      Powered by Spotify. Not affiliated with Spotify AB.
    </footer>
  );
}

export const AppFooter = memo(AppFooterComponent);
