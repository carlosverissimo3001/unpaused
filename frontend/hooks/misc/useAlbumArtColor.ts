"use client";

import { useState, useEffect } from "react";
import { FastAverageColor } from "fast-average-color";

const fac = new FastAverageColor();

const SPOTIFY_GREEN_RGBA = "rgba(29, 185, 84, 0.15)";

export function useAlbumArtColor(imageUrl: string | null | undefined) {
  const [color, setColor] = useState(SPOTIFY_GREEN_RGBA);

  useEffect(() => {
    if (!imageUrl) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Resetting color on imageUrl change
      setColor(SPOTIFY_GREEN_RGBA);
      return;
    }

    let isCurrent = true;

    fac
      .getColorAsync(imageUrl, {
        ignoredColor: [
          [255, 255, 255, 255],
          [0, 0, 0, 255],
        ],
      })
      .then((res) => {
        if (isCurrent) {
          const [r, g, b] = res.value;
          setColor(`rgba(${r}, ${g}, ${b}, 0.25)`);
        }
      })
      .catch(() => {
        if (isCurrent) setColor(SPOTIFY_GREEN_RGBA);
      });

    return () => {
      isCurrent = false;
    };
  }, [imageUrl]);

  return color;
}
