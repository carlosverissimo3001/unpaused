"use client";

import { memo } from "react";

function AppFooterComponent() {
  return (
    <footer className="p-6 text-center text-xs text-muted-foreground border-t border-white/5 relative z-10">
      Powered by Spotify. Not affiliated with Spotify AB.
    </footer>
  );
}

export const AppFooter = memo(AppFooterComponent);
