'use client';

import { useRef, useCallback } from 'react';
import { Volume2, Volume1, VolumeX } from 'lucide-react';

interface VolumeSliderProps {
  volume: number;
  onVolumeChange: (v: number) => void;
}

export function VolumeSlider({ volume, onVolumeChange }: VolumeSliderProps) {
  const previousVolumeRef = useRef(volume || 0.3);

  const toggleMute = useCallback(() => {
    if (volume > 0) {
      previousVolumeRef.current = volume;
      onVolumeChange(0);
    } else {
      onVolumeChange(previousVolumeRef.current || 0.3);
    }
  }, [volume, onVolumeChange]);

  const Icon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="grid grid-cols-[28px_minmax(0,1fr)_28px] items-center gap-1.5 w-[160px]">
      <button
        type="button"
        onClick={toggleMute}
        className="w-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors py-1"
        aria-label={volume === 0 ? 'Unmute' : 'Mute'}
      >
        <Icon className="w-4 h-4 text-white/70" />
      </button>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(e) => onVolumeChange(Number(e.target.value))}
        className="volume-slider m-0 w-full h-1 appearance-none bg-white/20 rounded-full outline-none cursor-pointer"
        aria-label="Volume"
        style={{
          background: `linear-gradient(to right, #1DB954 0%, #1DB954 ${volume * 100}%, rgba(255,255,255,0.2) ${volume * 100}%, rgba(255,255,255,0.2) 100%)`,
        }}
      />
      <span className="text-[11px] tabular-nums text-white/40 w-7 text-center select-none">
        {Math.round(volume * 100)}
      </span>
      <style>{`
        .volume-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        .volume-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </div>
  );
}
