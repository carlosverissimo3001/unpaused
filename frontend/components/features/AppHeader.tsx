"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { LogOut, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuthMeResponseDto } from "@/sdk";

interface AppHeaderProps {
  user: AuthMeResponseDto | undefined;
  onLogout: () => void;
  isLoggingOut: boolean;
}

function AppHeaderComponent({ user, onLogout, isLoggingOut }: AppHeaderProps) {
  return (
    <header className="p-6 flex items-center justify-between border-b border-white/5 relative z-10">
      <div className="flex items-center gap-3">
        <Music2 className="w-8 h-8 text-spotify-green" />
        <span className="text-2xl font-bold tracking-tight">Unpaused</span>
      </div>
      {user && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-spotify-green to-emerald-600 flex items-center justify-center text-sm font-bold text-black">
              {user.displayName[0]?.toUpperCase()}
            </div>
            <span className="text-sm font-medium hidden sm:inline">{user.displayName}</span>
          </div>
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              disabled={isLoggingOut}
            >
              <LogOut className="w-4 h-4" />
              <span className="ml-2 hidden sm:inline">Sign out</span>
            </Button>
          </motion.div>
        </div>
      )}
    </header>
  );
}

export const AppHeader = memo(AppHeaderComponent);
