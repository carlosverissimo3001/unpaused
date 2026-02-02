import { useState, useEffect } from "react";
import { FastAverageColor } from "fast-average-color";

const fac = new FastAverageColor();

export function usePlaylistColor(imageUrl: string | null | undefined) {
  const [color, setColor] = useState("rgba(30, 215, 96, 0.1)");

  useEffect(() => {
    if (!imageUrl) {
      return;
    }

    let isCurrent = true;

    fac.getColorAsync(imageUrl, {
      ignoredColor: [
        [255, 255, 255, 255], // white (RGBA)
        [0, 0, 0, 255],       // black (RGBA)
      ], 
    })
      .then(res => {
        if (isCurrent) {
          setColor(`${res.hex}26`); 
        }
      })
      .catch(() => {
        if (isCurrent) setColor("rgba(30, 215, 96, 0.1)");
      });

    return () => {
      isCurrent = false;
    };
  }, [imageUrl]);

  return color;
}