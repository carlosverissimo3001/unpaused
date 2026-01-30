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
    } catch (error) {
      // Error is handled by mutation state
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-8 max-w-lg">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
            Song guessing,
            <br />
            <span className="text-spotify-green">reimagined.</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Connect your Spotify account to get started.
          </p>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-not-allowed">
                <Button
                  variant="spotify"
                  size="lg"
                  asChild
                  className="text-base opacity-50 pointer-events-none"
                >
                  <div role="button" aria-disabled="true" className="mt-4">
                    <Image
                      src="/spotify-icon.svg"
                      alt="Spotify"
                      width={24}
                      height={24}
                      className="mr-2"
                    />
                    Continue with Spotify
                  </div>
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[250px] text-center">
              <p>Spotify has temporarily disabled new app integrations. Use the token field below to play!</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {process.env.NODE_ENV === "development" && (
          <div className="pt-4 space-y-4">
            <div className="border-t border-white/10 pt-4">
              <p className="text-xs text-muted-foreground mb-2">
                Or paste a Spotify access token:
              </p>
              <div className="flex gap-2 max-w-sm mx-auto">
                <input
                  type="text"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleTokenLogin();
                  }}
                  placeholder="Paste token..."
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-spotify-green/50"
                />
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTokenLogin}
                    disabled={!tokenInput.trim() || isTokenLoginPending}
                  >
                    {isTokenLoginPending ? "..." : "Login"}
                  </Button>
                </motion.div>
              </div>
              {tokenLoginError && (
                <p className="text-xs text-destructive mt-2">
                  {tokenLoginError.message || "Invalid or expired token"}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const UnauthenticatedView = memo(UnauthenticatedViewComponent);
