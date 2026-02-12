'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { LogOut, History, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AuthMeResponseDto } from '@/sdk';

interface AppHeaderProps {
  user: AuthMeResponseDto | undefined;
  onLogout: () => void;
  isLoggingOut: boolean;
}

function AppHeaderComponent({ user, onLogout, isLoggingOut }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 px-4 sm:px-6 py-3 sm:py-4 bg-[#181818]/60 backdrop-blur-xl border-t border-white/10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="bg-spotify-green p-1.5 rounded-lg transform group-hover:rotate-12 transition-transform duration-300">
              <Zap className="w-5 h-5 text-black fill-black" />
            </div>
            <span className="text-base sm:text-xl font-black tracking-tighter uppercase italic">
              Unpaused
            </span>
          </Link>
        </div>

        {user && (
          <div className="flex items-center gap-2 sm:gap-6">
            <nav className="flex items-center gap-1 sm:gap-4 mr-2 sm:mr-4 border-r border-white/10 pr-4 sm:pr-8">
              <Link
                href="/history"
                className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-spotify-green transition-all"
              >
                <History className="w-4 h-4" />
                <span className="hidden md:inline">History</span>
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-xs font-black text-white leading-none capitalize">
                  {user.displayName}
                </span>
                <span className="text-[9px] font-bold text-spotify-green uppercase tracking-wider opacity-80">
                  {user.isTrusted ? 'Pro Member' : 'Player'}
                </span>
              </div>

              <motion.div
                className="relative group"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <div className="absolute inset-0 rounded-xl bg-spotify-green/20 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300" />

                <div className="relative w-9 h-9 rounded-xl bg-white/5 border border-white/10 group-hover:border-spotify-green transition-all duration-300 overflow-hidden">
                  {user.avatarUrl ? (
                    <>
                      <Image
                        src={user.avatarUrl}
                        alt={user.displayName}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        sizes="36px"
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-spotify-green/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 mix-blend-overlay" />
                    </>
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-br from-spotify-green/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="relative z-10 w-full h-full flex items-center justify-center text-sm font-black text-white">
                        {user.displayName[0]?.toUpperCase()}
                      </div>
                    </>
                  )}
                </div>

                <div className="absolute inset-0 rounded-xl border border-spotify-green/0 group-hover:border-spotify-green/40 transition-all duration-500 animate-pulse" />
              </motion.div>

              <motion.div whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onLogout}
                  disabled={isLoggingOut}
                  className="text-white/30 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export const AppHeader = memo(AppHeaderComponent);
