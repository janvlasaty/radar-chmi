export type RadarProduct = "maxz" | "merge1h";

/**
 * CHMI's opendata server does not send CORS headers, so a cross-origin
 * `fetch()` (e.g. from GitHub Pages) is blocked by the browser. Routing the
 * request through a CORS proxy adds the missing `Access-Control-Allow-Origin`
 * header. Defaults to the free images.weserv.nl image proxy; override with the
 * `VITE_CORS_PROXY` env var (set it to an empty string to disable proxying).
 */
const CORS_PROXY =
  import.meta.env.VITE_CORS_PROXY ?? "https://images.weserv.nl/?url=";

/** Wrap a URL with the configured CORS proxy (no-op if the proxy is empty). */
export function withCorsProxy(url: string): string {
  if (!CORS_PROXY) return url;
  return `${CORS_PROXY}${encodeURIComponent(url)}`;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function fmt(d: Date) {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}.${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}`;
}

export function maxzUrl(now = new Date()) {
  const d = new Date(now);
  d.setUTCMinutes(Math.floor(d.getUTCMinutes() / 5) * 5, 0, 0);
  return `https://opendata.chmi.cz/meteorology/weather/radar/composite/maxz/png_masked/pacz2gmaps3.z_max3d.${fmt(d)}.0.png`;
}

export function merge1hUrl(now = new Date()) {
  const d = new Date(now);
  d.setUTCMinutes(Math.floor(d.getUTCMinutes() / 10) * 10, 0, 0);
  return `https://opendata.chmi.cz/meteorology/weather/radar/composite/merge1h/png/pacz2gmaps3.merge.${fmt(d)}.60.png`;
}

export function radarUrl(product: RadarProduct, time: Date): string {
  return product === "maxz" ? maxzUrl(time) : merge1hUrl(time);
}

/** Interval in minutes between frames for each product */
export function intervalMinutes(product: RadarProduct): number {
  return product === "maxz" ? 5 : 10;
}

/** Generate timestamps for the last 6 hours, aligned to the product interval */
export function generateTimestamps(
  product: RadarProduct,
  now = new Date(),
): Date[] {
  const interval = intervalMinutes(product);
  const aligned = new Date(now);
  aligned.setUTCMinutes(Math.floor(aligned.getUTCMinutes() / interval) * interval, 0, 0);

  const sixHoursAgo = new Date(aligned.getTime() - 6 * 60 * 60 * 1000);
  const timestamps: Date[] = [];
  const current = new Date(sixHoursAgo);

  while (current <= aligned) {
    timestamps.push(new Date(current));
    current.setUTCMinutes(current.getUTCMinutes() + interval);
  }

  return timestamps;
}

/** The radar overlay bounding box (CHMI Google Maps overlay bounds) */
export const RADAR_BOUNDS: [[number, number], [number, number]] = [
  [47.0, 11.0],
  [52.5, 20.5],
];
