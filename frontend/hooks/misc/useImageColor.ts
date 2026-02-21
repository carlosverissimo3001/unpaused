'use client';

import { useState, useEffect, useMemo } from 'react';
import { FastAverageColor } from 'fast-average-color';

const fac = new FastAverageColor();

const DEFAULT_FALLBACK = 'rgba(29, 185, 84, 0.15)';
const DEFAULT_ALPHA = 0.25;

export interface UseImageColorOptions {
  fallback?: string;
  alpha?: number;
}

export function useImageColor(
  imageUrl: string | null | undefined,
  options?: UseImageColorOptions,
) {
  const { fallback = DEFAULT_FALLBACK, alpha = DEFAULT_ALPHA } = options ?? {};
  const [color, setColor] = useState(fallback);

  const stableOptions = useMemo(() => ({ fallback, alpha }), [fallback, alpha]);

  useEffect(() => {
    if (!imageUrl) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Resetting color when imageUrl becomes null
      setColor(stableOptions.fallback);
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
          setColor(`rgba(${r}, ${g}, ${b}, ${stableOptions.alpha})`);
        }
      })
      .catch(() => {
        if (isCurrent) setColor(stableOptions.fallback);
      });

    return () => {
      isCurrent = false;
    };
  }, [imageUrl, stableOptions]);

  return color;
}
