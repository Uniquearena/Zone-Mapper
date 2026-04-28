import type { RouteOption, RouteSegment } from "@workspace/api-client-react";

export type LatLng = { lat: number; lng: number };

const EARTH_R_KM = 6371;

export function haversineKm(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_R_KM * Math.asin(Math.sqrt(h));
}

/**
 * Cumulative distance from the start of the polyline at each vertex.
 */
export function cumulativeKm(geometry: [number, number][]): number[] {
  const out: number[] = new Array(geometry.length).fill(0);
  for (let i = 1; i < geometry.length; i++) {
    const prev = { lat: geometry[i - 1][0], lng: geometry[i - 1][1] };
    const cur = { lat: geometry[i][0], lng: geometry[i][1] };
    out[i] = out[i - 1] + haversineKm(prev, cur);
  }
  return out;
}

/**
 * Index of the polyline vertex closest to the given position.
 */
export function closestIndex(
  pos: LatLng,
  geometry: [number, number][],
): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < geometry.length; i++) {
    const d = haversineKm(pos, { lat: geometry[i][0], lng: geometry[i][1] });
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/**
 * Linearly interpolate a point at distance `km` along the polyline.
 */
export function pointAtKm(
  geometry: [number, number][],
  cum: number[],
  km: number,
): { pos: LatLng; index: number } {
  if (geometry.length === 0) return { pos: { lat: 0, lng: 0 }, index: 0 };
  if (km <= 0)
    return {
      pos: { lat: geometry[0][0], lng: geometry[0][1] },
      index: 0,
    };
  const total = cum[cum.length - 1];
  if (km >= total)
    return {
      pos: {
        lat: geometry[geometry.length - 1][0],
        lng: geometry[geometry.length - 1][1],
      },
      index: geometry.length - 1,
    };
  // Binary search for the segment containing `km`.
  let lo = 0;
  let hi = cum.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= km) lo = mid;
    else hi = mid;
  }
  const segLen = cum[hi] - cum[lo];
  const t = segLen > 0 ? (km - cum[lo]) / segLen : 0;
  const lat = geometry[lo][0] + (geometry[hi][0] - geometry[lo][0]) * t;
  const lng = geometry[lo][1] + (geometry[hi][1] - geometry[lo][1]) * t;
  return { pos: { lat, lng }, index: lo };
}

export interface HazardAhead {
  segment: RouteSegment;
  distanceKm: number;
  indexInRoute: number;
}

export interface JourneyState {
  totalKm: number;
  progressKm: number;
  position: LatLng;
  /** Status at the user's current location (closest sample). */
  currentStatus: RouteSegment["status"];
  /** Next dead zone ahead within the lookahead window, if any. */
  nextDead: HazardAhead | null;
  /** Next moderate-or-worse zone ahead (used when no dead ahead). */
  nextWeak: HazardAhead | null;
}

/**
 * Compute progress + upcoming hazards for the active position along a route.
 * `position` should already be projected onto the route (we compute progressKm
 * from its closest geometry vertex).
 */
export function computeJourneyState(
  route: RouteOption,
  position: LatLng,
  lookaheadKm = 8,
): JourneyState {
  const cum = cumulativeKm(route.geometry as [number, number][]);
  const total = cum[cum.length - 1] ?? 0;
  const idx = closestIndex(position, route.geometry as [number, number][]);
  const progressKm = cum[idx] ?? 0;

  // Map each segment sample to its distance-along-route
  const segWithDist = route.segments.map((s) => {
    const segIdx = closestIndex(
      { lat: s.latitude, lng: s.longitude },
      route.geometry as [number, number][],
    );
    return { seg: s, distAlong: cum[segIdx] ?? 0, idx: segIdx };
  });

  // Current status = nearest segment to user
  let currentStatus: RouteSegment["status"] = "unknown";
  let nearestD = Infinity;
  for (const s of segWithDist) {
    const d = Math.abs(s.distAlong - progressKm);
    if (d < nearestD) {
      nearestD = d;
      currentStatus = s.seg.status;
    }
  }

  let nextDead: HazardAhead | null = null;
  let nextWeak: HazardAhead | null = null;
  for (const s of segWithDist) {
    const ahead = s.distAlong - progressKm;
    if (ahead <= 0.05 || ahead > lookaheadKm) continue;
    if (s.seg.status === "dead" && !nextDead) {
      nextDead = { segment: s.seg, distanceKm: ahead, indexInRoute: s.idx };
    }
    if (
      (s.seg.status === "dead" || s.seg.status === "moderate") &&
      !nextWeak
    ) {
      nextWeak = { segment: s.seg, distanceKm: ahead, indexInRoute: s.idx };
    }
    if (nextDead && nextWeak) break;
  }

  return {
    totalKm: total,
    progressKm,
    position,
    currentStatus,
    nextDead,
    nextWeak,
  };
}
