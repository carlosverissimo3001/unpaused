"use client";

import { memo } from "react";
import { motion } from "framer-motion";

interface ErrorBannerProps {
  error: string | null;
  onDismiss?: () => void;
}

function ErrorBannerComponent({ error, onDismiss }: ErrorBannerProps) {
  if (!error) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm max-w-md mx-auto"
    >
      {error}
    </motion.div>
  );
}

export const ErrorBanner = memo(ErrorBannerComponent);
