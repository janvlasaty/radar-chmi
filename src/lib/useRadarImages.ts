import { useCallback, useEffect, useRef, useState } from "react";
import type { RadarProduct } from "../lib/radar";
import {
  generateTimestamps,
  radarUrl,
  RADAR_BOUNDS,
} from "../lib/radar";
import {
  fetchAndCacheImage,
  cleanOldImages,
} from "../lib/storage";

interface ImageEntry {
  timestamp: Date;
  objectUrl: string | null;
}

export function useRadarImages(product: RadarProduct) {
  const [images, setImages] = useState<Map<number, ImageEntry>>(new Map());
  const [timestamps, setTimestamps] = useState<Date[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const loadImages = useCallback(
    async (prod: RadarProduct) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      const ts = generateTimestamps(prod);
      setTimestamps(ts);

      // Load latest first for quick display
      const latestTs = ts[ts.length - 1];
      if (latestTs) {
        const url = radarUrl(prod, latestTs);
        const objectUrl = await fetchAndCacheImage(url);
        if (controller.signal.aborted) return;
        setImages(
          new Map([[latestTs.getTime(), { timestamp: latestTs, objectUrl }]]),
        );
        setSelectedIndex(ts.length - 1);
        setLoading(false);
      }

      // Load the rest in background (newest to oldest)
      const remaining = ts.slice(0, -1).reverse();
      for (const t of remaining) {
        if (controller.signal.aborted) return;
        const url = radarUrl(prod, t);
        const objectUrl = await fetchAndCacheImage(url);
        if (controller.signal.aborted) return;
        setImages((prev) => {
          const next = new Map(prev);
          next.set(t.getTime(), { timestamp: t, objectUrl });
          return next;
        });
      }

      // Cleanup old cache entries
      await cleanOldImages();
    },
    [],
  );

  useEffect(() => {
    loadImages(product);
    return () => {
      abortRef.current?.abort();
    };
  }, [product, loadImages]);

  const currentImage = timestamps[selectedIndex]
    ? images.get(timestamps[selectedIndex].getTime())?.objectUrl ?? null
    : null;

  return {
    timestamps,
    selectedIndex,
    setSelectedIndex,
    currentImage,
    loading,
    radarBounds: RADAR_BOUNDS,
    refresh: () => loadImages(product),
  };
}
