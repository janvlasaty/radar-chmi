import { useCallback, useEffect, useRef, useState } from "react";
import type { RadarProduct } from "../lib/radar";
import {
  generateTimestamps,
  intervalMinutes,
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

function revokeAll(images: Map<number, ImageEntry>) {
  for (const entry of images.values()) {
    if (entry.objectUrl) URL.revokeObjectURL(entry.objectUrl);
  }
}

export function useRadarImages(product: RadarProduct) {
  const [images, setImages] = useState<Map<number, ImageEntry>>(new Map());
  const [timestamps, setTimestamps] = useState<Date[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const timestampsRef = useRef<Date[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    timestampsRef.current = timestamps;
  }, [timestamps]);

  const loadImages = useCallback(
    async (prod: RadarProduct) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      const ts = generateTimestamps(prod);
      setTimestamps(ts);

      // Revoke old object URLs before replacing
      setImages((prev) => {
        revokeAll(prev);
        return new Map();
      });

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

  /** Fetch only new frames without resetting user's current selection */
  const pollForUpdates = useCallback(
    async (prod: RadarProduct) => {
      const newTs = generateTimestamps(prod);
      const prevTs = timestampsRef.current;

      const prevSet = new Set(prevTs.map((t) => t.getTime()));
      const added = newTs.filter((t) => !prevSet.has(t.getTime()));

      if (added.length === 0) return;

      // Find how many old timestamps fell off the beginning
      const newSet = new Set(newTs.map((t) => t.getTime()));
      const droppedCount = prevTs.filter((t) => !newSet.has(t.getTime())).length;

      // Adjust selectedIndex: shift back by dropped count, keep user's frame
      setSelectedIndex((prevIdx) => {
        const adjusted = prevIdx - droppedCount;
        return Math.max(0, Math.min(adjusted, newTs.length - 1));
      });

      setTimestamps(newTs);

      // Fetch images for new timestamps only
      for (const t of added) {
        const url = radarUrl(prod, t);
        const objectUrl = await fetchAndCacheImage(url);
        setImages((prev) => {
          const next = new Map(prev);
          next.set(t.getTime(), { timestamp: t, objectUrl });
          return next;
        });
      }

      // Remove stale entries from images map
      setImages((prev) => {
        let changed = false;
        for (const key of prev.keys()) {
          if (!newSet.has(key)) {
            changed = true;
            break;
          }
        }
        if (!changed) return prev;
        const next = new Map<number, ImageEntry>();
        for (const [key, val] of prev) {
          if (newSet.has(key)) {
            next.set(key, val);
          } else if (val.objectUrl) {
            URL.revokeObjectURL(val.objectUrl);
          }
        }
        return next;
      });

      await cleanOldImages();
    },
    [],
  );

  useEffect(() => {
    loadImages(product);
    return () => {
      abortRef.current?.abort();
      setImages((prev) => {
        revokeAll(prev);
        return new Map();
      });
    };
  }, [product, loadImages]);

  // Periodic polling for new data
  useEffect(() => {
    const pollIntervalMs = intervalMinutes(product) * 60 * 1000;
    const id = setInterval(() => {
      pollForUpdates(product);
    }, pollIntervalMs);

    return () => clearInterval(id);
  }, [product, pollForUpdates]);

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
