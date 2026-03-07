'use client';

import { memo } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';

const isDev = process.env.NODE_ENV === 'development';

interface UnauthenticatedViewProps {
  onTokenLogin: (token: string) => Promise<void>;
  tokenInput: string;
  setTokenInput: (value: string) => void;
  isTokenLoginPending: boolean;
  tokenLoginError?: Error | null;
}

function UnauthenticatedViewComponent({
  onTokenLogin,
  tokenInput,
  setTokenInput,
  isTokenLoginPending,
  tokenLoginError,
}: UnauthenticatedViewProps) {
  const handleTokenLogin = async () => {
    if (!tokenInput.trim()) return;
    try {
      await onTokenLogin(tokenInput.trim());
      setTokenInput('');
    } catch {
      // Token login failed - error is handled by onTokenLogin
    }
  };

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center min-h-[80vh] overflow-visible">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 text-center flex flex-col gap-8 sm:gap-12 max-w-2xl px-6"
      >
        <div className="flex flex-col gap-4 sm:gap-6">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter text-fg leading-[0.9]">
            Song guessing,
            <br />
            <span className="text-spotify-green drop-shadow-[0_0_40px_rgba(30,215,96,0.35)]">
              reimagined.
            </span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-fg/50 max-w-[280px] sm:max-w-md mx-auto leading-relaxed font-medium">
            Test your musical ear. Connect your Spotify account and start the
            challenge.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4 sm:gap-6">
          <a href="/api/auth/login" className="relative group">
            <div className="absolute -inset-1 bg-spotify-green/10 rounded-full blur-md opacity-0 group-hover:opacity-100 transition duration-500" />
            <Button
              variant="spotify"
              className="relative !h-12 sm:!h-16 px-8 sm:px-10 !rounded-full text-sm sm:text-base font-bold transition-all duration-500 w-fit min-w-[240px] shadow-xl"
            >
              <Image
                src="/spotify-icon.svg"
                alt="Spotify"
                width={24}
                height={24}
                className="mr-3 shrink-0"
              />
              Continue with Spotify
            </Button>
          </a>

          {isDev && (
            <div className="w-full max-w-sm flex flex-col gap-4 pt-4 sm:pt-8 border-t border-fg/5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-fg/30 font-bold text-center">
                Developer Access
              </p>

              <div className="relative flex items-center p-1.5 bg-fg/[0.03] backdrop-blur-xl rounded-full border border-fg/10 focus-within:border-spotify-green/40 focus-within:bg-fg/[0.06] transition-all duration-500 shadow-2xl">
                <input
                  autoFocus
                  inputMode="text"
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleTokenLogin();
                  }}
                  placeholder="Paste access token..."
                  className="flex-1 bg-transparent pl-4 pr-2 py-2 text-sm outline-none placeholder:text-fg/10 text-fg min-w-0"
                />

                <Button
                  onClick={handleTokenLogin}
                  disabled={!tokenInput.trim() || isTokenLoginPending}
                  className={`
                    !h-8 sm:!h-10
                    px-5 sm:px-8
                    !rounded-full
                    bg-white !text-black
                    hover:bg-spotify-green transition-all duration-300
                    shadow-lg active:scale-95 disabled:opacity-30
                    shrink-0 border-none
                  `}
                >
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest">
                    {isTokenLoginPending ? '...' : 'Login'}
                  </span>
                </Button>
              </div>

              <AnimatePresence>
                {tokenLoginError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-red-400 text-[10px] sm:text-xs font-medium mt-1 flex items-center justify-center gap-2"
                  >
                    <div className="w-1 h-1 rounded-full bg-red-400" />
                    {tokenLoginError.message || 'Invalid or expired token'}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export const UnauthenticatedView = memo(UnauthenticatedViewComponent);
