"use client";

import { memo, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Play, Lock, Globe, ListMusic } from "lucide-react";
import type { PlaylistDto } from "@/sdk";

interface PlaylistCardProps {
  playlist: PlaylistDto;
  index: number;
  onHover?: (color: string | null) => void;
}

// Extract a muted color from image URL hash for ambient glow
function getColorFromImage(imageUrl: string | null | undefined): string {
  if (!imageUrl) return "rgba(30, 215, 96, 0.1)"; // Default Spotify green
  
  // Simple hash-based color extraction
  let hash = 0;
  for (let i = 0; i < imageUrl.length; i++) {
    hash = imageUrl.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate muted colors (not too bright)
  const hue = Math.abs(hash % 360);
  const saturation = 40 + (Math.abs(hash) % 30); // 40-70%
  const lightness = 20 + (Math.abs(hash) % 15); // 20-35%
  
  return `hsla(${hue}, ${saturation}%, ${lightness}%, 0.15)`;
}

function PlaylistCardComponent({ playlist, index, onHover }: PlaylistCardProps) {
  const imageUrl = playlist.imageUrl;
  const [isHovered, setIsHovered] = useState(false);
  const ambientColor = getColorFromImage(imageUrl);

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHover?.(ambientColor);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHover?.(null);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ 
        opacity: 0, 
        scale: 0.95, 
        position: "absolute",
        transition: { duration: 0.2, ease: "easeInOut" } 
      }}
      transition={{
        layout: { type: "tween", ease: "easeInOut", duration: 0.2 },
        opacity: { duration: 0.2 },
        y: { type: "tween", ease: "easeInOut", duration: 0.2, delay: index * 0.05 },
      }}
      whileHover={{
        scale: 1.03,
        y: -4, // Lift the card
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 20,
        },
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ 
        willChange: "transform, opacity",
        transform: "translateZ(0)", // GPU acceleration
      }}
      className="group relative bg-white/[0.03] backdrop-blur-sm rounded-xl p-4 text-left border border-white/10 hover:border-spotify-green transition-all duration-300"
    >
      {/* Inner Glow on Hover */}
      <motion.div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none"
        style={{
          boxShadow: isHovered 
            ? `inset 0 0 20px rgba(30, 215, 96, 0.15), 0 0 25px ${ambientColor}, 0 0 15px rgba(30, 215, 96, 0.1)`
            : "none",
          transition: "opacity 0.3s ease",
        }}
      />

      <div className="flex gap-4 relative z-10">
        {/* Playlist image - Larger with rounded-lg */}
        <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-white/10 flex-shrink-0 group-hover:opacity-90 transition-opacity duration-300">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={playlist.name}
              fill
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ListMusic className="w-10 h-10 text-white/40" />
            </div>
          )}
        
        </div>

        {/* Playlist info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {/* Title - Bold, larger, line-clamp-1 */}
            <h3 className="font-bold text-base line-clamp-1 text-white mb-1">
              {playlist.name}
            </h3>
            {/* Secondary Info - Smaller, muted */}
            <p className="text-xs text-white/50 truncate mb-2">
              {playlist.description || `By ${playlist.owner}`}
            </p>
          </div>
          
          {/* Metadata Row */}
          <div className="flex items-center gap-3 text-xs text-white/50">
            <span>{playlist.totalTracks} tracks</span>
            <span className="flex items-center gap-1">
              {playlist.isPublic ? (
                <Globe className="w-3.5 h-3.5" />
              ) : (
                <Lock className="w-3.5 h-3.5" />
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 relative z-10">
        <motion.div whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.02, color: ambientColor }}>
          <Link
            href={`/game/${playlist.id}`}
            className="flex items-center justify-center gap-2 w-full bg-white/5 group-hover:bg-spotify-green text-white/70 group-hover:text-black font-medium py-2 px-3 rounded-lg text-sm transition-all duration-200 border border-white/10 group-hover:border-spotify-green"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Play</span>
          </Link>
        </motion.div>
      </div>
    </motion.div>
  );
}

export const PlaylistCard = memo(PlaylistCardComponent, (prevProps, nextProps) => {
  // Only re-render if playlist data actually changes
  return prevProps.playlist.id === nextProps.playlist.id &&
         prevProps.playlist.name === nextProps.playlist.name &&
         prevProps.playlist.imageUrl === nextProps.playlist.imageUrl &&
         prevProps.playlist.totalTracks === nextProps.playlist.totalTracks &&
         prevProps.playlist.isPublic === nextProps.playlist.isPublic &&
         prevProps.index === nextProps.index;
});
