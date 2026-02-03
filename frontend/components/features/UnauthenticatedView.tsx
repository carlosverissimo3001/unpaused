"use client";

import { memo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
      setTokenInput("");
    } catch (error) {}
  };

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center min-h-[80vh] overflow-visible">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-spotify-green/20 rounded-full blur-[120px] pointer-events-none"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 text-center space-y-10 max-w-2xl px-6"
      >
        <div className="space-y-6">
          <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-white">
            Song guessing,
            <br />
            <span className="text-spotify-green drop-shadow-[0_0_35px_rgba(30,215,96,0.3)]">
              reimagined.
            </span>
          </h1>
          <p className="text-xl text-white/60 max-w-md mx-auto leading-relaxed">
            Test your musical ear. Connect your Spotify account and start the challenge.
          </p>
        </div>

        <div className="flex flex-col items-center gap-6">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative group">
                  <div className="absolute -inset-1 bg-spotify-green/20 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-500" />

                  <Button
                    variant="spotify"
                    size="lg"
                    className="relative text-lg px-8 py-7 rounded-full transition-all duration-300 opacity-50 grayscale cursor-not-allowed"
                  >
                    <Image
                      src="/spotify-icon.svg"
                      alt="Spotify"
                      width={24}
                      height={24}
                      className="mr-3"
                    />
                    Continue with Spotify
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-zinc-900 border-white/10 text-white p-4">
                <p className="text-sm">
                  Spotify API is currently restricted. <br />
                  Use the <b>Access Token</b> method below!
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="w-full max-w-sm space-y-4 pt-8 border-t border-white/5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold text-center">
              Developer Access
            </p>

            <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl focus-within:border-spotify-green/40 transition-all duration-300">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleTokenLogin();
                }}
                placeholder="Paste access token..."
                className="flex-1 bg-transparent px-4 py-2 text-sm outline-none placeholder:text-white/20 text-white"
              />

              <motion.div whileTap={{ scale: 0.96 }}>
                <Button
                  size="sm"
                  onClick={handleTokenLogin}
                  disabled={!tokenInput.trim() || isTokenLoginPending}
                  className="h-8 rounded-xl bg-white px-4 text-xs font-bold shadow-lg transition-all hover:bg-zinc-200 active:scale-95 disabled:opacity-50"
                >
                  <span className="text-black"> {isTokenLoginPending ? "..." : "Login"}</span>
                </Button>
              </motion.div>
            </div>

            {tokenLoginError && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-[11px] text-red-400/80 font-medium"
              >
                {tokenLoginError.message || "Invalid or expired token"}
              </motion.p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export const UnauthenticatedView = memo(UnauthenticatedViewComponent);
