"use client";

import { motion } from "framer-motion";
import { Disc3 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: {
    container: "h-8 w-8",
    disc: "w-4 h-4",
    border: "border-2",
  },
  md: {
    container: "h-12 w-12",
    disc: "w-6 h-6",
    border: "border-2",
  },
  lg: {
    container: "h-14 w-14",
    disc: "w-7 h-7",
    border: "border-[3px]",
  },
};

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  const sizes = sizeClasses[size];

  return (
    <div className={`relative ${sizes.container} ${className}`}>
      <motion.div
        className={`absolute inset-0 rounded-full ${sizes.border} border-[#1DB954] border-t-transparent`}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        <Disc3 className={`${sizes.disc} text-spotify-green`} />
      </div>
    </div>
  );
}
