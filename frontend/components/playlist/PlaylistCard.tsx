"use client";

import { memo, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Play, Lock, Globe, ListMusic } from "lucide-react";
import type { PlaylistDto } from "@/sdk";
import { usePlaylistColor } from "@/hooks/misc/usePlaylistColor";

interface PlaylistCardProps {
  playlist: PlaylistDto;
  index: number;
  onHover?: (color: string | null) => void;
}

function PlaylistCardComponent({ playlist, onHover }: PlaylistCardProps) {
  const imageUrl = playlist.imageUrl;
  const [isHovered, setIsHovered] = useState(false);
  const ambientColor = usePlaylistColor(imageUrl);

  const glowColor = ambientColor.replace('0.15', '0.1').replace('0.1', '0.08');

  return (
    <Link href={`/game/${playlist.id}`}>
      <motion.div
        onMouseEnter={() => { setIsHovered(true); onHover?.(ambientColor); }}
        onMouseLeave={() => { setIsHovered(false); onHover?.(null); }}
        whileHover={{ y: -12 }}
        className="group relative bg-[#181818]/40 backdrop-blur-md rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-white/5 transition-all duration-500 hover:bg-white/[0.08] max-w-[400px] mx-auto w-full h-full md:h-auto transform-gpu"
        style={{
          boxShadow: isHovered
            ? `0 30px 60px -12px rgba(0,0,0,0.6), 0 0 20px ${glowColor}`
            : "0 10px 30px -15px rgba(0,0,0,0.3)",
          backfaceVisibility: 'hidden',
        }}
      >
        <div className="flex flex-col relative z-10 h-full">
          
          <div className="relative aspect-square w-full rounded-lg sm:rounded-xl overflow-hidden mb-3 sm:mb-5 shadow-2xl">
            {imageUrl ? (
              <Image 
                src={imageUrl} 
                alt="" 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-110" 
              />
            ) : (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                <ListMusic className="text-white/10 w-12 h-12" />
              </div>
            )}
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0.8 }}
              className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]"
            >
              <div className="bg-spotify-green p-4 rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.5)] text-black transform group-hover:scale-110 transition-transform">
                <Play fill="currentColor" className="w-8 h-8 ml-1" />
              </div>
            </motion.div>
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <h3 className="font-black text-sm sm:text-xl text-white line-clamp-1 leading-tight group-hover:text-spotify-green transition-colors">
              {playlist.name}
            </h3>
            
            <p className="text-xs sm:text-sm text-white/40 font-medium line-clamp-1 mt-0.5 sm:mt-1">
              {playlist.owner}
            </p>

            <div className="mt-auto pt-2 sm:pt-4 flex items-center justify-between text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.15em] text-white/20">
              <div className="flex items-center gap-1.5">
                <ListMusic className="w-3 h-3" />
                <span>{playlist.totalTracks} tracks</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                {playlist.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                <span>{playlist.isPublic ? "Public" : "Private"}</span>
              </div>
            </div>
          </div>
        </div>

        <div 
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ 
            background: `linear-gradient(to bottom, ${ambientColor}, transparent 40%)`,
            maskImage: 'linear-gradient(to bottom, black, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
            opacity: 0.2
          }}
        />
      </motion.div>
    </Link>
  );
}

export const PlaylistCard = memo(PlaylistCardComponent);